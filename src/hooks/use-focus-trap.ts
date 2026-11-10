import { useEffect, useRef, useState } from "react";

/**
 * Focus trap hook that prevents focus from leaving a modal dialog. When `isOpen` is true, Tab/Shift+Tab key presses
 * are intercepted to keep focus within the modal element.
 *
 * @param modalRef - Ref to the modal container element
 * @param isOpen - Whether the modal is currently open
 * @param stopClose - Callback when Escape is pressed (optional)
 */
export function useFocusTrap(
  modalRef: React.RefObject<HTMLDivElement>,
  isOpen: boolean,
  stopClose?: () => void,
) {
  const [focusableElements, setFocusableElements] = useState<HTMLElement[]>([]);
  const activeIndexRef = useRef<number>(-1);

  useEffect(() => {
    if (!isOpen || !modalRef.current) {
      setFocusableElements([]);
      activeIndexRef.current = -1;
      return;
    }

    const elements = modalRef.current.querySelectorAll<
      HTMLAnchorElement | HTMLButtonElement | HTMLInputElement | HTMLTextAreaElement
    >("a[href], button, input, textarea, [tabindex]:not([disabled])");

    const foundElements: HTMLElement[] = [];
    elements.forEach((el) => {
      if (el instanceof HTMLElement) {
        foundElements.push(el);
      }
    });

    setFocusableElements(foundElements);

    if (activeIndexRef.current >= 0 && activeIndexRef.current < foundElements.length) {
      // ok
    } else {
      activeIndexRef.current = 0;
    }
  }, [isOpen, modalRef]);

  useEffect(() => {
    if (!isOpen || !modalRef.current || focusableElements.length === 0) return;

    const onKeyDown = (event: KeyboardEvent) => {
      // Shift + Tab - focus previous element
      if (event.key === "Tab" && event.shiftKey) {
        event.preventDefault();

        if (activeIndexRef.current <= 0) {
          // Focus last element
          const last = focusableElements[focusableElements.length - 1];
          last.focus();
          activeIndexRef.current = focusableElements.length - 1;
        } else {
          // Focus previous element
          const prev = focusableElements[activeIndexRef.current - 1];
          prev.focus();
          activeIndexRef.current -= 1;
        }
      }

      // Tab - focus next element
      if (event.key === "Tab" && !event.shiftKey) {
        event.preventDefault();
        if (activeIndexRef.current >= focusableElements.length - 1) {
          // Focus first element
          const first = focusableElements[0];
          first.focus();
          activeIndexRef.current = 0;
        } else {
          // Focus next element
          const next = focusableElements[activeIndexRef.current + 1];
          next.focus();
          activeIndexRef.current += 1;
        }
      }

      if (event.key === "Escape") {
        stopClose?.();
      }
    };

    modalRef.current.addEventListener("keydown", onKeyDown);

    return () => {
      modalRef.current.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, modalRef, focusableElements, stopClose]);
}