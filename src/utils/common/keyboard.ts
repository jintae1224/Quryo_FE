import { KeyboardEvent } from "react";

interface HandleKeyDownParams {
  e: KeyboardEvent<HTMLTextAreaElement>;
  isEmpty: boolean;
  isValid: boolean;
  isExecuting: boolean;
  disabled: boolean;
  onExecute: () => void;
}

export const handleEnterKeyExecution = ({
  e,
  isEmpty,
  isValid,
  isExecuting,
  disabled,
  onExecute,
}: HandleKeyDownParams) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    e.preventDefault();
    if (!isEmpty && isValid && !isExecuting && !disabled) {
      onExecute();
    }
  }
};
