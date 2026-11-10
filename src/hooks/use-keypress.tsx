"use client";

import { useEffect, useRef } from "react";

/**
 * Options for {@link useKeyPress}.
 * - `enabled` — attach the listener only while true (default `true`). Use it to scope a global shortcut to the moment
 *   it is meaningful, e.g. `{ enabled: open }`for a dialog that should only answer ESC while it is on screen.
 */
export interface UseKeyPressOptions {
  enabled?: boolean;
}

/**
 * Run `handler` when `key` is pressed anywhere in the document. Matching is against `KeyboardEvent.key`,
 * case-insensitively, so `"Escape"` and `"escape"`have the same.
 *
 * The handler always sees the latest render's closure: it is held in a ref and read at call time, so passing
 * an inline arrow does not re-subscribe the listener on every render. The listener is attached once per `key`/`enabled`change
 * and removed on unmount or when `enabled` flips to false.
 *
 * @param key — one `KeyboardEvent.key` value, or a list of them.
 * @param handler — called with the originating event, so callers can
 *   `preventDefault()` themselves.
 * @param options — see {@link UseKeyPressOptions}.
 *
 * @example Close a dialog on ESC (only while it is open)
 * ```tsx
 * useKeyPress("Escape", onClose, { enabled: open });
 * ```
 *
 * @example Dismiss a pinned tooltip
 * ```tsx
 * useKeyPress("Escape", () => setPinned(false), { enabled: pinned });
 * ```
 *
 * @example Several keys, one handler
 * ```tsx
 * useKeyPress(["Enter", "NumpadEnter"], submit);
 * ```
 */
export function useKeyPress(
  key: string | string[],
  handler: (event: KeyboardEvent) => void,
  { enabled = true }: UseKeyPressOptions = {},
): void {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  });

  const keys = (Array.isArray(key) ? key : [key]).map((k) => k.toLowerCase()).join("|");

  useEffect(() => {
    if (!enabled || !keys) return;

    const wanted = keys.split("|");

    const handleKeyDown = (event: KeyboardEvent) => {
      if (wanted.includes(event.key.toLowerCase())) handlerRef.current(event);
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabled, keys]);
}