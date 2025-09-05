"use client";

import classNames from "classnames/bind";
import { Database, Settings, User } from "lucide-react";
import React from "react";

import Logo from "@/app/_components/Logo/Logo";

import styles from "./Lnb.module.css";

const cx = classNames.bind(styles);

interface NavigationItem {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export default function Lnb() {
  const navigationItems: NavigationItem[] = [
    {
      icon: <Database size={20} />,
      label: "Database Projects",
      active: true,
    },
    {
      icon: <Settings size={20} />,
      label: "Settings",
    },
  ];

  return (
    <aside className={cx("sidebar")}>
      {/* Header */}
      <div className={cx("header")}>
        <div className={cx("logo-wrapper")}>
          <Logo />
        </div>
      </div>

      {/* Navigation */}
      <nav className={cx("navigation")}>
        <div className={cx("nav-section")}>
          <div className={cx("nav-header")}>
            <span className={cx("nav-title")}>Workspace</span>
          </div>

          <ul className={cx("nav-list")}>
            {navigationItems.map((item, index) => (
              <li key={index}>
                <button
                  className={cx("nav-item", { active: item.active })}
                  onClick={item.onClick}
                >
                  {item.icon}
                  <span className={cx("nav-label")}>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className={cx("footer")}>
        <div className={cx("user-section")}>
          <button className={cx("user-button")}>
            <div className={cx("user-avatar")}>
              <User size={16} />
            </div>
            <div className={cx("user-info")}>
              <span className={cx("user-name")}>Username</span>
              <span className={cx("user-email")}>user@example.com</span>
            </div>
          </button>
        </div>
      </div>
    </aside>
  );
}
