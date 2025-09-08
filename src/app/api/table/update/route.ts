import { NextRequest, NextResponse } from "next/server";

import { ApiResponse } from "@/types/api";
import { TableData, TableUpdateRequest } from "@/types/table";
import { createClient } from "@/utils/supabase/server";

/**
 * PUT /api/table/update?id={table_id}
 * Update table information
 * Body: { table_name?, description? }
 */
export async function PUT(request: NextRequest) {
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

    // 요청 바디 파싱
    const body: TableUpdateRequest = await request.json();

    if (!body.table_name?.trim() && body.description === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: "수정할 내용이 없습니다",
          data: null,
        } as ApiResponse,
        { status: 400 }
      );
    }

    // 테이블 소유권 확인
    const { data: existingTable, error: checkError } = await supabase
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

    if (checkError || !existingTable) {
      return NextResponse.json(
        {
          success: false,
          message: "테이블을 찾을 수 없습니다",
          data: null,
        } as ApiResponse,
        { status: 404 }
      );
    }

    // 테이블 업데이트
    const updateData: Record<string, unknown> = {};
    if (body.table_name?.trim()) {
      updateData.table_name = body.table_name.trim();
    }
    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null;
    }
    updateData.updated_at = new Date().toISOString();

    const { data: table, error } = await supabase
      .from("database_tables")
      .update(updateData)
      .eq("id", tableId)
      .select()
      .single();

    if (error) {
      console.error("Table update error:", error);

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
          message: "테이블 수정에 실패했습니다",
          data: null,
        } as ApiResponse,
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "테이블이 성공적으로 수정되었습니다",
        data: table,
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