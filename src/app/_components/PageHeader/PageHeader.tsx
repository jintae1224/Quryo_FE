import classNames from "classnames/bind";
import { LucideIcon } from "lucide-react";
import React from "react";

import styles from "./PageHeader.module.css";

const cx = classNames.bind(styles);

interface PageHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export default function PageHeader({ title, description, icon: Icon }: PageHeaderProps) {
  return (
    <div className={cx("page-header")}>
      <div className={cx("header-content")}>
        <div className={cx("header-info")}>
          <div className={cx("header-icon")}>
            <Icon size={24} />
          </div>
          <div>
            <h1 className={cx("page-title")}>{title}</h1>
            <p className={cx("page-description")}>{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}