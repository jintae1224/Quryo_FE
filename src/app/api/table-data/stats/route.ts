import { NextRequest, NextResponse } from "next/server";

import { ApiResponse } from "@/types/api";
import { TableDataStats } from "@/types/tableData";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/table-data/stats?table_id={table_id}
 * Get statistics for table data
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const tableId = searchParams.get("table_id");

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
    const { data: tableInfo, error: tableError } = await supabase
      .from("database_tables")
      .select(`
        id,
        table_name,
        project_id,
        database_projects!inner(
          project_name,
          user_email
        )
      `)
      .eq("id", tableId)
      .eq("database_projects.user_email", user.email)
      .single();

    if (tableError || !tableInfo) {
      return NextResponse.json(
        {
          success: false,
          message: "테이블을 찾을 수 없거나 접근 권한이 없습니다",
          data: null,
        } as ApiResponse,
        { status: 404 }
      );
    }

    // Get table data statistics
    const { data: statsData, error: statsError } = await supabase
      .from("table_rows")
      .select("created_at, updated_at, created_by")
      .eq("table_id", tableId);

    if (statsError) {
      console.error("Table stats error:", statsError);
      return NextResponse.json(
        {
          success: false,
          message: "테이블 통계 조회에 실패했습니다",
          data: null,
        } as ApiResponse,
        { status: 500 }
      );
    }

    // Process statistics
    const rows = statsData || [];
    const totalRows = rows.length;
    
    // Find first and last records
    let firstRecordAt: string | null = null;
    let lastUpdatedAt: string | null = null;
    
    if (rows.length > 0) {
      const createdDates = rows
        .map(row => row.created_at)
        .filter(date => date !== null)
        .sort();
      
      const updatedDates = rows
        .map(row => row.updated_at)
        .filter(date => date !== null)
        .sort();
      
      firstRecordAt = createdDates.length > 0 ? createdDates[0] : null;
      lastUpdatedAt = updatedDates.length > 0 ? updatedDates[updatedDates.length - 1] : null;
    }

    // Count unique contributors
    const contributors = new Set(
      rows
        .map(row => row.created_by)
        .filter(creator => creator !== null)
    );
    const contributorsCount = contributors.size;

    const stats: TableDataStats = {
      table_id: tableId,
      table_name: tableInfo.table_name,
      project_name: tableInfo.database_projects.project_name,
      total_rows: totalRows,
      first_record_at: firstRecordAt,
      last_updated_at: lastUpdatedAt,
      contributors_count: contributorsCount,
    };

    return NextResponse.json(
      {
        success: true,
        message: "테이블 통계를 성공적으로 조회했습니다",
        data: stats,
      } as ApiResponse<TableDataStats>,
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