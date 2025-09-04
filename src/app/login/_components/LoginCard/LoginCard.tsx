import classNames from "classnames/bind";
import React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/_components/Card/Card";

import GoogleLoginButton from "../GoogleLoginButton/GoogleLoginButton";
import styles from "./LoginCard.module.css";

const cx = classNames.bind(styles);

interface LoginCardProps {
  onLoginSuccess?: () => void;
  onLoginError?: (error: Error) => void;
}

export default function LoginCard({
  onLoginSuccess,
  onLoginError,
}: LoginCardProps) {
  return (
    <div className={cx("login-section")}>
      <div className={cx("login-content")}>
        <Card className={cx("login-card")}>
          <CardHeader className={cx("login-header")}>
            <CardTitle className={cx("login-title")}>Welcome back</CardTitle>
            <CardDescription className={cx("login-description")}>
              Sign in to your Quryo account to continue
            </CardDescription>
          </CardHeader>

          <CardContent className={cx("login-form")}>
            <GoogleLoginButton
              onSuccess={onLoginSuccess}
              onError={onLoginError}
              className={cx("google-button")}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
