import classNames from "classnames/bind";
import Image from "next/image";
import React from "react";

import styles from "./Logo.module.css";

const cx = classNames.bind(styles);

interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps) {
  return (
    <div className={cx("logo", className)}>
      <Image src="/images/main_logo.png" alt="Logo" width={135} height={48} />
    </div>
  );
}
