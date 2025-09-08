import { NextRequest, NextResponse } from "next/server";

import { ApiResponse } from "@/types/api";
import { ColumnData } from "@/types/column";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/column/list?table_id={table_id}
 * Get all columns for a table
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const tableId = searchParams.get("table_id");

    if (!tableId) {
      return NextResponse.json(
        {
          success: false,
          message: "테이블 ID가 필요합니다",
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

    // 테이블 소유권 확인
    const { data: table, error: tableError } = await supabase
      .from("database_tables")
      .select(`
        id,
        database_projects!inner (
          user_email
        )
      `)
      .eq("id", tableId)
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

    // 컬럼 목록과 외래키 정보 조회 (참조 테이블과 컬럼 이름 포함)
    const { data: columns, error } = await supabase
      .from("table_columns")
      .select(`
        *,
        foreign_key_relationships!foreign_key_relationships_source_column_id_fkey (
          id,
          target_table_id,
          target_column_id,
          constraint_name,
          on_delete,
          on_update,
          target_table:database_tables!target_table_id (
            table_name
          ),
          target_column:table_columns!target_column_id (
            column_name
          )
        )
      `)
      .eq("table_id", tableId)
      .order("column_order", { ascending: true });

    if (error) {
      console.error("Column list error:", error);
      return NextResponse.json(
        {
          success: false,
          message: "컬럼 목록 조회에 실패했습니다",
          data: null,
        } as ApiResponse,
        { status: 500 }
      );
    }

    // 외래키 관계 정보를 ColumnData 형식으로 변환
    const transformedColumns = (columns || []).map((column: Record<string, unknown>) => {
      const relationships = Array.isArray(column.foreign_key_relationships) ? column.foreign_key_relationships : [];
      const foreignKeyRelation = relationships.length > 0 ? relationships[0] : null; // 하나의 컬럼은 하나의 외래키 관계만 가질 수 있음
      
      return {
        ...column,
        // 외래키 관계 정보 추가
        is_foreign_key: !!foreignKeyRelation,
        foreign_table_id: foreignKeyRelation?.target_table_id || null,
        foreign_column_id: foreignKeyRelation?.target_column_id || null,
        foreign_key_constraint_name: foreignKeyRelation?.constraint_name || null,
        on_delete_action: foreignKeyRelation?.on_delete || null,
        on_update_action: foreignKeyRelation?.on_update || null,
        // 참조 테이블과 컬럼 이름 추가 (UI 표시용)
        foreign_table_name: foreignKeyRelation?.target_table?.table_name || null,
        foreign_column_name: foreignKeyRelation?.target_column?.column_name || null,
        // 중복된 중첩 객체 제거
        foreign_key_relationships: undefined,
      };
    });

    return NextResponse.json(
      {
        success: true,
        message: "컬럼 목록을 성공적으로 조회했습니다",
        data: transformedColumns as unknown as ColumnData[],
      } as ApiResponse<ColumnData[]>,
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