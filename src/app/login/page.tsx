"use client";

import classNames from "classnames/bind";
import React from "react";

import BackgroundPlus from "@/app/_components/BackgroundPlus/BackgroundPlus";
import Logo from "@/app/_components/Logo/Logo";

import HeroSection from "./_components/HeroSection/HeroSection";
import LoginCard from "./_components/LoginCard/LoginCard";
import styles from "./page.module.css";

const cx = classNames.bind(styles);

export default function LoginPage() {
  const handleLoginSuccess = () => {
    console.log("Login successful");
  };

  const handleLoginError = (error: Error) => {
    console.error("Login failed:", error);
  };

  return (
    <div className={cx("container")}>
      {/* Background Pattern */}
      <BackgroundPlus
        plusColor="#10b981"
        backgroundColor="hsl(var(--background))"
        fade={true}
        className="opacity-30"
      />

      {/* Gradient Overlay */}

      <div className={cx("gradient-overlay")} />
      <header className={cx("header")}>
        <div className={cx("header-content")}>
          <div className={cx("header-flex")}>
            <Logo />

            <nav className={cx("nav")}>
              <a href="#" className={cx("nav-link")}>
                Features
              </a>
              <a href="#" className={cx("nav-link")}>
                Pricing
              </a>
              <a href="#" className={cx("nav-link")}>
                Documentation
              </a>
              <a href="#" className={cx("nav-link")}>
                Support
              </a>
            </nav>
          </div>
        </div>
      </header>

      <div className={cx("main-content")}>
        <HeroSection />
        <LoginCard
          onLoginSuccess={handleLoginSuccess}
          onLoginError={handleLoginError}
        />
      </div>
    </div>
  );
}
