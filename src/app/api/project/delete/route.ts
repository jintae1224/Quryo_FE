import { NextRequest, NextResponse } from "next/server";

import { ApiResponse } from "@/types/api";
import { createClient } from "@/utils/supabase/server";

/**
 * DELETE /api/project/delete
 * Delete a project
 * Body: { id: string }
 */
export async function DELETE(request: NextRequest) {
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

    const body: { id: string } = await request.json();

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

    // 프로젝트 삭제 (소유권 확인 포함)
    const { error } = await supabase
      .from("database_projects")
      .delete()
      .eq("id", body.id)
      .eq("user_email", user.email);

    if (error) {
      console.error("Project delete error:", error);
      return NextResponse.json(
        {
          success: false,
          message: "프로젝트 삭제에 실패했습니다",
          data: null,
        } as ApiResponse,
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "프로젝트가 성공적으로 삭제되었습니다",
      data: null,
    } as ApiResponse);
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