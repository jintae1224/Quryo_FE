import { NextRequest, NextResponse } from "next/server";

import { ApiResponse } from "@/types/api";
import { TableData, TableRequest } from "@/types/table";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/table/create
 * Create a new database table
 * Body: { table_name, description?, project_id }
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
    const body: TableRequest = await request.json();

    if (!body.table_name?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "테이블 이름이 필요합니다",
          data: null,
        } as ApiResponse,
        { status: 400 }
      );
    }

    if (!body.project_id) {
      return NextResponse.json(
        {
          success: false,
          message: "프로젝트 ID가 필요합니다",
          data: null,
        } as ApiResponse,
        { status: 400 }
      );
    }

    // 프로젝트 소유권 확인
    const { data: project, error: projectError } = await supabase
      .from("database_projects")
      .select("id")
      .eq("id", body.project_id)
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

    // 테이블 생성
    const { data: table, error } = await supabase
      .from("database_tables")
      .insert({
        project_id: body.project_id,
        table_name: body.table_name.trim(),
        description: body.description?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Table creation error:", error);

      // Unique constraint violation
      if (error.code === "23505") {
        return NextResponse.json(
          {
            success: false,
            message: "이미 같은 이름의 테이블이 존재합니다",
            data: null,
          } as ApiResponse,
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: "테이블 생성에 실패했습니다",
          data: null,
        } as ApiResponse,
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "테이블이 성공적으로 생성되었습니다",
        data: table,
      } as ApiResponse<TableData>,
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