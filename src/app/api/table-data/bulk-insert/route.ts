import { NextRequest, NextResponse } from "next/server";

import { ApiResponse } from "@/types/api";
import { BulkDataInsertRequest, BulkDataInsertResult, TableDataValidationError } from "@/types/tableData";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/table-data/bulk-insert
 * Insert multiple table data rows at once
 * Body: { table_id, rows, validate_data?, skip_errors? }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      return NextResponse.json(
        {
          success: false,
          message: "인증이 필요합니다",
          data: null,
        } as ApiResponse,
        { status: 401 }
      );
    }

    // 요청 바디 파싱
    const body: BulkDataInsertRequest = await request.json();

    if (!body.table_id) {
      return NextResponse.json(
        {
          success: false,
          message: "테이블 ID가 필요합니다",
          data: null,
        } as ApiResponse,
        { status: 400 }
      );
    }

    if (!Array.isArray(body.rows) || body.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "삽입할 행 데이터 배열이 필요합니다",
          data: null,
        } as ApiResponse,
        { status: 400 }
      );
    }

    if (body.rows.length > 1000) {
      return NextResponse.json(
        {
          success: false,
          message: "한 번에 최대 1000개의 행만 삽입할 수 있습니다",
          data: null,
        } as ApiResponse,
        { status: 400 }
      );
    }

    // 테이블 소유권 확인 및 컬럼 정보 가져오기
    const { data: tableInfo, error: tableError } = await supabase
      .from("database_tables")
      .select(`
        id,
        table_name,
        project_id,
        database_projects!inner(user_email),
        table_columns(
          column_name,
          data_type,
          is_nullable,
          is_primary_key,
          default_value
        )
      `)
      .eq("id", body.table_id)
      .eq("database_projects.user_email", user.email)
      .single();

    if (tableError || !tableInfo) {
      return NextResponse.json(
        {
          success: false,
          message: "테이블을 찾을 수 없거나 접근 권한이 없습니다",
          data: null,
        } as ApiResponse,
        { status: 404 }
      );
    }

    const columns = tableInfo.table_columns || [];
    const requiredColumns = columns.filter(col => !col.is_nullable && !col.default_value);
    
    // Validate data if requested
    const errors: Array<{ row_index: number; errors: TableDataValidationError[] }> = [];
    const validRows: Array<{ row_data: Record<string, any>; row_index: number }> = [];

    for (let i = 0; i < body.rows.length; i++) {
      const rowData = body.rows[i];
      const rowErrors: TableDataValidationError[] = [];

      if (!rowData || typeof rowData !== "object") {
        rowErrors.push({
          column_name: "",
          error_type: "type_mismatch",
          message: "행 데이터는 객체여야 합니다",
        });
      } else if (body.validate_data !== false) {
        // 필수 컬럼 검증
        for (const requiredCol of requiredColumns) {
          const value = rowData[requiredCol.column_name];
          if (value === null || value === undefined || value === "") {
            rowErrors.push({
              column_name: requiredCol.column_name,
              error_type: "required",
              message: `필수 컬럼 '${requiredCol.column_name}'의 값이 필요합니다`,
            });
          }
        }

        // 기본 데이터 타입 검증
        for (const col of columns) {
          const value = rowData[col.column_name];
          if (value !== null && value !== undefined && value !== "") {
            // Simple type validation based on data_type
            if (col.data_type.includes("integer") && isNaN(parseInt(value))) {
              rowErrors.push({
                column_name: col.column_name,
                error_type: "type_mismatch",
                message: `컬럼 '${col.column_name}'은(는) 정수여야 합니다`,
              });
            }
            // Add more type validations as needed
          }
        }
      }

      if (rowErrors.length > 0) {
        errors.push({ row_index: i, errors: rowErrors });
        if (!body.skip_errors) {
          // Stop on first error if skip_errors is false
          break;
        }
      } else {
        validRows.push({ row_data: rowData, row_index: i });
      }
    }

    // If there are errors and skip_errors is false, return errors
    if (errors.length > 0 && !body.skip_errors) {
      const result: BulkDataInsertResult = {
        success_count: 0,
        error_count: errors.length,
        total_count: body.rows.length,
        errors,
        inserted_ids: [],
      };

      return NextResponse.json(
        {
          success: false,
          message: `${errors.length}개의 행에서 검증 오류가 발생했습니다`,
          data: result,
        } as ApiResponse<BulkDataInsertResult>,
        { status: 400 }
      );
    }

    // Get starting row_order
    const { data: maxOrderData } = await supabase
      .from("table_rows")
      .select("row_order")
      .eq("table_id", body.table_id)
      .order("row_order", { ascending: false })
      .limit(1)
      .single();
    
    let startingOrder = (maxOrderData?.row_order || 0) + 1;

    // Prepare data for insertion
    const insertData = validRows.map((item, index) => ({
      table_id: body.table_id,
      row_data: item.row_data,
      row_order: startingOrder + index,
      created_by: user.email,
      updated_by: user.email,
    }));

    let insertedIds: string[] = [];
    let successCount = 0;

    if (insertData.length > 0) {
      // Insert data in batches to avoid timeout
      const batchSize = 100;
      for (let i = 0; i < insertData.length; i += batchSize) {
        const batch = insertData.slice(i, i + batchSize);
        
        const { data: batchResult, error: batchError } = await supabase
          .from("table_rows")
          .insert(batch)
          .select("id");

        if (batchError) {
          console.error(`Bulk insert batch error (${i}-${i + batch.length - 1}):`, batchError);
          
          // If we're not skipping errors, return the error
          if (!body.skip_errors) {
            return NextResponse.json(
              {
                success: false,
                message: "일괄 삽입 중 오류가 발생했습니다",
                data: null,
              } as ApiResponse,
              { status: 500 }
            );
          }
        } else if (batchResult) {
          insertedIds.push(...batchResult.map(row => row.id));
          successCount += batchResult.length;
        }
      }
    }

    const result: BulkDataInsertResult = {
      success_count: successCount,
      error_count: errors.length,
      total_count: body.rows.length,
      errors,
      inserted_ids: insertedIds,
    };

    const status = successCount > 0 ? 201 : 400;
    const message = successCount > 0 
      ? `${successCount}개의 행이 성공적으로 삽입되었습니다${errors.length > 0 ? ` (${errors.length}개 실패)` : ''}`
      : "모든 행 삽입이 실패했습니다";

    return NextResponse.json(
      {
        success: successCount > 0,
        message,
        data: result,
      } as ApiResponse<BulkDataInsertResult>,
      { status }
    );
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "서버 내부 오류가 발생했습니다",
        data: null,
      } as ApiResponse,
      { status: 500 }
    );
  }
}