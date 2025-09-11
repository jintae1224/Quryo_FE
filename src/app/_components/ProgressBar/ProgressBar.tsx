"use client";

import classNames from "classnames/bind";

import styles from "./ProgressBar.module.css";

const cx = classNames.bind(styles);

interface ProgressBarProps {
  progress: number;
}

export function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className={cx("progress-bar-container")}>
      <div className={cx("progress-bar-track")}>
        <div 
          className={cx("progress-bar-fill")}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}