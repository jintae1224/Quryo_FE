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

    // 컬럼 목록 조회
    const { data: columns, error } = await supabase
      .from("table_columns")
      .select("*")
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

    return NextResponse.json(
      {
        success: true,
        message: "컬럼 목록을 성공적으로 조회했습니다",
        data: columns || [],
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