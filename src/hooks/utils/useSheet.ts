import { useCallback, useRef, useState } from "react";

export interface SheetRef {
  close: () => void;
}

export const useSheet = () => {
  const [isOpen, setIsOpen] = useState(false);
  const sheetRef = useRef<SheetRef>(null);

  const openSheet = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeSheet = useCallback(() => {
    setIsOpen(false);
  }, []);

  const closeWithAnimation = useCallback(() => {
    sheetRef.current?.close();
  }, []);

  const toggleSheet = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return {
    isOpen,
    sheetRef,
    openSheet,
    closeSheet,
    closeWithAnimation,
    toggleSheet,
  };
};