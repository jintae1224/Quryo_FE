import { NextRequest, NextResponse } from "next/server";

import { ApiResponse } from "@/types/api";
import { ForeignKeyOption } from "@/types/column";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/table/foreign-key-options?project_id={project_id}
 * Get tables with their primary key columns for foreign key references
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("project_id");

    if (!projectId) {
      return NextResponse.json(
        {
          success: false,
          message: "프로젝트 ID가 필요합니다",
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

    // 프로젝트 소유권 확인
    const { data: project, error: projectError } = await supabase
      .from("database_projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_email", user.email)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        {
          success: false,
          message: "프로젝트를 찾을 수 없습니다",
          data: null,
        } as ApiResponse,
        { status: 404 }
      );
    }

    // 테이블과 컬럼 조회 (JOIN 사용)
    const { data: tablesWithColumns, error } = await supabase
      .from("database_tables")
      .select(`
        id,
        table_name,
        table_columns (
          id,
          column_name,
          data_type,
          is_primary_key,
          is_nullable
        )
      `)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Foreign key options error:", error);
      return NextResponse.json(
        {
          success: false,
          message: "외래키 옵션 조회에 실패했습니다",
          data: null,
        } as ApiResponse,
        { status: 500 }
      );
    }

    // ForeignKeyOption 형태로 변환
    const foreignKeyOptions = (tablesWithColumns || [])
      .filter(table => (table.table_columns as Record<string, unknown>[])?.length > 0) // 컬럼이 있는 테이블만
      .map(table => ({
        table_id: table.id,
        table_name: table.table_name,
        columns: ((table.table_columns as Record<string, unknown>[]) || [])
          .filter(column => column.is_primary_key || !column.is_nullable) // PK 또는 NOT NULL 컬럼만
          .map(column => ({
            id: column.id,
            name: column.column_name,
            data_type: column.data_type,
            is_primary_key: column.is_primary_key || false,
          }))
      }))
      .filter(option => option.columns.length > 0); // 참조 가능한 컬럼이 있는 테이블만

    return NextResponse.json(
      {
        success: true,
        message: "외래키 옵션을 성공적으로 조회했습니다",
        data: foreignKeyOptions as ForeignKeyOption[],
      } as ApiResponse<ForeignKeyOption[]>,
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