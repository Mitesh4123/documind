import { useEffect } from "react";

/**
 * Global keyboard shortcuts:
 *  / or Cmd+K  → focus search input (if on search page) or navigate to /search
 *  Escape       → blur active input
 */
export default function useKeyboardShortcuts(navigate) {
  useEffect(() => {
    function handler(e) {
      const tag = document.activeElement?.tagName;
      const isTyping = tag === "INPUT" || tag === "TEXTAREA";

      // Cmd+K or Ctrl+K → go to search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        navigate("/search");
        setTimeout(() => {
          const input = document.querySelector('input[type="text"]');
          input?.focus();
        }, 100);
        return;
      }

      // "/" when not typing → go to search
      if (e.key === "/" && !isTyping) {
        e.preventDefault();
        navigate("/search");
        setTimeout(() => {
          const input = document.querySelector('input[type="text"]');
          input?.focus();
        }, 100);
        return;
      }

      // Escape → blur
      if (e.key === "Escape" && isTyping) {
        document.activeElement.blur();
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);
}
