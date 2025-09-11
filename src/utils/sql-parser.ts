import {
  ParsedAggregate,
  ParsedCondition,
  ParsedJoin,
  ParsedOrderBy,
  ParsedSqlQuery,
} from "@/types/sql";

/**
 * 간단한 SQL 파서 (SELECT 쿼리 위주로 구현)
 */
export class SqlParser {
  private query: string;
  private tokens: string[];
  private position: number;

  constructor(query: string) {
    // SQL 전처리: 개행 문자 및 기타 공백 문자 정규화
    const normalizedQuery = query
      .replace(/\\n/g, " ") // \n 문자열을 공백으로
      .replace(/\\t/g, " ") // \t 문자열을 공백으로
      .replace(/\\r/g, " ") // \r 문자열을 공백으로
      .replace(/\n/g, " ") // 실제 개행을 공백으로
      .replace(/\r/g, " ") // 실제 캐리지리턴을 공백으로
      .replace(/\t/g, " ") // 실제 탭을 공백으로
      .replace(/\s+/g, " ") // 연속 공백을 하나로
      .trim(); // 앞뒤 공백 제거

    this.query = normalizedQuery;
    this.tokens = this.tokenize(this.query);
    this.position = 0;
  }

  private tokenize(sql: string): string[] {
    const tokens: string[] = [];
    let current = "";
    let inQuote = false;
    let quoteChar = "";

    for (let i = 0; i < sql.length; i++) {
      const char = sql[i];

      if (!inQuote && (char === "'" || char === '"')) {
        // 따옴표 시작
        if (current.trim()) {
          tokens.push(current.trim());
          current = "";
        }
        inQuote = true;
        quoteChar = char;
        current = char;
      } else if (inQuote && char === quoteChar) {
        // 따옴표 끝
        current += char;
        tokens.push(current);
        current = "";
        inQuote = false;
        quoteChar = "";
      } else if (inQuote) {
        // 따옴표 안의 내용
        current += char;
      } else if (/\s/.test(char)) {
        // 공백
        if (current.trim()) {
          tokens.push(current.trim());
          current = "";
        }
      } else if (/[(),;]/.test(char)) {
        // 특수 문자
        if (current.trim()) {
          tokens.push(current.trim());
          current = "";
        }
        tokens.push(char);
      } else {
        // 일반 문자
        current += char;
      }
    }

    // 마지막 토큰 추가
    if (current.trim()) {
      tokens.push(current.trim());
    }

    return tokens.filter((token) => token.length > 0);
  }

  private current(): string | undefined {
    return this.tokens[this.position];
  }

  private advance(): string | undefined {
    return this.tokens[this.position++];
  }

  // private peek(offset = 1): string | undefined {
  //   return this.tokens[this.position + offset];
  // }

  public parse(): ParsedSqlQuery {
    try {
      const queryType = this.detectQueryType();

      switch (queryType) {
        case "SELECT":
          return this.parseSelect();
        case "INSERT":
          return this.parseInsert();
        case "UPDATE":
          return this.parseUpdate();
        case "DELETE":
          return this.parseDelete();
        default:
          return {
            type: "UNKNOWN",
            tables: [],
            columns: [],
            conditions: [],
            isValid: false,
            error: "지원하지 않는 쿼리 타입입니다",
          };
      }
    } catch (error) {
      return {
        type: "UNKNOWN",
        tables: [],
        columns: [],
        conditions: [],
        isValid: false,
        error:
          error instanceof Error ? error.message : "파싱 오류가 발생했습니다",
      };
    }
  }

  private detectQueryType():
    | "SELECT"
    | "INSERT"
    | "UPDATE"
    | "DELETE"
    | "UNKNOWN" {
    const firstToken = this.tokens[0]?.toUpperCase();
    switch (firstToken) {
      case "SELECT":
        return "SELECT";
      case "INSERT":
        return "INSERT";
      case "UPDATE":
        return "UPDATE";
      case "DELETE":
        return "DELETE";
      default:
        return "UNKNOWN";
    }
  }

