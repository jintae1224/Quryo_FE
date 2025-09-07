import { NextRequest, NextResponse } from "next/server";

import { ApiResponse } from "@/types/api";
import { ProjectData, ProjectRequest } from "@/types/project";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/project/create
 * Create a new database project
 * Body: { project_name, description?, database_type? }
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
    const body: ProjectRequest = await request.json();

    if (!body.project_name?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "프로젝트 이름이 필요합니다",
          data: null,
        } as ApiResponse,
        { status: 400 }
      );
    }

    // 프로젝트 생성
    const { data: project, error } = await supabase
      .from("database_projects")
      .insert({
        user_email: user.email,
        project_name: body.project_name.trim(),
        description: body.description?.trim() || null,
        database_type: body.database_type || "postgresql",
      })
      .select()
      .single();

    if (error) {
      console.error("Project creation error:", error);

      // Unique constraint violation
      if (
        error.code === "23505" &&
        error.message.includes("unique_user_project_name")
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "이미 같은 이름의 프로젝트가 존재합니다",
            data: null,
          } as ApiResponse,
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: "프로젝트 생성에 실패했습니다",
          data: null,
        } as ApiResponse,
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "프로젝트가 성공적으로 생성되었습니다",
        data: project,
      } as ApiResponse<ProjectData>,
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
