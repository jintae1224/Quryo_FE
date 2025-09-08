import { NextRequest, NextResponse } from "next/server";

import { ApiResponse } from "@/types/api";
import { TableRowData, TableDataRequest } from "@/types/tableData";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/table-data/create
 * Create a new table data row
 * Body: { table_id, row_data, row_order? }
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
    const body: TableDataRequest = await request.json();

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

    if (!body.row_data || typeof body.row_data !== "object") {
      return NextResponse.json(
        {
          success: false,
          message: "행 데이터가 필요합니다",
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

    // 기본 검증: 필수 컬럼 확인
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

    // Get next row_order if not provided
    let rowOrder = body.row_order;
    if (rowOrder === undefined) {
      const { data: maxOrderData } = await supabase
        .from("table_rows")
        .select("row_order")
        .eq("table_id", body.table_id)
        .order("row_order", { ascending: false })
        .limit(1)
        .single();
      
      rowOrder = (maxOrderData?.row_order || 0) + 1;
    }

    // 테이블 행 데이터 생성
    const { data: createdRow, error: insertError } = await supabase
      .from("table_rows")
      .insert({
        table_id: body.table_id,
        row_data: body.row_data,
        row_order: rowOrder,
        created_by: user.email,
        updated_by: user.email,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Table data creation error:", insertError);

      // Handle specific database errors
      if (insertError.code === "23502") {
        return NextResponse.json(
          {
            success: false,
            message: "필수 데이터가 누락되었습니다",
            data: null,
          } as ApiResponse,
          { status: 400 }
        );
      }

      if (insertError.code === "23503") {
        return NextResponse.json(
          {
            success: false,
            message: "외래키 제약 조건 위반: 참조된 데이터가 존재하지 않습니다",
            data: null,
          } as ApiResponse,
          { status: 400 }
        );
      }

      if (insertError.code === "23505") {
        return NextResponse.json(
          {
            success: false,
            message: "고유 제약 조건 위반: 중복된 값이 존재합니다",
            data: null,
          } as ApiResponse,
          { status: 409 }
        );
      }

      if (insertError.code === "42501") {
        return NextResponse.json(
          {
            success: false,
            message: "권한이 없습니다. 데이터베이스 관리자에게 문의하세요.",
            data: null,
          } as ApiResponse,
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: "데이터 생성에 실패했습니다",
          data: null,
        } as ApiResponse,
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "데이터가 성공적으로 생성되었습니다",
        data: createdRow,
      } as ApiResponse<TableRowData>,
      { status: 201 }
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