  private parseSelect(): ParsedSqlQuery {
    this.advance(); // consume SELECT

    const { columns, aggregates } = this.parseSelectColumns();

    if (!this.expectKeyword("FROM")) {
      throw new Error("FROM 키워드가 필요합니다");
    }

    const { tables, aliases: fromAliases } = this.parseFromClause();
    const { joins, aliases: joinAliases } = this.parseJoins();

    // 모든 별칭 통합
    const tableAliases = new Map<string, string>([
      ...fromAliases,
      ...joinAliases,
    ]);

    // JOIN된 테이블들을 tables 배열에 추가
    const allTables = [...tables];
    if (joins && joins.length > 0) {
      for (const join of joins) {
        if (!allTables.includes(join.table)) {
          allTables.push(join.table);
        }
      }
    }

    const conditions = this.parseWhereClause();
    const groupBy = this.parseGroupBy();
    const having = this.parseHaving();
    const orderBy = this.parseOrderBy();
    const { limit, offset } = this.parseLimitOffset();

    return {
      type: "SELECT",
      tables: allTables,
      columns,
      conditions,
      joins,
      orderBy,
      groupBy,
      having,
      limit,
      offset,
      aggregates,
      tableAliases,
      isValid: true,
    };
  }

  private parseSelectColumns(): {
    columns: string[];
    aggregates: ParsedAggregate[];
  } {
    const columns: string[] = [];
    const aggregates: ParsedAggregate[] = [];

    while (this.current() && this.current()!.toUpperCase() !== "FROM") {
      const token = this.advance()!;

      if (token === ",") {
        continue;
      }

      // 집계 함수 체크 - 분리된 토큰들을 재조합
      const upperToken = token.toUpperCase();
      const aggregateFunctions = ["COUNT", "SUM", "AVG", "MIN", "MAX"];

      let isAggregateFound = false;

      // 토큰이 집계 함수명인지 확인
      if (aggregateFunctions.includes(upperToken)) {
        // 다음 토큰이 '('인지 확인
        if (this.current() === "(") {
          this.advance(); // consume '('
          // ')' 까지의 모든 토큰을 수집
          const columnTokens: string[] = [];
          while (this.current() && this.current() !== ")") {
            columnTokens.push(this.advance()!);
          }

          if (this.current() === ")") {
            this.advance(); // consume ')'

            const column = columnTokens.join("").trim();

            // AS 별칭 처리
            let alias: string | undefined;
            if (this.current()?.toUpperCase() === "AS") {
              this.advance(); // consume AS
              alias = this.advance(); // get alias name
            }

            const aggregate = {
              function: upperToken as ParsedAggregate["function"],
              column: column,
              alias: alias,
            };

            aggregates.push(aggregate);

            // 집계 함수가 있으면 별칭을 컬럼으로 추가 (결과 표시용)
            columns.push(alias || `${upperToken.toLowerCase()}_${column}`);
            isAggregateFound = true;
          }
        }
      }

      if (!isAggregateFound) {
        columns.push(token);
      }
    }

    return { columns, aggregates };
  }

  private parseFromClause(): {
    tables: string[];
    aliases: Map<string, string>;
  } {
    const tables: string[] = [];
    const aliases = new Map<string, string>();

    while (
      this.current() &&
      !this.isKeyword(this.current()!, [
        "JOIN",
        "INNER",
        "LEFT",
        "RIGHT",
        "WHERE",
        "ORDER",
        "GROUP",
        "HAVING",
        "LIMIT",
      ]) &&
      this.current() !== ";" &&
      this.current() !== undefined
    ) {
      const token = this.advance()!;

      if (token === "," || token === ";") {
        continue;
      }

      // 테이블명 추가
      tables.push(token);

      // 다음 토큰이 별칭인지 확인
      const nextToken = this.current();
      if (
        nextToken &&
        !this.isKeyword(nextToken, [
          "JOIN",
          "INNER",
          "LEFT",
          "RIGHT",
          "WHERE",
          "ORDER",
          "GROUP",
          "HAVING",
          "LIMIT",
          ",",
        ]) &&
        nextToken !== "," &&
        nextToken !== ";"
      ) {
        const alias = this.advance()!;
        aliases.set(alias, token);
      }
    }

    return { tables, aliases };
  }

