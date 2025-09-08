import { NextRequest, NextResponse } from "next/server";

import { ApiResponse } from "@/types/api";
import { TableData } from "@/types/table";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/table/detail?id={table_id}
 * Get table details
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const tableId = searchParams.get("id");

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

    // 테이블 조회 (프로젝트 소유권 확인 포함)
    const { data: table, error } = await supabase
      .from("database_tables")
      .select(`
        *,
        database_projects!inner (
          user_email
        )
      `)
      .eq("id", tableId)
      .eq("database_projects.user_email", user.email)
      .single();

    if (error || !table) {
      console.error("Table detail error:", error);
      return NextResponse.json(
        {
          success: false,
          message: "테이블을 찾을 수 없습니다",
          data: null,
        } as ApiResponse,
        { status: 404 }
      );
    }

    // database_projects 정보 제거하고 필요한 필드만 반환
    const tableData: TableData = {
      id: table.id,
      table_name: table.table_name,
      description: table.description,
      project_id: table.project_id,
      created_at: table.created_at,
      updated_at: table.updated_at,
    };

    return NextResponse.json(
      {
        success: true,
        message: "테이블 정보를 성공적으로 조회했습니다",
        data: tableData,
      } as ApiResponse<TableData>,
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