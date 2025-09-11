"use client";

import classNames from "classnames/bind";

import { ForeignKeyAnalysisData } from "@/types/chatbot";

import styles from "../StageDisplay.module.css";

const cx = classNames.bind(styles);

interface ForeignKeyAnalysisDisplayProps {
  data: ForeignKeyAnalysisData;
}

export function ForeignKeyAnalysisDisplay({
  data,
}: ForeignKeyAnalysisDisplayProps) {
  return (
    <div className={cx("stage-data")}>
      <div className={cx("stage-section")}>
        <h5 className={cx("section-title")}>🔗 외래키 관계</h5>
        {data.foreign_key_relationships.length > 0 ? (
          <div className={cx("fk-list")}>
            {data.foreign_key_relationships.map((fk, index) => (
              <div key={index} className={cx("fk-item")}>
                <div className={cx("fk-relationship")}>
                  <span className={cx("fk-from")}>
                    {fk.from_table}.{fk.from_column}
                  </span>
                  <span className={cx("fk-arrow")}>→</span>
                  <span className={cx("fk-to")}>
                    {fk.to_table}.{fk.to_column}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={cx("no-relationships")}>
            외래키 관계가 발견되지 않았습니다
          </p>
        )}
      </div>
    </div>
  );
}
