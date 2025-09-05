import classNames from "classnames/bind";
import React, { useState } from "react";

import GoogleIcon from "@/app/_components/Icon/GoogleIcon";
import oAuthSignIn from "@/utils/supabase/login";

import styles from "./GoogleLoginButton.module.css";

const cx = classNames.bind(styles);

interface GoogleLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
  className?: string;
}

export default function GoogleLoginButton({
  onSuccess,
  onError,
  disabled = false,
  className,
}: GoogleLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    try {
      await oAuthSignIn({ provider: "google" });
      onSuccess?.();
    } catch (error) {
      console.error("Google login error:", error);
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className={cx("google-login-button", className)}
      onClick={handleGoogleLogin}
      disabled={disabled || isLoading}
    >
      <div className={cx("icon-wrapper")}>
        <GoogleIcon />
      </div>
      <span className={cx("text")}>
        {isLoading ? "Signing in..." : "Continue with Google"}
      </span>
    </button>
  );
}
