import { NextRequest, NextResponse } from "next/server";

import { ApiResponse } from "@/types/api";
import { createClient } from "@/utils/supabase/server";

/**
 * DELETE /api/column/delete?id={column_id}
 * Delete a column
 */
export async function DELETE(request: NextRequest) {
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

    // 컬럼 소유권 확인
    const { data: existingColumn, error: checkError } = await supabase
      .from("table_columns")
      .select(`
        id,
        is_primary_key,
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

    // Primary Key는 삭제 불가
    if (existingColumn.is_primary_key) {
      return NextResponse.json(
        {
          success: false,
          message: "Primary Key 컬럼은 삭제할 수 없습니다",
          data: null,
        } as ApiResponse,
        { status: 400 }
      );
    }

    // 컬럼 삭제
    const { error } = await supabase
      .from("table_columns")
      .delete()
      .eq("id", columnId);

    if (error) {
      console.error("Column delete error:", error);
      
      // Foreign key 제약 조건 위반
      if (error.code === "23503") {
        return NextResponse.json(
          {
            success: false,
            message: "이 컬럼은 외래키 관계가 설정되어 있어 삭제할 수 없습니다",
            data: null,
          } as ApiResponse,
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: "컬럼 삭제에 실패했습니다",
          data: null,
        } as ApiResponse,
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "컬럼이 성공적으로 삭제되었습니다",
        data: null,
      } as ApiResponse,
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