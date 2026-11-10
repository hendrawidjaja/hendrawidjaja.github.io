import { useEffect } from "react";

/**
 * Hook to disable body overflow when a modal is open
 * @param isOpen - whether the modal is open
 */
export const useModalScroll = (isOpen: boolean) => {
  useEffect(() => {
    const body = document.body;

    if (isOpen) {
      const previousOverflow = body.style.overflow;
      body.style.overflow = "hidden";
      return () => {
        body.style.overflow = previousOverflow || "";
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen]);
};