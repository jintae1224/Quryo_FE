"use client";

import classNames from "classnames/bind";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useScrollLock } from "@/hooks/utils/useScrollLack";

import XIcon from "../Icon/XIcon";
import styles from "./Sheet.module.css";

const cx = classNames.bind(styles);

export interface SheetRef {
  close: () => void;
}

interface SheetProps {
  isOpen: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

const Sheet = forwardRef<SheetRef, SheetProps>(({ isOpen, title, onClose, children, className }, ref) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // 배경 스크롤 방지
  useScrollLock({
    enabled: isOpen,
    allowedSelectors: ["[data-scroll-allowed]", ".sheet-content"],
  });

  // 애니메이션과 함께 닫기
  const handleClose = useCallback(() => {
    if (isClosing) return;
    
    setIsClosing(true);
    const container = containerRef.current;
    const overlay = overlayRef.current;
    
    if (container && overlay) {
      container.style.transition = "transform 0.3s ease-out";
      container.style.transform = "translateX(100%)";
      overlay.style.transition = "opacity 0.3s ease-out, backdrop-filter 0.3s ease-out";
      overlay.style.opacity = "0";
      overlay.style.backdropFilter = "blur(0px)";
    }
    
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  }, [isClosing, onClose]);

  // 외부에서 닫기 가능하도록 expose
  useImperativeHandle(ref, () => ({
    close: handleClose,
  }), [handleClose]);

  // 열릴 때 애니메이션
  useEffect(() => {
    if (!isOpen) return;

    const container = containerRef.current;
    const overlay = overlayRef.current;
    
    if (container && overlay) {
      // 초기 상태 설정
      container.style.transition = "none";
      container.style.transform = "translateX(100%)";
      overlay.style.transition = "none";
      overlay.style.opacity = "0";
      overlay.style.backdropFilter = "blur(0px)";
      
      requestAnimationFrame(() => {
        // 애니메이션 시작
        container.style.transition = "transform 0.3s ease-out";
        container.style.transform = "translateX(0)";
        overlay.style.transition = "opacity 0.3s ease-out, backdrop-filter 0.3s ease-out";
        overlay.style.opacity = "1";
        overlay.style.backdropFilter = "blur(4px)";
      });
    }
  }, [isOpen]);

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, handleClose]);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 마운트되지 않았거나 열리지 않으면 숨김
  if (!isMounted || (!isOpen && !isClosing)) return null;

  const handleOverlayClick = () => {
    handleClose();
  };

  return createPortal(
    <div ref={overlayRef} className={cx("overlay")} onClick={handleOverlayClick}>
      <div
        ref={containerRef}
        className={cx("container", className)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cx("header")}>
          {title && <h2 className={cx("title")}>{title}</h2>}
          <button className={cx("close")} onClick={handleClose}>
            <XIcon />
          </button>
        </div>

        <div className={cx("content")} data-scroll-allowed>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
});

Sheet.displayName = "Sheet";

export default Sheet;