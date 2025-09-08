"use client";

import classNames from "classnames/bind";
import {
  Code,
  Database,
  MessageSquareDot,
  TableProperties,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./ProjectLnb.module.css";

const cx = classNames.bind(styles);

interface ProjectLnbProps {
  projectId: string;
  projectName?: string;
  projectDescription?: string;
}

const tabs = [
  {
    id: "structure",
    name: "구조",
    href: "/main/[projectId]/structure",
    icon: TableProperties,
    description: "테이블 및 컬럼 구조 관리",
  },
  {
    id: "database",
    name: "데이터베이스",
    href: "/main/[projectId]/database",
    icon: Database,
    description: "데이터 조회 및 관리",
  },
  {
    id: "chatbot",
    name: "Chat Bot",
    href: "/main/[projectId]/chatbot",
    icon: MessageSquareDot,
    description: "AI 챗봇과 대화",
  },
  {
    id: "sql-editor",
    name: "SQL Editor",
    href: "/main/[projectId]/sql-editor",
    icon: Code,
    description: "SQL 쿼리 작성 및 실행",
  },
];

export default function ProjectLnb({ 
  projectId, 
  projectName, 
  projectDescription 
}: ProjectLnbProps) {
  const pathname = usePathname();

  return (
    <nav className={cx("project-nav")}>
      {/* 프로젝트 정보 */}
      {projectName && (
        <div className={cx("project-info")}>
          <div className={cx("project-icon")}>
            <Database size={20} />
          </div>
          <div className={cx("project-details")}>
            <h2 className={cx("project-title")}>{projectName}</h2>
            {projectDescription && (
              <p className={cx("project-description")}>{projectDescription}</p>
            )}
          </div>
        </div>
      )}
      
      {/* 탭 네비게이션 */}
      <div className={cx("tabs")}>
        {tabs.map((tab) => {
          const href = tab.href.replace("[projectId]", projectId);
          const isActive = pathname.startsWith(href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.id}
              href={href}
              className={cx("tab", { active: isActive })}
            >
              <Icon size={20} className={cx("tab-icon")} />
              <span className={cx("tab-name")}>{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
