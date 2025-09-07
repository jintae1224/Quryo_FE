import { DATABASES } from "@/constants/database";
import type { DatabaseType } from "@/types/database";
import type { ProjectRequest } from "@/types/project";

// 유효성 검사 규칙
export const PROJECT_VALIDATION_RULES = {
  PROJECT_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
    PATTERN: /^[a-zA-Z0-9가-힣\s_-]+$/,
  },
  DESCRIPTION: {
    MAX_LENGTH: 500,
  },
} as const;

// 유효성 검사 메시지
export const VALIDATION_MESSAGES = {
  PROJECT_NAME: {
    REQUIRED: "프로젝트명을 입력해주세요",
    MIN_LENGTH: (min: number) => `프로젝트명은 최소 ${min}자 이상이어야 합니다`,
    MAX_LENGTH: (max: number) => `프로젝트명은 ${max}자를 초과할 수 없습니다`,
    PATTERN:
      "프로젝트명은 한글, 영문, 숫자, 공백, 하이픈, 언더스코어만 사용 가능합니다",
  },
  DATABASE_TYPE: {
    REQUIRED: "데이터베이스 타입을 선택해주세요",
    INVALID: "올바른 데이터베이스 타입을 선택해주세요",
  },
  DESCRIPTION: {
    MAX_LENGTH: (max: number) => `설명은 ${max}자를 초과할 수 없습니다`,
  },
} as const;

// 유효성 검사 함수들
export const projectValidators = {
  project_name: (value: string | undefined): string => {
    if (!value?.trim()) {
      return VALIDATION_MESSAGES.PROJECT_NAME.REQUIRED;
    }

    const trimmed = value.trim();

    if (trimmed.length < PROJECT_VALIDATION_RULES.PROJECT_NAME.MIN_LENGTH) {
      return VALIDATION_MESSAGES.PROJECT_NAME.MIN_LENGTH(
        PROJECT_VALIDATION_RULES.PROJECT_NAME.MIN_LENGTH
      );
    }

    if (trimmed.length > PROJECT_VALIDATION_RULES.PROJECT_NAME.MAX_LENGTH) {
      return VALIDATION_MESSAGES.PROJECT_NAME.MAX_LENGTH(
        PROJECT_VALIDATION_RULES.PROJECT_NAME.MAX_LENGTH
      );
    }

    if (!PROJECT_VALIDATION_RULES.PROJECT_NAME.PATTERN.test(trimmed)) {
      return VALIDATION_MESSAGES.PROJECT_NAME.PATTERN;
    }

    return "";
  },

  database_type: (value: string | undefined): string => {
    if (!value) {
      return VALIDATION_MESSAGES.DATABASE_TYPE.REQUIRED;
    }

    const validTypes = DATABASES.map((db) => db.value);
    if (!validTypes.includes(value as DatabaseType)) {
      return VALIDATION_MESSAGES.DATABASE_TYPE.INVALID;
    }

    return "";
  },

  description: (value: string | undefined): string => {
    if (
      value &&
      value.trim().length > PROJECT_VALIDATION_RULES.DESCRIPTION.MAX_LENGTH
    ) {
      return VALIDATION_MESSAGES.DESCRIPTION.MAX_LENGTH(
        PROJECT_VALIDATION_RULES.DESCRIPTION.MAX_LENGTH
      );
    }
    return "";
  },
} as const;

// 초기 폼 데이터를 위한 헬퍼 함수
export const createInitialFormData = (
  defaultDatabaseType: DatabaseType
): ProjectRequest => ({
  project_name: "",
  description: "",
  database_type: defaultDatabaseType,
});
