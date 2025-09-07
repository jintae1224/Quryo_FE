"use client";

import classNames from "classnames/bind";
import { Database, Plus } from "lucide-react";
import React from "react";

import Button from "@/app/_components/Button/Button";
import PageHeader from "@/app/_components/PageHeader/PageHeader";
import Sheet from "@/app/_components/Sheet/Sheet";
import { useSheet } from "@/hooks/utils/useSheet";

import styles from "./Project.module.css";
import ProjectForm from "./ProjectForm/ProjectForm";
import ProjectList from "./ProjectList/ProjectList";

const cx = classNames.bind(styles);

export default function Project() {
  const {
    isOpen: isCreateSheetOpen,
    sheetRef,
    openSheet: openCreateSheet,
    closeSheet: closeCreateSheet,
    onClose,
  } = useSheet();

  return (
    <div className={cx("page")}>
      <PageHeader
        title="데이터베이스 프로젝트"
        description="데이터베이스 스키마를 관리하고 데이터 구조를 설계하세요"
        icon={Database}
      />

      <div className={cx("container")}>
        <div className={cx("card")}>
          <div className={cx("header")}>
            <h2 className={cx("title")}>내 프로젝트</h2>
            <Button onClick={openCreateSheet} className={cx("button")}>
              <Plus size={16} />새 프로젝트
            </Button>
          </div>
          <div className={cx("content")}>
            <ProjectList />
          </div>
        </div>
      </div>

      <Sheet
        ref={sheetRef}
        isOpen={isCreateSheetOpen}
        onClose={closeCreateSheet}
        title="새 프로젝트 만들기"
      >
        <ProjectForm onClose={onClose} />
      </Sheet>
    </div>
  );
}
