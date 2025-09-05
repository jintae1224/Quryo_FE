import React from "react";

import Lnb from "@/app/_components/Lnb/Lnb";

import styles from "./layout.module.css";

export default function AfterLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.layout}>
      <Lnb />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
