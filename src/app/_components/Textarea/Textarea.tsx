"use client";

import classNames from "classnames/bind";
import React, { forwardRef, TextareaHTMLAttributes } from "react";

import styles from "./Textarea.module.css";

const cx = classNames.bind(styles);

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> {
  error?: boolean;
  fullWidth?: boolean;
  className?: string;
  label?: string;
  helperText?: string;
  errorMessage?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
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
      rows = 3,
      ...props
    },
    ref
  ) => {
    const textareaId =
      id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={cx("textarea-container", { "full-width": fullWidth })}>
        {label && (
          <label htmlFor={textareaId} className={cx("textarea-label")}>
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          disabled={disabled}
          className={cx(
            "textarea",
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
            className={cx("textarea-helper", {
              error: error || !!errorMessage,
            })}
          >
            {errorMessage || helperText}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;
