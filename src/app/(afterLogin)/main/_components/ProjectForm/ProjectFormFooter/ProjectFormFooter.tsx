import classNames from "classnames/bind";
import { Loader2 } from "lucide-react";
import React from "react";

import Button from "@/app/_components/Button/Button";

import styles from "./ProjectFormFooter.module.css";

const cx = classNames.bind(styles);

interface ProjectFormFooterProps {
  isCreating: boolean;
  isFormValid: boolean;
  onCancel: () => void;
}

export default function ProjectFormFooter({
  isCreating,
  isFormValid,
  onCancel,
}: ProjectFormFooterProps) {
  return (
    <div className={cx("footer")}>
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isCreating}
      >
        Cancel
      </Button>

      <Button type="submit" disabled={!isFormValid || isCreating}>
        {isCreating ? (
          <>
            <Loader2 size={16} className={cx("spinner")} />
            Creating...
          </>
        ) : (
          "Create Project"
        )}
      </Button>
    </div>
  );
}
