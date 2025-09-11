"use client";

import classNames from "classnames/bind";

import { useSqlEditor } from "@/hooks/sql/useSqlEditor";

import styles from "./SqlEditor.module.css";
import SqlQueryInput from "./SqlQueryInput/SqlQueryInput";
import SqlResultsDisplay from "./SqlResultsDisplay/SqlResultsDisplay";

const cx = classNames.bind(styles);

interface SqlEditorProps {
  projectId: string;
}

export function SqlEditor({ projectId }: SqlEditorProps) {
  const {
    query,
    queryResult,
    isExecuting,
    executionError,
    handleExecuteQuery,
    handleQueryChange,
  } = useSqlEditor({ projectId });

  return (
    <div className={cx("sql-editor")}>
      <div className={cx("editor-layout")}>
        <div className={cx("main-content")}>
          <SqlQueryInput
            query={query}
            onQueryChange={handleQueryChange}
            onExecute={handleExecuteQuery}
            isExecuting={isExecuting}
          />

          <SqlResultsDisplay
            result={queryResult}
            error={executionError}
            isLoading={isExecuting}
          />
        </div>
      </div>
    </div>
  );
}
