"use client";

import classNames from "classnames/bind";
import React, { forwardRef, InputHTMLAttributes } from "react";

import styles from "./Input.module.css";

const cx = classNames.bind(styles);

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  error?: boolean;
  fullWidth?: boolean;
  className?: string;
  label?: string;
  helperText?: string;
  errorMessage?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      error = false,
      fullWidth = true,
      className,
      label,
      helperText,
      errorMessage,
      id,
      disabled,
      type = "text",
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={cx("input-container", { "full-width": fullWidth })}>
        {label && (
          <label htmlFor={inputId} className={cx("input-label")}>
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          className={cx(
            "input",
            {
              error: error || !!errorMessage,
              disabled,
            },
            className
          )}
          {...props}
        />

        {(helperText || errorMessage) && (
          <div
            className={cx("input-helper", { error: error || !!errorMessage })}
          >
            {errorMessage || helperText}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
