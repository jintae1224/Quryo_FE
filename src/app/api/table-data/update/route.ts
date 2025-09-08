import { NextRequest, NextResponse } from "next/server";

import { ApiResponse } from "@/types/api";
import { TableRowData, TableDataUpdateRequest } from "@/types/tableData";
import { createClient } from "@/utils/supabase/server";

/**
 * PUT /api/table-data/update?row_id={row_id}
 * Update an existing table data row
 * Body: { row_data, row_order? }
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const rowId = searchParams.get("row_id");

    if (!rowId) {
      return NextResponse.json(
        {
          success: false,
          message: "행 ID가 필요합니다",
          data: null,
        } as ApiResponse,
        { status: 400 }
      );
    }

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
    const body: TableDataUpdateRequest = await request.json();

    if (!body.row_data || typeof body.row_data !== "object") {
      return NextResponse.json(
        {
          success: false,
          message: "업데이트할 행 데이터가 필요합니다",
          data: null,
        } as ApiResponse,
        { status: 400 }
      );
    }

    // 행 존재 확인 및 소유권 검증
    const { data: existingRow, error: rowError } = await supabase
      .from("table_rows")
      .select(`
        id,
        table_id,
        row_data,
        row_order,
        database_tables!inner(
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
        )
      `)
      .eq("id", rowId)
      .eq("database_tables.database_projects.user_email", user.email)
      .single();

    if (rowError || !existingRow) {
      return NextResponse.json(
        {
          success: false,
          message: "행을 찾을 수 없거나 접근 권한이 없습니다",
          data: null,
        } as ApiResponse,
        { status: 404 }
      );
    }

    // 기본 검증: 필수 컬럼 확인
    const tableInfo = existingRow.database_tables;
    const columns = tableInfo.table_columns || [];
    const requiredColumns = columns.filter(col => !col.is_nullable && !col.default_value);
    
    for (const requiredCol of requiredColumns) {
      const value = body.row_data[requiredCol.column_name];
      if (value === null || value === undefined || value === "") {
        return NextResponse.json(
          {
            success: false,
            message: `필수 컬럼 '${requiredCol.column_name}'의 값이 필요합니다`,
            data: null,
          } as ApiResponse,
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      row_data: body.row_data,
      updated_by: user.email,
    };

    if (body.row_order !== undefined) {
      updateData.row_order = body.row_order;
    }

    // 행 데이터 업데이트
    const { data: updatedRow, error: updateError } = await supabase
      .from("table_rows")
      .update(updateData)
      .eq("id", rowId)
      .select()
      .single();

    if (updateError) {
      console.error("Table data update error:", updateError);

      // Handle specific database errors
      if (updateError.code === "23502") {
        return NextResponse.json(
          {
            success: false,
            message: "필수 데이터가 누락되었습니다",
            data: null,
          } as ApiResponse,
          { status: 400 }
        );
      }

      if (updateError.code === "23503") {
        return NextResponse.json(
          {
            success: false,
            message: "외래키 제약 조건 위반: 참조된 데이터가 존재하지 않습니다",
            data: null,
          } as ApiResponse,
          { status: 400 }
        );
      }

      if (updateError.code === "23505") {
        return NextResponse.json(
          {
            success: false,
            message: "고유 제약 조건 위반: 중복된 값이 존재합니다",
            data: null,
          } as ApiResponse,
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: "데이터 업데이트에 실패했습니다",
          data: null,
        } as ApiResponse,
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "데이터가 성공적으로 업데이트되었습니다",
        data: updatedRow,
      } as ApiResponse<TableRowData>,
      { status: 200 }
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