import { NextRequest, NextResponse } from "next/server";

import { ApiResponse } from "@/types/api";
import { ProjectData } from "@/types/project";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/project/detail
 * Get a specific project by ID
 * Query params: id
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "프로젝트 ID가 필요합니다",
          data: null,
        } as ApiResponse,
        { status: 400 }
      );
    }

    // 프로젝트 조회 (소유권 확인 포함)
    const { data: project, error } = await supabase
      .from("database_projects")
      .select("*")
      .eq("id", id)
      .eq("user_email", user.email)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows found
        return NextResponse.json(
          {
            success: false,
            message: "프로젝트를 찾을 수 없거나 접근이 거부되었습니다",
            data: null,
          } as ApiResponse,
          { status: 404 }
        );
      }

      console.error("Project fetch error:", error);
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
      data: project,
    } as ApiResponse<ProjectData>);
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