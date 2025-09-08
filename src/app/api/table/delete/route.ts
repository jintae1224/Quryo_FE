import { NextRequest, NextResponse } from "next/server";

import { ApiResponse } from "@/types/api";
import { createClient } from "@/utils/supabase/server";

/**
 * DELETE /api/table/delete?id={table_id}
 * Delete a table and all its columns
 */
export async function DELETE(request: NextRequest) {
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

    // 테이블 삭제 (CASCADE로 관련 컬럼도 자동 삭제됨)
    const { error } = await supabase
      .from("database_tables")
      .delete()
      .eq("id", tableId);

    if (error) {
      console.error("Table delete error:", error);
      return NextResponse.json(
        {
          success: false,
          message: "테이블 삭제에 실패했습니다",
          data: null,
        } as ApiResponse,
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "테이블이 성공적으로 삭제되었습니다",
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