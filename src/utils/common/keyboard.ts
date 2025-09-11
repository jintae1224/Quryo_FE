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

interface HandleSimpleEnterParams {
  e: KeyboardEvent<HTMLTextAreaElement>;
  onExecute: () => void;
}

export const handleSimpleEnter = ({ e, onExecute }: HandleSimpleEnterParams) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    onExecute();
  }
};

export const handleKeyDown = (onExecute: () => void) => {
  return (e: KeyboardEvent<HTMLTextAreaElement>) => {
    handleSimpleEnter({ e, onExecute });
  };
};
