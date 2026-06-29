import { useEffect, useState } from "react";

// Input types that open a keyboard / text caret. Others (checkbox, range, …)
// shouldn't count as "typing", so the bottom nav stays put for them.
const NON_TEXT_INPUT = new Set([
  "checkbox",
  "radio",
  "button",
  "submit",
  "reset",
  "file",
  "range",
  "color",
]);

function isEditable(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  if (el.tagName === "TEXTAREA") return true;
  if (el.tagName === "INPUT") {
    return !NON_TEXT_INPUT.has((el as HTMLInputElement).type);
  }
  return false;
}

/**
 * True while a text input / textarea / contenteditable is focused — i.e. the
 * keyboard is (about to be) open. Used to slide the bottom nav out of the way.
 */
export function useEditableFocused(): boolean {
  const [focused, setFocused] = useState(() =>
    isEditable(document.activeElement)
  );

  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      if (isEditable(e.target)) setFocused(true);
    };
    // Defer so focus hopping between two inputs doesn't flash the nav back in.
    const onFocusOut = () => {
      requestAnimationFrame(() => setFocused(isEditable(document.activeElement)));
    };

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  return focused;
}
