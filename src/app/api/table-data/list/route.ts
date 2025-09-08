import { NextRequest, NextResponse } from "next/server";

import { ApiResponse } from "@/types/api";
import { TableDataListResponse } from "@/types/tableData";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/table-data/list?table_id={table_id}&page={page}&limit={limit}&sort_by={sort_by}&sort_order={sort_order}&search={search}
 * Get table data with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const tableId = searchParams.get("table_id");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sortBy = searchParams.get("sort_by") || "created_at";
    const sortOrder =
      (searchParams.get("sort_order") as "asc" | "desc") || "desc";
    const search = searchParams.get("search") || "";

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

    // 테이블 소유권 확인 (through project ownership)
    const { data: table, error: tableError } = await supabase
      .from("database_tables")
      .select(
        `
        id,
        table_name,
        project_id,
        database_projects!inner(user_email)
      `
      )
      .eq("id", tableId)
      .eq("database_projects.user_email", user.email)
      .single();

    if (tableError || !table) {
      return NextResponse.json(
        {
          success: false,
          message: "테이블을 찾을 수 없거나 접근 권한이 없습니다",
          data: null,
        } as ApiResponse,
        { status: 404 }
      );
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build the query
    let query = supabase
      .from("table_rows")
      .select("*", { count: "exact" })
      .eq("table_id", tableId);

    // Add search filtering if search term provided
    if (search.trim()) {
      // Use JSONB search for row_data
      query = query.or(`row_data::text.ilike.%${search}%`);
    }

    // Add sorting
    if (
      sortBy === "created_at" ||
      sortBy === "updated_at" ||
      sortBy === "row_order"
    ) {
      query = query.order(sortBy, { ascending: sortOrder === "asc" });
    } else {
      // For custom column sorting, we'll sort by JSONB field
      query = query.order(`row_data->${sortBy}`, {
        ascending: sortOrder === "asc",
      });
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1);

    const { data: rows, error, count } = await query;

    if (error) {
      console.error("Table data list error:", error);
      return NextResponse.json(
        {
          success: false,
          message: "테이블 데이터 조회에 실패했습니다",
          data: null,
        } as ApiResponse,
        { status: 500 }
      );
    }

    // Calculate pagination info
    const total = count || 0;
    const hasMore = offset + limit < total;

    const response: TableDataListResponse = {
      rows: rows || [],
      total,
      page,
      limit,
      has_more: hasMore,
    };

    return NextResponse.json(
      {
        success: true,
        message: "테이블 데이터를 성공적으로 조회했습니다",
        data: response,
      } as ApiResponse<TableDataListResponse>,
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
