import { NextRequest, NextResponse } from "next/server";

import { ApiResponse } from "@/types/api";
import { ColumnBulkCreateRequest, ColumnData, ColumnRequest } from "@/types/column";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/column/create
 * Create a new column or multiple columns
 * Body: ColumnRequest or ColumnBulkCreateRequest
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
    const body = await request.json();
    
    // Bulk create 처리
    if ('columns' in body && Array.isArray(body.columns)) {
      const bulkRequest = body as ColumnBulkCreateRequest;
      
      if (!bulkRequest.table_id) {
        return NextResponse.json(
          {
            success: false,
            message: "테이블 ID가 필요합니다",
            data: null,
          } as ApiResponse,
          { status: 400 }
        );
      }

      if (!bulkRequest.columns || bulkRequest.columns.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "최소 하나 이상의 컬럼이 필요합니다",
            data: null,
          } as ApiResponse,
          { status: 400 }
        );
      }

      // 테이블 소유권 확인
      const { data: table, error: tableError } = await supabase
        .from("database_tables")
        .select(`
          id,
          database_projects!inner (
            user_email
          )
        `)
        .eq("id", bulkRequest.table_id)
        .eq("database_projects.user_email", user.email)
        .single();

      if (tableError || !table) {
        return NextResponse.json(
          {
            success: false,
            message: "테이블을 찾을 수 없습니다",
            data: null,
          } as ApiResponse,
          { status: 404 }
        );
      }

      // 컬럼 데이터 준비
      const columnsToInsert = bulkRequest.columns.map((col, index) => ({
        table_id: bulkRequest.table_id,
        column_name: col.column_name.trim(),
        data_type: col.data_type,
        column_order: col.column_order ?? index,
        description: col.description?.trim() || null,
        is_nullable: col.is_nullable ?? true,
        is_primary_key: col.is_primary_key ?? false,
        default_value: col.default_value?.trim() || null,
      }));

      // 컬럼 일괄 생성
      const { data: columns, error } = await supabase
        .from("table_columns")
        .insert(columnsToInsert)
        .select();

      if (error) {
        console.error("Columns creation error:", error);

        if (error.code === "23505") {
          return NextResponse.json(
            {
              success: false,
              message: "이미 같은 이름의 컬럼이 존재합니다",
              data: null,
            } as ApiResponse,
            { status: 409 }
          );
        }

        return NextResponse.json(
          {
            success: false,
            message: "컬럼 생성에 실패했습니다",
            data: null,
          } as ApiResponse,
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: `${columns?.length || 0}개의 컬럼이 성공적으로 생성되었습니다`,
          data: columns,
        } as ApiResponse<ColumnData[]>,
        { status: 201 }
      );
    }
    
    // 단일 컬럼 생성
    const columnRequest = body as ColumnRequest;

    if (!columnRequest.column_name?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "컬럼 이름이 필요합니다",
          data: null,
        } as ApiResponse,
        { status: 400 }
      );
    }

    if (!columnRequest.data_type) {
      return NextResponse.json(
        {
          success: false,
          message: "데이터 타입이 필요합니다",
          data: null,
        } as ApiResponse,
        { status: 400 }
      );
    }

    if (!columnRequest.table_id) {
      return NextResponse.json(
        {
          success: false,
          message: "테이블 ID가 필요합니다",
          data: null,
        } as ApiResponse,
        { status: 400 }
      );
    }

    // 테이블 소유권 확인
    const { data: table, error: tableError } = await supabase
      .from("database_tables")
      .select(`
        id,
        database_projects!inner (
          user_email
        )
      `)
      .eq("id", columnRequest.table_id)
      .eq("database_projects.user_email", user.email)
      .single();

    if (tableError || !table) {
      return NextResponse.json(
        {
          success: false,
          message: "테이블을 찾을 수 없습니다",
          data: null,
        } as ApiResponse,
        { status: 404 }
      );
    }

    // 컬럼 생성
    const { data: column, error } = await supabase
      .from("table_columns")
      .insert({
        table_id: columnRequest.table_id,
        column_name: columnRequest.column_name.trim(),
        data_type: columnRequest.data_type,
        column_order: columnRequest.column_order ?? 0,
        description: columnRequest.description?.trim() || null,
        is_nullable: columnRequest.is_nullable ?? true,
        is_primary_key: columnRequest.is_primary_key ?? false,
        default_value: columnRequest.default_value?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Column creation error:", error);

      if (error.code === "23505") {
        return NextResponse.json(
          {
            success: false,
            message: "이미 같은 이름의 컬럼이 존재합니다",
            data: null,
          } as ApiResponse,
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: "컬럼 생성에 실패했습니다",
          data: null,
        } as ApiResponse,
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "컬럼이 성공적으로 생성되었습니다",
        data: column,
      } as ApiResponse<ColumnData>,
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