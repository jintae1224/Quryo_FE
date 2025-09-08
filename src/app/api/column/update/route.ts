import { NextRequest, NextResponse } from "next/server";

import { ApiResponse } from "@/types/api";
import { ColumnData, ColumnUpdateRequest } from "@/types/column";
import { createClient } from "@/utils/supabase/server";

/**
 * PUT /api/column/update?id={column_id}
 * Update column information
 * Body: ColumnUpdateRequest
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const columnId = searchParams.get("id");

    if (!columnId) {
      return NextResponse.json(
        {
          success: false,
          message: "컬럼 ID가 필요합니다",
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
    const body: ColumnUpdateRequest = await request.json();

    // 수정할 내용 확인
    const hasUpdate = 
      body.column_name?.trim() ||
      body.data_type ||
      body.column_order !== undefined ||
      body.description !== undefined ||
      body.is_nullable !== undefined ||
      body.is_primary_key !== undefined ||
      body.default_value !== undefined;

    if (!hasUpdate) {
      return NextResponse.json(
        {
          success: false,
          message: "수정할 내용이 없습니다",
          data: null,
        } as ApiResponse,
        { status: 400 }
      );
    }

    // 컬럼 소유권 확인
    const { data: existingColumn, error: checkError } = await supabase
      .from("table_columns")
      .select(`
        id,
        database_tables!inner (
          database_projects!inner (
            user_email
          )
        )
      `)
      .eq("id", columnId)
      .eq("database_tables.database_projects.user_email", user.email)
      .single();

    if (checkError || !existingColumn) {
      return NextResponse.json(
        {
          success: false,
          message: "컬럼을 찾을 수 없습니다",
          data: null,
        } as ApiResponse,
        { status: 404 }
      );
    }

    // 컬럼 업데이트
    const updateData: Record<string, unknown> = {};
    if (body.column_name?.trim()) {
      updateData.column_name = body.column_name.trim();
    }
    if (body.data_type) {
      updateData.data_type = body.data_type;
    }
    if (body.column_order !== undefined) {
      updateData.column_order = body.column_order;
    }
    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null;
    }
    if (body.is_nullable !== undefined) {
      updateData.is_nullable = body.is_nullable;
    }
    if (body.is_primary_key !== undefined) {
      updateData.is_primary_key = body.is_primary_key;
    }
    if (body.default_value !== undefined) {
      updateData.default_value = body.default_value?.trim() || null;
    }
    updateData.updated_at = new Date().toISOString();

    const { data: column, error } = await supabase
      .from("table_columns")
      .update(updateData)
      .eq("id", columnId)
      .select()
      .single();

    if (error) {
      console.error("Column update error:", error);

      if (error.code === "23505") {
        return NextResponse.json(
          {
            success: false,
            message: "이미 같은 이름의 컬럼이 존재합니다",
            data: null,
          } as ApiResponse,
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: "컬럼 수정에 실패했습니다",
          data: null,
        } as ApiResponse,
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "컬럼이 성공적으로 수정되었습니다",
        data: column,
      } as ApiResponse<ColumnData>,
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