  private parseJoins(): { joins: ParsedJoin[]; aliases: Map<string, string> } {
    const joins: ParsedJoin[] = [];
    const aliases = new Map<string, string>();

    while (
      this.current() &&
      this.isKeyword(this.current()!, ["JOIN", "INNER", "LEFT", "RIGHT"])
    ) {
      let joinType: ParsedJoin["type"] = "INNER";

      const joinKeyword = this.current()!.toUpperCase();
      if (joinKeyword === "LEFT") {
        joinType = "LEFT";
        this.advance();
        this.expectKeyword("JOIN");
      } else if (joinKeyword === "RIGHT") {
        joinType = "RIGHT";
        this.advance();
        this.expectKeyword("JOIN");
      } else if (joinKeyword === "INNER") {
        joinType = "INNER";
        this.advance();
        this.expectKeyword("JOIN");
      } else if (joinKeyword === "JOIN") {
        this.advance();
      }

      const table = this.advance();
      if (!table) break;

      // 테이블 별칭 처리
      let tableAlias = "";
      const nextToken = this.current();
      if (
        nextToken &&
        nextToken.toUpperCase() !== "ON" &&
        !this.isKeyword(nextToken, [
          "WHERE",
          "ORDER",
          "GROUP",
          "HAVING",
          "LIMIT",
        ])
      ) {
        tableAlias = this.advance()!;
        aliases.set(tableAlias, table);
      }

      if (!this.expectKeyword("ON")) {
        break;
      }

      const left = this.advance();
      const operator = this.advance();
      const right = this.advance();

      if (left && operator && right) {
        joins.push({
          type: joinType,
          table,
          on: {
            left,
            right,
            operator,
          },
        });
      }
    }

    return { joins, aliases };
  }

  private parseOrderBy(): ParsedOrderBy[] {
    if (!this.current() || this.current()!.toUpperCase() !== "ORDER") {
      return [];
    }

    this.advance(); // consume ORDER
    if (!this.expectKeyword("BY")) {
      return [];
    }

    const orderBy: ParsedOrderBy[] = [];

    while (
      this.current() &&
      !this.isKeyword(this.current()!, ["LIMIT", "OFFSET"])
    ) {
      const column = this.advance();
      if (!column || column === ",") continue;

      let direction: "ASC" | "DESC" = "ASC";
      if (
        this.current() &&
        (this.current()!.toUpperCase() === "ASC" ||
          this.current()!.toUpperCase() === "DESC")
      ) {
        direction = this.advance()!.toUpperCase() as "ASC" | "DESC";
      }

      orderBy.push({ column, direction });

      // Skip comma
      if (this.current() === ",") {
        this.advance();
      }
    }

    return orderBy;
  }

  private parseGroupBy(): string[] {
    if (!this.current() || this.current()!.toUpperCase() !== "GROUP") {
      return [];
    }

    this.advance(); // consume GROUP
    if (!this.expectKeyword("BY")) {
      return [];
    }

    const groupBy: string[] = [];

    while (
      this.current() &&
      !this.isKeyword(this.current()!, ["HAVING", "ORDER", "LIMIT"]) &&
      this.current() !== ";"
    ) {
      const column = this.advance();
      if (column && column !== ",") {
        groupBy.push(column);
      }
    }

    return groupBy;
  }

  private parseHaving(): ParsedCondition[] {
    if (!this.current() || this.current()!.toUpperCase() !== "HAVING") {
      return [];
    }

    this.advance(); // consume HAVING
    return this.parseConditions(["ORDER", "LIMIT"]);
  }

  private parseLimitOffset(): { limit?: number; offset?: number } {
    let limit: number | undefined;
    let offset: number | undefined;

    if (this.current() && this.current()!.toUpperCase() === "LIMIT") {
      this.advance(); // consume LIMIT
      const limitValue = this.advance();
      if (limitValue && /^\d+$/.test(limitValue)) {
        limit = parseInt(limitValue, 10);
      }
    }

    if (this.current() && this.current()!.toUpperCase() === "OFFSET") {
      this.advance(); // consume OFFSET
      const offsetValue = this.advance();
      if (offsetValue && /^\d+$/.test(offsetValue)) {
        offset = parseInt(offsetValue, 10);
      }
    }

    return { limit, offset };
  }

  private parseWhereClause(): ParsedCondition[] {
    if (!this.current() || this.current()!.toUpperCase() !== "WHERE") {
      return [];
    }

    this.advance(); // consume WHERE
    return this.parseConditions([
      "JOIN",
      "INNER",
      "LEFT",
      "RIGHT",
      "ORDER",
      "GROUP",
      "HAVING",
      "LIMIT",
    ]);
  }

