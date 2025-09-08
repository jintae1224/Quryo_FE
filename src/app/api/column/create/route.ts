import { NextRequest, NextResponse } from "next/server";

import { ApiResponse } from "@/types/api";
import { ColumnBulkCreateRequest, ColumnData, ColumnRequest } from "@/types/column";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/column/create
 * Create a new column or multiple columns
 * Body: ColumnRequest or ColumnBulkCreateRequest
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
    const body = await request.json();
    
    // Bulk create 처리
    if ('columns' in body && Array.isArray(body.columns)) {
      const bulkRequest = body as ColumnBulkCreateRequest;
      
      if (!bulkRequest.table_id) {
        return NextResponse.json(
          {
            success: false,
            message: "테이블 ID가 필요합니다",
            data: null,
          } as ApiResponse,
          { status: 400 }
        );
      }

      if (!bulkRequest.columns || bulkRequest.columns.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "최소 하나 이상의 컬럼이 필요합니다",
            data: null,
          } as ApiResponse,
          { status: 400 }
        );
      }

      // 테이블 소유권 확인
      const { data: table, error: tableError } = await supabase
        .from("database_tables")
        .select(`
          id,
          database_projects!inner (
            user_email
          )
        `)
        .eq("id", bulkRequest.table_id)
        .eq("database_projects.user_email", user.email)
        .single();

      if (tableError || !table) {
        return NextResponse.json(
          {
            success: false,
            message: "테이블을 찾을 수 없습니다",
            data: null,
          } as ApiResponse,
          { status: 404 }
        );
      }

      // 기존 컬럼 중 최대 order 값 조회
      const { data: maxOrderResult } = await supabase
        .from("table_columns")
        .select("column_order")
        .eq("table_id", bulkRequest.table_id)
        .order("column_order", { ascending: false })
        .limit(1)
        .single();

      const startOrder = (maxOrderResult?.column_order ?? 0) + 1;

      // 컬럼 데이터 준비 (Foreign Key 필드 제외)
      const columnsToInsert = bulkRequest.columns.map((col, index) => ({
        table_id: bulkRequest.table_id,
        column_name: col.column_name.trim(),
        data_type: col.data_type,
        column_order: col.column_order ?? (startOrder + index),
        description: col.description?.trim() || null,
        is_nullable: col.is_nullable ?? true,
        is_primary_key: col.is_primary_key ?? false,
        default_value: col.default_value?.trim() || null,
      }));

      // 컬럼 일괄 생성
      const { data: columns, error } = await supabase
        .from("table_columns")
        .insert(columnsToInsert)
        .select();

      if (error) {
        console.error("Columns creation error:", error);

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
            message: "컬럼 생성에 실패했습니다",
            data: null,
          } as ApiResponse,
          { status: 500 }
        );
      }

      // Foreign Key 관계 생성
      if (columns && columns.length > 0) {
        const foreignKeyRelationships = [];
        
        for (let i = 0; i < bulkRequest.columns.length; i++) {
          const col = bulkRequest.columns[i];
          const createdColumn = columns[i];
          
          if (col.is_foreign_key && col.foreign_table_id && col.foreign_column_id && createdColumn) {
            foreignKeyRelationships.push({
              source_table_id: bulkRequest.table_id,
              source_column_id: createdColumn.id,
              target_table_id: col.foreign_table_id,
              target_column_id: col.foreign_column_id,
              constraint_name: col.foreign_key_constraint_name?.trim() || null,
              on_delete: col.on_delete_action || "CASCADE",
              on_update: col.on_update_action || "CASCADE",
            });
          }
        }

        // Foreign Key 관계 일괄 생성
        if (foreignKeyRelationships.length > 0) {
          const { error: fkError } = await supabase
            .from("foreign_key_relationships")
            .insert(foreignKeyRelationships);

          if (fkError) {
            console.error("Foreign key relationships creation error:", fkError);
            // 컬럼은 이미 생성되었으므로 경고만 로그
          }
        }
      }

      return NextResponse.json(
        {
          success: true,
          message: `${columns?.length || 0}개의 컬럼이 성공적으로 생성되었습니다`,
          data: columns,
        } as ApiResponse<ColumnData[]>,
        { status: 201 }
      );
    }
    
    // 단일 컬럼 생성
    const columnRequest = body as ColumnRequest;

    if (!columnRequest.column_name?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "컬럼 이름이 필요합니다",
          data: null,
        } as ApiResponse,
        { status: 400 }
      );
    }

    if (!columnRequest.data_type) {
      return NextResponse.json(
        {
          success: false,
          message: "데이터 타입이 필요합니다",
          data: null,
        } as ApiResponse,
        { status: 400 }
      );
    }

    if (!columnRequest.table_id) {
      return NextResponse.json(
        {
          success: false,
          message: "테이블 ID가 필요합니다",
          data: null,
        } as ApiResponse,
        { status: 400 }
      );
    }

    // 테이블 소유권 확인
    const { data: table, error: tableError } = await supabase
      .from("database_tables")
      .select(`
        id,
        database_projects!inner (
          user_email
        )
      `)
      .eq("id", columnRequest.table_id)
      .eq("database_projects.user_email", user.email)
      .single();

    if (tableError || !table) {
      return NextResponse.json(
        {
          success: false,
          message: "테이블을 찾을 수 없습니다",
          data: null,
        } as ApiResponse,
        { status: 404 }
      );
    }

    // 기존 컬럼 중 최대 order 값 조회
    const { data: maxOrderResult } = await supabase
      .from("table_columns")
      .select("column_order")
      .eq("table_id", columnRequest.table_id)
      .order("column_order", { ascending: false })
      .limit(1)
      .single();

    const nextOrder = columnRequest.column_order ?? ((maxOrderResult?.column_order ?? 0) + 1);

    // 컬럼 생성 (Foreign Key 필드 제외)
    const { data: column, error } = await supabase
      .from("table_columns")
      .insert({
        table_id: columnRequest.table_id,
        column_name: columnRequest.column_name.trim(),
        data_type: columnRequest.data_type,
        column_order: nextOrder,
        description: columnRequest.description?.trim() || null,
        is_nullable: columnRequest.is_nullable ?? true,
        is_primary_key: columnRequest.is_primary_key ?? false,
        default_value: columnRequest.default_value?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Column creation error:", error);

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
          message: "컬럼 생성에 실패했습니다",
          data: null,
        } as ApiResponse,
        { status: 500 }
      );
    }

    // Foreign Key 관계 생성
    if (column && columnRequest.is_foreign_key && columnRequest.foreign_table_id && columnRequest.foreign_column_id) {
      const { error: fkError } = await supabase
        .from("foreign_key_relationships")
        .insert({
          source_table_id: columnRequest.table_id,
          source_column_id: column.id,
          target_table_id: columnRequest.foreign_table_id,
          target_column_id: columnRequest.foreign_column_id,
          constraint_name: columnRequest.foreign_key_constraint_name?.trim() || null,
          on_delete: columnRequest.on_delete_action || "CASCADE",
          on_update: columnRequest.on_update_action || "CASCADE",
        });

      if (fkError) {
        console.error("Foreign key relationship creation error:", fkError);
        // 컬럼은 이미 생성되었으므로 경고만 로그
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "컬럼이 성공적으로 생성되었습니다",
        data: column,
      } as ApiResponse<ColumnData>,
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