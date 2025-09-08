import { NextRequest, NextResponse } from "next/server";

import { ApiResponse } from "@/types/api";
import { TableData } from "@/types/table";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/table/list?project_id={project_id}
 * Get all tables for a project
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

    // 테이블 목록 조회
    const { data: tables, error } = await supabase
      .from("database_tables")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Table list error:", error);
      return NextResponse.json(
        {
          success: false,
          message: "테이블 목록 조회에 실패했습니다",
          data: null,
        } as ApiResponse,
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "테이블 목록을 성공적으로 조회했습니다",
        data: tables || [],
      } as ApiResponse<TableData[]>,
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