  private parseConditions(stopKeywords: string[]): ParsedCondition[] {
    const conditions: ParsedCondition[] = [];

    while (this.current() && !this.isKeyword(this.current()!, stopKeywords)) {
      const condition = this.parseCondition();
      if (condition) {
        // 논리 연산자 체크
        if (
          this.current() &&
          (this.current()!.toUpperCase() === "AND" ||
            this.current()!.toUpperCase() === "OR")
        ) {
          condition.logicalOperator = this.advance()!.toUpperCase() as
            | "AND"
            | "OR";
        }
        conditions.push(condition);
      } else {
        // 파싱 실패 시 무한 루프 방지
        this.advance();
      }
    }

    return conditions;
  }

  private parseCondition(): ParsedCondition | null {
    const column = this.advance();
    if (!column) return null;

    const operator = this.advance();
    if (!operator) return null;

    const value = this.advance();
    if (!value) return null;

    return {
      column,
      operator: this.normalizeOperator(operator),
      value: this.parseValue(value),
    };
  }

  private normalizeOperator(op: string): ParsedCondition["operator"] {
    const upperOp = op.toUpperCase();
    switch (upperOp) {
      case "=":
        return "=";
      case "!=":
      case "<>":
        return "!=";
      case ">":
        return ">";
      case "<":
        return "<";
      case ">=":
        return ">=";
      case "<=":
        return "<=";
      case "LIKE":
        return "LIKE";
      case "IN":
        return "IN";
      default:
        return "=";
    }
  }

  private parseValue(value: string): unknown {
    // Remove quotes
    if (
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))
    ) {
      return value.slice(1, -1);
    }

    // Try to parse as number
    if (/^\d+$/.test(value)) {
      return parseInt(value, 10);
    }

    if (/^\d+\.\d+$/.test(value)) {
      return parseFloat(value);
    }

    // Boolean
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;

    // Null
    if (value.toUpperCase() === "NULL") return null;

    return value;
  }

  private parseInsert(): ParsedSqlQuery {
    this.advance(); // consume INSERT

    if (!this.expectKeyword("INTO")) {
      throw new Error("INSERT INTO 형식이어야 합니다");
    }

    const table = this.advance();
    if (!table) {
      throw new Error("테이블 이름이 필요합니다");
    }

    return {
      type: "INSERT",
      tables: [table],
      columns: [], // INSERT의 컬럼 파싱은 복잡하므로 일단 생략
      conditions: [],
      isValid: true,
    };
  }

  private parseUpdate(): ParsedSqlQuery {
    this.advance(); // consume UPDATE

    const table = this.advance();
    if (!table) {
      throw new Error("테이블 이름이 필요합니다");
    }

    if (!this.expectKeyword("SET")) {
      throw new Error("SET 키워드가 필요합니다");
    }

    // SET 절 건너뛰고 WHERE 절 찾기
    while (this.current() && this.current()!.toUpperCase() !== "WHERE") {
      this.advance();
    }

    const conditions = this.parseWhereClause();

    return {
      type: "UPDATE",
      tables: [table],
      columns: [],
      conditions,
      isValid: true,
    };
  }

  private parseDelete(): ParsedSqlQuery {
    this.advance(); // consume DELETE

    if (!this.expectKeyword("FROM")) {
      throw new Error("DELETE FROM 형식이어야 합니다");
    }

    const table = this.advance();
    if (!table) {
      throw new Error("테이블 이름이 필요합니다");
    }

    const conditions = this.parseWhereClause();

    return {
      type: "DELETE",
      tables: [table],
      columns: [],
      conditions,
      isValid: true,
    };
  }

  private expectKeyword(keyword: string): boolean {
    if (this.current()?.toUpperCase() === keyword.toUpperCase()) {
      this.advance();
      return true;
    }
    return false;
  }

  private isKeyword(token: string, keywords: string[]): boolean {
    return keywords.some(
      (keyword) => keyword.toUpperCase() === token.toUpperCase()
    );
  }
}

export function parseSqlQuery(query: string): ParsedSqlQuery {
  const parser = new SqlParser(query);
  return parser.parse();
}
