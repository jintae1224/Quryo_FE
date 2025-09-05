import { NextRequest, NextResponse } from "next/server";

import { ApiResponse } from "@/types/api";
import { ProjectData } from "@/types/project";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/project/list
 * Get all database projects for the authenticated user
 * Query params: search?, database_type?, sort_by?, sort_order?
 */
export async function GET(request: NextRequest) {
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

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const databaseType = searchParams.get("database_type");
    const sortBy = searchParams.get("sort_by") || "created_at";
    const sortOrder = searchParams.get("sort_order") || "desc";

    // 쿼리 빌더 시작
    let query = supabase
      .from("database_projects")
      .select("*")
      .eq("user_email", user.email);

    // 검색 조건 추가
    if (search) {
      query = query.or(
        `project_name.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    if (databaseType) {
      query = query.eq("database_type", databaseType);
    }

    // 정렬 추가
    const ascending = sortOrder === "asc";
    query = query.order(sortBy, { ascending });

    // 쿼리 실행
    const { data: projects, error } = await query;

    if (error) {
      console.error("Database projects fetch error:", error);
      return NextResponse.json(
        {
          success: false,
          message: "프로젝트를 가져오는데 실패했습니다",
          data: null,
        } as ApiResponse,
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "프로젝트를 성공적으로 가져왔습니다",
      data: projects || [],
    } as ApiResponse<ProjectData[]>);
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
