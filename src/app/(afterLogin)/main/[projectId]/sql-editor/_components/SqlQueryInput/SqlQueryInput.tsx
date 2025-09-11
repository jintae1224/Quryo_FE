"use client";

import classNames from "classnames/bind";
import { AlertCircle, CheckCircle, Play } from "lucide-react";
import { KeyboardEvent } from "react";

import Button from "@/app/_components/Button/Button";
import Textarea from "@/app/_components/Textarea/Textarea";
import { useSqlValidation } from "@/hooks/sql/useSqlValidation";
import { handleEnterKeyExecution } from "@/utils/common/keyboard";

import styles from "./SqlQueryInput.module.css";

const cx = classNames.bind(styles);

interface SqlQueryInputProps {
  query: string;
  onQueryChange: (query: string) => void;
  onExecute: () => void;
  isExecuting: boolean;
  disabled?: boolean;
}

export default function SqlQueryInput({
  query,
  onQueryChange,
  onExecute,
  isExecuting,
  disabled = false,
}: SqlQueryInputProps) {
  const { isValid, error, isEmpty } = useSqlValidation({ query });

  return (
    <div className={cx("query-input-container")}>
      <div className={cx("input-header")}>
        <div className={cx("input-title")}>
          <h3>SQL Query</h3>
          {!isEmpty && isValid && <CheckCircle size={16} className={cx("validation-icon", "valid")} />}
          {!isEmpty && !isValid && <AlertCircle size={16} className={cx("validation-icon", "invalid")} />}
        </div>
        
        <Button
          variant="primary"
          size="sm"
          onClick={onExecute}
          disabled={isEmpty || !isValid || isExecuting || disabled}
          className={cx("execute-button")}
        >
          {isExecuting ? (
            <>
              <div className={cx("spinner")} />
              실행중...
            </>
          ) : (
            <>
              <Play size={14} />
              실행
            </>
          )}
        </Button>
      </div>

      <Textarea
        id="sql-query-input"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) =>
          handleEnterKeyExecution({ e, isEmpty, isValid, isExecuting, disabled, onExecute })
        }
        placeholder="SQL 쿼리를 입력하세요...&#10;예: SELECT * FROM users WHERE email LIKE '%example%'"
        className={cx("query-textarea", {
          invalid: !isEmpty && !isValid,
          valid: !isEmpty && isValid,
        })}
        disabled={disabled}
        spellCheck={false}
        rows={8}
        error={!isEmpty && !isValid}
      />

      {error && (
        <div className={cx("error-message")}>
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <div className={cx("input-footer")}>
        <span className={cx("helper-text")}>
          {query.length} characters
        </span>
      </div>
    </div>
  );
}
