import { NextRequest, NextResponse } from "next/server";

import { ApiResponse } from "@/types/api";
import { ProjectData, ProjectRequest } from "@/types/project";
import { createClient } from "@/utils/supabase/server";

/**
 * PUT /api/project/update
 * Update a project
 * Body: { id: string } & ProjectRequest
 */
export async function PUT(request: NextRequest) {
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

    const body: { id: string } & ProjectRequest = await request.json();

    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          message: "프로젝트 ID가 필요합니다",
          data: null,
        } as ApiResponse,
        { status: 400 }
      );
    }

    // 프로젝트 업데이트 (소유권 확인 포함)
    const { data: project, error } = await supabase
      .from("database_projects")
      .update({
        project_name: body.project_name?.trim(),
        description: body.description?.trim() || null,
        database_type: body.database_type,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .eq("user_email", user.email)
      .select()
      .single();

    if (error) {
      console.error("Project update error:", error);

      if (error.code === "PGRST116") {
        return NextResponse.json(
          {
            success: false,
            message: "프로젝트를 찾을 수 없거나 접근이 거부되었습니다",
            data: null,
          } as ApiResponse,
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: "프로젝트 업데이트에 실패했습니다",
          data: null,
        } as ApiResponse,
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "프로젝트가 성공적으로 업데이트되었습니다",
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