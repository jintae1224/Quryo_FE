"use client";

import classNames from "classnames/bind";
import {
  AlertCircle,
  Calendar,
  ChevronRight,
  Database,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import React from "react";

import { useProjectList } from "@/hooks/projects/useProjectList";
import { formatDate } from "@/utils/common/date";
import { getDatabaseClassName } from "@/utils/database/database";

import styles from "./ProjectList.module.css";

const cx = classNames.bind(styles);

export default function ProjectList() {
  const {
    data: projects = [],
    isLoading: loading,
    error,
    refetch: fetchProjects,
  } = useProjectList();

  if (loading) {
    return (
      <div className={cx("loading-state")}>
        <Loader2 className={cx("loading-icon")} size={20} />
        <span className={cx("loading-text")}>프로젝트를 로딩중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cx("error-state")}>
        <AlertCircle className={cx("error-icon")} size={20} />
        <span className={cx("error-text")}>
          {error?.message || "프로젝트를 불러오는데 실패했습니다"}
        </span>
        <button className={cx("retry-button")} onClick={() => fetchProjects()}>
          다시 시도
        </button>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className={cx("empty-state")}>
        <Database className={cx("empty-icon")} size={32} />
        <h3 className={cx("empty-title")}>아직 프로젝트가 없습니다</h3>
        <p className={cx("empty-description")}>
          첫 번째 데이터베이스 프로젝트를 생성해보세요
        </p>
      </div>
    );
  }

  return (
    <div className={cx("project-list")}>
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/main/${project.id}/structure`}
          className={cx("project-item")}
        >
          <div className={cx("project-main")}>
            <div className={cx("project-header")}>
              <div className={cx("project-icon")}>
                <Database size={16} />
              </div>
              <div className={cx("project-info")}>
                <h4 className={cx("project-name")}>{project.project_name}</h4>
                <div className={cx("project-meta")}>
                  <span
                    className={cx(
                      "database-type",
                      getDatabaseClassName(project.database_type)
                    )}
                  >
                    {project.database_type}
                  </span>
                  <span className={cx("project-date")}>
                    <Calendar size={12} />
                    {formatDate(project.created_at)}
                  </span>
                </div>
              </div>
              <ChevronRight className={cx("project-arrow")} size={16} />
            </div>

            {project.description && (
              <p className={cx("project-description")}>{project.description}</p>
            )}
          </div>

          <div className={cx("project-indicator")} />
        </Link>
      ))}
    </div>
  );
}
