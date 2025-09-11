import { NextRequest, NextResponse } from "next/server";

import { ApiResponse } from "@/types/api";
import {
  ParsedAggregate,
  ParsedCondition,
  ParsedSqlQuery,
  SqlQueryResponse,
} from "@/types/sql";
import { parseSqlQuery } from "@/utils/sql-parser";
import { createClient } from "@/utils/supabase/server";

interface SqlExecuteRequest {
  project_id: string;
  query: string;
}

/**
 * POST /api/sql/execute
 * Execute SQL query on metadata-based database
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

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

    const body: SqlExecuteRequest = await request.json();

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

    if (!body.query) {
      return NextResponse.json(
        {
          success: false,
          message: "실행할 쿼리가 필요합니다",
          data: null,
        } as ApiResponse,
        { status: 400 }
      );
    }

    // 프로젝트 소유권 확인
    const { data: project, error: projectError } = await supabase
      .from("database_projects")
      .select("id, project_name")
      .eq("id", body.project_id)
      .eq("user_email", user.email)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        {
          success: false,
          message: "프로젝트를 찾을 수 없거나 접근 권한이 없습니다",
          data: null,
        } as ApiResponse,
        { status: 404 }
      );
    }

    // SQL 파싱

    const parsedQuery = parseSqlQuery(body.query);

    if (!parsedQuery.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: `SQL 파싱 오류: ${parsedQuery.error}`,
          data: null,
        } as ApiResponse,
        { status: 400 }
      );
    }

    // 현재는 SELECT만 지원
    if (parsedQuery.type !== "SELECT") {
      return NextResponse.json(
        {
          success: false,
          message: "현재는 SELECT 쿼리만 지원합니다",
          data: null,
        } as ApiResponse,
        { status: 400 }
      );
    }

    // JOIN 쿼리 처리
    if (parsedQuery.joins && parsedQuery.joins.length > 0) {
      // 현재는 단순 INNER JOIN만 지원
      const unsupportedJoins = parsedQuery.joins.filter(
        (join) => join.type !== "INNER"
      );
      if (unsupportedJoins.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message: `현재는 INNER JOIN만 지원합니다. ${unsupportedJoins[0].type} JOIN은 지원하지 않습니다.`,
            data: null,
          } as ApiResponse,
          { status: 400 }
        );
      }
    }

    // 프로젝트의 테이블 목록 가져오기
    const { data: tables, error: tablesError } = await supabase
      .from("database_tables")
      .select("id, table_name")
      .eq("project_id", body.project_id);

    if (tablesError) {
      return NextResponse.json(
        {
          success: false,
          message: "테이블 정보를 가져오는데 실패했습니다",
          data: null,
        } as ApiResponse,
        { status: 500 }
      );
    }

    // 파싱된 테이블 이름들이 실제로 존재하는지 확인
    const tableMap = new Map(tables.map((t) => [t.table_name, t.id]));
    const queryTables = parsedQuery.tables;

    console.log("📊 테이블 정보:");
    console.log(
      "  프로젝트의 테이블들:",
      tables.map((t) => t.table_name)
    );
    console.log("  쿼리에서 요청한 테이블들:", queryTables);

    // 모든 테이블이 존재하는지 확인
    for (const tableName of queryTables) {
      if (!tableMap.has(tableName)) {
        return NextResponse.json(
          {
            success: false,
            message: `테이블 '${tableName}'를 찾을 수 없습니다`,
            data: null,
          } as ApiResponse,
          { status: 400 }
        );
      }
    }

    // 테이블 ID 매핑 생성
    const tableIdMap = new Map(
      queryTables.map((name) => [name, tableMap.get(name)!])
    );

    // 모든 테이블의 컬럼 정보 가져오기
    const tableIds = Array.from(tableIdMap.values());
    const { data: allColumns, error: columnsError } = await supabase
      .from("table_columns")
      .select("table_id, column_name, data_type")
      .in("table_id", tableIds)
      .order("table_id, column_order");

    if (columnsError) {
      return NextResponse.json(
        {
          success: false,
          message: "컬럼 정보를 가져오는데 실패했습니다",
          data: null,
        } as ApiResponse,
        { status: 500 }
      );
    }

    // 테이블별 컬럼 매핑 생성
    const tableColumnsMap = new Map<string, string[]>();
    for (const [tableName, tableId] of Array.from(tableIdMap.entries())) {
      const columns = allColumns
        .filter((col) => col.table_id === tableId)
        .map((col) => col.column_name);
      tableColumnsMap.set(tableName, columns);
    }

    // 테이블 별칭 처리
    const tableAliases = parsedQuery.tableAliases || new Map<string, string>();

    // 디버깅: 파싱 결과 출력
    console.log("Parsed Query:", {
      type: parsedQuery.type,
      tables: parsedQuery.tables,
      columns: parsedQuery.columns,
      aggregates: parsedQuery.aggregates,
      conditions: parsedQuery.conditions,
    });

    // 쿼리 실행 (메타데이터 기반)
    const result = await executeMetadataQuery(
      supabase,
      tableIdMap,
      tableColumnsMap,
      parsedQuery,
      tableAliases
    );

    const executionTime = Date.now() - startTime;

    const response: SqlQueryResponse = {
      query: body.query,
      data: result,
      rowCount: result.length,
      executionTime,
      affectedTables: queryTables,
    };

    return NextResponse.json(
      {
        success: true,
        message: "쿼리가 성공적으로 실행되었습니다",
        data: response,
      } as ApiResponse<SqlQueryResponse>,
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        success: false,
        message: "쿼리 실행 중 오류가 발생했습니다",
        data: null,
      } as ApiResponse,
      { status: 500 }
    );
  }
}

async function executeMetadataQuery(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tableIdMap: Map<string, string>,
  tableColumnsMap: Map<string, string[]>,
  parsedQuery: ParsedSqlQuery,
  tableAliases: Map<string, string>
): Promise<Record<string, unknown>[]> {
  // JOIN이 없는 단일 테이블 쿼리
  if (!parsedQuery.joins || parsedQuery.joins.length === 0) {
    return executeSingleTableQuery(
      supabase,
      tableIdMap,
      tableColumnsMap,
      parsedQuery,
      tableAliases
    );
  }

  // JOIN 쿼리 실행
  return executeJoinQuery(
    supabase,
    tableIdMap,
    tableColumnsMap,
    parsedQuery,
    tableAliases
  );
}

async function executeSingleTableQuery(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tableIdMap: Map<string, string>,
  tableColumnsMap: Map<string, string[]>,
  parsedQuery: ParsedSqlQuery,
  tableAliases: Map<string, string>
): Promise<Record<string, unknown>[]> {
  const tableName = parsedQuery.tables[0];
  const tableId = tableIdMap.get(tableName)!;
  const availableColumns = tableColumnsMap.get(tableName)!;

  // 기본 쿼리 빌더
  let query = supabase
    .from("table_rows")
    .select("row_data")
    .eq("table_id", tableId);

  // WHERE 조건 적용
  query = applyWhereConditions(
    query,
    parsedQuery.conditions,
    availableColumns,
    tableAliases,
    tableName
  ) as typeof query;

  // 쿼리 실행
  const { data: rows, error } = await query.limit(1000);

  console.log("💾 데이터 조회 결과:");
  console.log("  조회된 행 수:", rows?.length || 0);
  console.log("  에러:", error);
  if (rows && rows.length > 0) {
    console.log("  첫 번째 행 샘플:", rows[0]);
  }

  if (error) {
    throw new Error(`데이터 조회 오류: ${error.message}`);
  }

  if (!rows || rows.length === 0) {
    return [];
  }

  // 집계 함수 처리
  if (parsedQuery.aggregates && parsedQuery.aggregates.length > 0) {
    return processAggregates(
      rows,
      parsedQuery.aggregates,
      parsedQuery.columns,
      parsedQuery.groupBy
    );
  }

  const finalResult = selectColumns(
    rows,
    parsedQuery.columns,
    availableColumns
  );

  return finalResult;
}

async function executeJoinQuery(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tableIdMap: Map<string, string>,
  tableColumnsMap: Map<string, string[]>,
  parsedQuery: ParsedSqlQuery,
  tableAliases: Map<string, string>
): Promise<Record<string, unknown>[]> {
  // 모든 테이블에서 데이터 가져오기
  const tableDataMap = new Map<
    string,
    Array<{ row_data: Record<string, unknown> }>
  >();

  console.log("JOIN 쿼리 - 테이블 ID 맵:", Object.fromEntries(tableIdMap));

  for (const [tableName, tableId] of Array.from(tableIdMap.entries())) {
    let query = supabase
      .from("table_rows")
      .select("row_data")
      .eq("table_id", tableId);

    // 테이블별 WHERE 조건 적용
    const tableConditions = parsedQuery.conditions.filter((condition) => {
      const tableName2 = condition.column.includes(".")
        ? condition.column.split(".")[0]
        : tableName;

      // 별칭 해석
      const resolvedTableName = tableAliases.get(tableName2) || tableName2;
      return resolvedTableName === tableName;
    });

    query = applyWhereConditions(
      query,
      tableConditions,
      tableColumnsMap.get(tableName)!,
      tableAliases,
      tableName
    ) as typeof query;

    const { data: rows, error } = await query.limit(1000);

    if (error) {
      throw new Error(`${tableName} 테이블 조회 오류: ${error.message}`);
    }

    console.log(
      `테이블 ${tableName} (ID: ${tableId}) 데이터:`,
      (rows || []).length,
      "행"
    );
    if (rows && rows.length > 0) {
      console.log(`${tableName} 첫 번째 행:`, rows[0]?.row_data);
    }

    tableDataMap.set(tableName, rows || []);
  }

  // JOIN 실행
  let result = tableDataMap.get(parsedQuery.tables[0]) || [];
  console.log(`초기 결과 (${parsedQuery.tables[0]}):`, result.length, "행");

  for (const join of parsedQuery.joins!) {
    const rightTableData = tableDataMap.get(join.table) || [];
    console.log(`JOIN 대상 테이블 ${join.table}:`, rightTableData.length, "행");
    console.log("JOIN 조건:", join.on);

    // JOIN 조건의 왼쪽 테이블 결정 (별칭 해석)
    let leftTableName = parsedQuery.tables[0];
    if (join.on.left.includes(".")) {
      const leftAlias = join.on.left.split(".")[0];
      leftTableName = tableAliases.get(leftAlias) || leftAlias;
    }

    const beforeCount = result.length;
    result = performInnerJoin(
      result,
      rightTableData,
      join.on,
      leftTableName,
      join.table,
      tableColumnsMap
    );
    console.log(`JOIN 후 결과: ${beforeCount} → ${result.length} 행`);
    if (result.length > 0) {
      console.log("JOIN 후 첫 번째 행 샘플:", Object.keys(result[0].row_data));
    }
  }

  // 집계 함수 처리
  if (parsedQuery.aggregates && parsedQuery.aggregates.length > 0) {
    return processAggregates(
      result,
      parsedQuery.aggregates,
      parsedQuery.columns,
      parsedQuery.groupBy
    );
  }

  // 컬럼 선택 적용
  const allColumns: string[] = [];
  for (const [tableName, columns] of Array.from(tableColumnsMap.entries())) {
    for (const column of columns) {
      allColumns.push(`${tableName}.${column}`);
    }
  }

  return selectJoinColumns(result, parsedQuery.columns, allColumns);
}

function applyWhereConditions(
  query: unknown,
  conditions: ParsedCondition[],
  availableColumns: string[],
  tableAliases: Map<string, string>,
  currentTableName: string
) {
  if (!conditions || conditions.length === 0) {
    return query;
  }

  for (const condition of conditions) {
    let { column } = condition;
    const { operator, value } = condition;

    // 테이블 접두사가 있는 경우 처리
    if (column.includes(".")) {
      const [tableRef, columnName] = column.split(".");

      // 별칭을 실제 테이블명으로 변환
      const actualTableName = tableAliases.get(tableRef) || tableRef;

      // 현재 처리 중인 테이블이 아니면 스킵
      if (actualTableName !== currentTableName) {
        continue;
      }

      column = columnName;
    }

    // 컬럼이 존재하는지 확인
    if (!availableColumns.includes(column)) {
      throw new Error(`컬럼 '${column}'이 존재하지 않습니다`);
    }

    const queryBuilder = query as {
      eq: (column: string, value: string) => unknown;
      neq: (column: string, value: string) => unknown;
      gt: (column: string, value: string) => unknown;
      lt: (column: string, value: string) => unknown;
      gte: (column: string, value: string) => unknown;
      lte: (column: string, value: string) => unknown;
      like: (column: string, value: string) => unknown;
    };

    switch (operator) {
      case "=":
        query = queryBuilder.eq(`row_data->>${column}`, String(value));
        break;
      case "!=":
        query = queryBuilder.neq(`row_data->>${column}`, String(value));
        break;
      case ">":
        query = queryBuilder.gt(`row_data->>${column}`, String(value));
        break;
      case "<":
        query = queryBuilder.lt(`row_data->>${column}`, String(value));
        break;
      case ">=":
        query = queryBuilder.gte(`row_data->>${column}`, String(value));
        break;
      case "<=":
        query = queryBuilder.lte(`row_data->>${column}`, String(value));
        break;
      case "LIKE":
        query = queryBuilder.like(`row_data->>${column}`, String(value));
        break;
      default:
        break;
    }
  }

  return query;
}

function performInnerJoin(
  leftRows: Array<{ row_data: Record<string, unknown> }>,
  rightRows: Array<{ row_data: Record<string, unknown> }>,
  joinCondition: { left: string; right: string; operator: string },
  leftTableName: string,
  rightTableName: string,
  tableColumnsMap: Map<string, string[]>
): Array<{ row_data: Record<string, unknown> }> {
  const result: Array<{ row_data: Record<string, unknown> }> = [];

  console.log("performInnerJoin 시작");
  console.log("JOIN 조건:", joinCondition);
  console.log("왼쪽 테이블:", leftTableName, "오른쪽 테이블:", rightTableName);

  for (const leftRow of leftRows) {
    for (const rightRow of rightRows) {
      // JOIN 조건에서 실제 컬럼명 추출 (테이블 별칭 제거)
      const leftColumnName = joinCondition.left.includes(".")
        ? joinCondition.left.split(".").pop()!
        : joinCondition.left;

      // 왼쪽 데이터에서 값 찾기
      // 1. 먼저 prefixed 형태로 찾기 (예: users.id, orders.id)
      // 2. 없으면 simple 형태로 찾기 (예: id)
      const leftValue: unknown =
        leftRow.row_data[`${leftTableName}.${leftColumnName}`] ||
        leftRow.row_data[leftColumnName];

      // JOIN 조건의 오른쪽 값 추출 (오른쪽은 항상 새로운 테이블 데이터)
      const rightColumnName = joinCondition.right.includes(".")
        ? joinCondition.right.split(".").pop()!
        : joinCondition.right;
      const rightValue = rightRow.row_data[rightColumnName];

      // JOIN 조건 확인 (현재는 = 만 지원)
      if (joinCondition.operator === "=" && leftValue === rightValue) {
        // 결과 행 생성
        const joinedData: Record<string, unknown> = {};

        // 기존 왼쪽 데이터 복사 (이미 prefixed된 데이터 포함)
        for (const [key, value] of Object.entries(leftRow.row_data)) {
          joinedData[key] = value;
        }

        // 오른쪽 테이블 데이터 추가
        const rightColumns = tableColumnsMap.get(rightTableName) || [];
        for (const column of rightColumns) {
          joinedData[`${rightTableName}.${column}`] = rightRow.row_data[column];
        }

        result.push({ row_data: joinedData });
      }
    }
  }

  return result;
}

function processAggregates(
  rows: Array<{ row_data: Record<string, unknown> }>,
  aggregates: ParsedAggregate[],
  _columns: string[],
  groupBy?: string[]
): Record<string, unknown>[] {
  if (rows.length === 0) {
    // 빈 결과일 때 집계 함수 기본값 반환
    const result: Record<string, unknown> = {};
    for (const aggregate of aggregates) {
      const alias =
        aggregate.alias || `${aggregate.function}_${aggregate.column}`;
      result[alias] = aggregate.function === "COUNT" ? 0 : null;
    }
    return [result];
  }

  // GROUP BY가 없으면 전체 데이터에 대한 집계
  if (!groupBy || groupBy.length === 0) {
    return processSimpleAggregates(rows, aggregates);
  }

  // GROUP BY가 있으면 그룹별 집계
  return processGroupedAggregates(rows, aggregates, groupBy);
}

function processSimpleAggregates(
  rows: Array<{ row_data: Record<string, unknown> }>,
  aggregates: ParsedAggregate[]
): Record<string, unknown>[] {
  const result: Record<string, unknown> = {};

  for (const aggregate of aggregates) {
    const columnName = aggregate.column;
    const alias =
      aggregate.alias || `${aggregate.function}_${aggregate.column}`;

    // calculateAggregate에 전체 컬럼명 전달 (테이블 접두사 포함)
    result[alias] = calculateAggregate(aggregate.function, rows, columnName);
  }

  return [result];
}

function processGroupedAggregates(
  rows: Array<{ row_data: Record<string, unknown> }>,
  aggregates: ParsedAggregate[],
  groupBy: string[]
): Record<string, unknown>[] {
  console.log("processGroupedAggregates 시작");
  console.log(
    "첫 번째 행 데이터 키:",
    rows[0] ? Object.keys(rows[0].row_data).slice(0, 10) : []
  );

  // 데이터의 실제 컬럼명을 찾는 헬퍼 함수
  const findColumnValue = (
    row: { row_data: Record<string, unknown> },
    column: string
  ): unknown => {
    // 1. 정확한 매치 시도 (예: u.id)
    if (row.row_data[column] !== undefined) {
      return row.row_data[column];
    }

    // 2. 테이블 별칭 해석 (u.id → users.id)
    if (column.includes(".")) {
      const [, colName] = column.split(".");
      // JOIN된 데이터에서 users.id, orders.id 등으로 저장되어 있을 수 있음
      for (const [key, value] of Object.entries(row.row_data)) {
        if (key.endsWith(`.${colName}`)) {
          return value;
        }
      }
    }

    // 3. 단순 컬럼명으로 시도 (id, name 등)
    const simpleColName = column.includes(".")
      ? column.split(".").pop()!
      : column;
    return row.row_data[simpleColName];
  };

  // 그룹별로 데이터 분류
  const groups = new Map<
    string,
    Array<{ row_data: Record<string, unknown> }>
  >();

  for (const row of rows) {
    // 그룹 키 생성
    const groupKey = groupBy
      .map((col) => {
        const value = findColumnValue(row, col);
        return String(value || "");
      })
      .join("|");

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(row);
  }

  console.log("Groups formed:", groups.size);
  console.log("Group keys:", Array.from(groups.keys()));

  // 각 그룹별로 집계 수행
  const results: Record<string, unknown>[] = [];

  for (const [, groupRows] of Array.from(groups.entries())) {
    const result: Record<string, unknown> = {};

    // GROUP BY 컬럼들의 값을 결과에 포함
    const firstRow = groupRows[0];
    groupBy.forEach((col) => {
      const value = findColumnValue(firstRow, col);

      // 원본 컬럼명과 단순 컬럼명 둘 다 포함
      result[col] = value;
      const simpleColName = col.includes(".") ? col.split(".").pop()! : col;
      result[simpleColName] = value;
    });

    // 집계 함수들 계산
    for (const aggregate of aggregates) {
      const columnName = aggregate.column;
      const alias =
        aggregate.alias || `${aggregate.function}_${aggregate.column}`;

      // 집계 함수 계산 (findColumnValue 사용)
      result[alias] = calculateAggregateWithResolver(
        aggregate.function,
        groupRows,
        columnName,
        findColumnValue
      );
    }

    results.push(result);
  }

  return results;
}

function calculateAggregate(
  func: ParsedAggregate["function"],
  rows: Array<{ row_data: Record<string, unknown> }>,
  column: string
): unknown {
  // 헬퍼 함수: JOIN된 데이터에서도 컬럼 값을 찾을 수 있도록
  const getColumnValue = (row: {
    row_data: Record<string, unknown>;
  }): unknown => {
    // 1. 직접 매치
    if (row.row_data[column] !== undefined) {
      return row.row_data[column];
    }

    // 2. 테이블.컬럼 형태로 저장된 경우
    for (const [key, value] of Object.entries(row.row_data)) {
      if (key.endsWith(`.${column}`)) {
        return value;
      }
    }

    return null;
  };

  switch (func) {
    case "COUNT":
      if (column === "*") {
        return rows.length;
      } else {
        return rows.filter((row) => {
          const value = getColumnValue(row);
          return value != null && value !== "";
        }).length;
      }

    case "SUM":
      return rows.reduce((acc, row) => {
        const value = getColumnValue(row);
        const numValue = parseFloat(String(value || 0));
        return acc + (isNaN(numValue) ? 0 : numValue);
      }, 0);

    case "AVG":
      const validValues = rows
        .map((row) => {
          const value = getColumnValue(row);
          return parseFloat(String(value || 0));
        })
        .filter((val) => !isNaN(val));

      return validValues.length > 0
        ? validValues.reduce((a, b) => a + b, 0) / validValues.length
        : 0;

    case "MIN":
      const minValues = rows
        .map((row) => getColumnValue(row))
        .filter((val) => val != null)
        .map((v) => parseFloat(String(v)))
        .filter((v) => !isNaN(v));

      return minValues.length > 0 ? Math.min(...minValues) : null;

    case "MAX":
      const maxValues = rows
        .map((row) => getColumnValue(row))
        .filter((val) => val != null)
        .map((v) => parseFloat(String(v)))
        .filter((v) => !isNaN(v));

      return maxValues.length > 0 ? Math.max(...maxValues) : null;

    default:
      return null;
  }
}

function calculateAggregateWithResolver(
  func: ParsedAggregate["function"],
  rows: Array<{ row_data: Record<string, unknown> }>,
  column: string,
  findColumnValue: (
    row: { row_data: Record<string, unknown> },
    column: string
  ) => unknown
): unknown {
  switch (func) {
    case "COUNT":
      if (column === "*") {
        return rows.length;
      } else {
        // NULL이 아닌 값들만 카운트
        return rows.filter((row) => {
          const value = findColumnValue(row, column);
          return value != null && value !== "";
        }).length;
      }

    case "SUM":
      return rows.reduce((acc, row) => {
        const value = findColumnValue(row, column);
        const numValue = parseFloat(String(value || 0));
        return acc + (isNaN(numValue) ? 0 : numValue);
      }, 0);

    case "AVG":
      const validValues = rows
        .map((row) => {
          const value = findColumnValue(row, column);
          return parseFloat(String(value || 0));
        })
        .filter((val) => !isNaN(val));

      return validValues.length > 0
        ? validValues.reduce((a, b) => a + b, 0) / validValues.length
        : 0;

    case "MIN":
      const minValues = rows
        .map((row) => findColumnValue(row, column))
        .filter((val) => val != null)
        .map((v) => parseFloat(String(v)))
        .filter((v) => !isNaN(v));

      return minValues.length > 0 ? Math.min(...minValues) : null;

    case "MAX":
      const maxValues = rows
        .map((row) => findColumnValue(row, column))
        .filter((val) => val != null)
        .map((v) => parseFloat(String(v)))
        .filter((v) => !isNaN(v));

      return maxValues.length > 0 ? Math.max(...maxValues) : null;

    default:
      return null;
  }
}

function selectColumns(
  rows: Array<{ row_data: Record<string, unknown> }>,
  queryColumns: string[],
  availableColumns: string[]
): Record<string, unknown>[] {
  const selectColumns = queryColumns.includes("*")
    ? availableColumns
    : queryColumns; // 모든 요청된 컬럼을 포함 (존재하지 않으면 null로 표시)

  const finalResult = rows.map((row) => {
    const result: Record<string, unknown> = {};
    for (const column of selectColumns) {
      result[column] = row.row_data[column] ?? null;
    }
    return result;
  });

  return finalResult;
}

function selectJoinColumns(
  rows: Array<{ row_data: Record<string, unknown> }>,
  queryColumns: string[],
  allColumns: string[]
): Record<string, unknown>[] {
  const selectColumns = queryColumns.includes("*") ? allColumns : queryColumns;

  return rows.map((row) => {
    const result: Record<string, unknown> = {};

    for (const column of selectColumns) {
      if (column === "*") {
        // * 선택시 모든 컬럼 포함
        Object.assign(result, row.row_data);
      } else {
        // 특정 컬럼 선택
        let actualColumn = column;
        if (column.includes(".")) {
          actualColumn = column;
        } else {
          // 테이블 접두사 없는 경우 첫 번째 매칭되는 컬럼 찾기
          const matchingColumn = allColumns.find((col) =>
            col.endsWith(`.${column}`)
          );
          if (matchingColumn) {
            actualColumn = matchingColumn;
          }
        }
        result[actualColumn] = row.row_data[actualColumn] ?? null;
      }
    }

    return result;
  });
}
