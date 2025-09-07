import classNames from "classnames/bind";
import { Database } from "lucide-react";
import React from "react";

import styles from "./ProjectFormHeader.module.css";

const cx = classNames.bind(styles);

export default function ProjectFormHeader() {
  return (
    <div className={cx("form-header")}>
      <div className={cx("form-icon")}>
        <Database size={24} />
      </div>
      <div className={cx("form-title-section")}>
        <h2 className={cx("form-title")}>Create New Project</h2>
        <p className={cx("form-description")}>
          Set up a new database project to start designing your schema
        </p>
      </div>
    </div>
  );
}
