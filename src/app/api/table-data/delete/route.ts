import { NextRequest, NextResponse } from "next/server";

import { ApiResponse } from "@/types/api";
import { createClient } from "@/utils/supabase/server";

/**
 * DELETE /api/table-data/delete?row_id={row_id}
 * Delete a table data row
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const rowId = searchParams.get("row_id");

    if (!rowId) {
      return NextResponse.json(
        {
          success: false,
          message: "행 ID가 필요합니다",
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

    // 행 존재 확인 및 소유권 검증
    const { data: existingRow, error: rowError } = await supabase
      .from("table_rows")
      .select(`
        id,
        table_id,
        row_data,
        database_tables!inner(
          id,
          table_name,
          project_id,
          database_projects!inner(user_email)
        )
      `)
      .eq("id", rowId)
      .eq("database_tables.database_projects.user_email", user.email)
      .single();

    if (rowError || !existingRow) {
      return NextResponse.json(
        {
          success: false,
          message: "행을 찾을 수 없거나 접근 권한이 없습니다",
          data: null,
        } as ApiResponse,
        { status: 404 }
      );
    }

    // First update the row to set updated_by for history tracking
    await supabase
      .from("table_rows")
      .update({ updated_by: user.email })
      .eq("id", rowId);

    // 행 삭제 (database triggers will handle history logging)
    const { error: deleteError } = await supabase
      .from("table_rows")
      .delete()
      .eq("id", rowId);

    if (deleteError) {
      console.error("Table data delete error:", deleteError);

      // Handle specific database errors
      if (deleteError.code === "23503") {
        return NextResponse.json(
          {
            success: false,
            message: "외래키 제약 조건으로 인해 삭제할 수 없습니다. 이 데이터를 참조하는 다른 데이터가 존재합니다",
            data: null,
          } as ApiResponse,
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: "데이터 삭제에 실패했습니다",
          data: null,
        } as ApiResponse,
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "데이터가 성공적으로 삭제되었습니다",
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