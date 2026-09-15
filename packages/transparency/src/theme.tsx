"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Icon } from "./icons";
const ThemeContext = createContext({ theme: "light", toggle: () => {} });
export function Theme({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState("light");
  useEffect(() => {
    try {
      setTheme(
        localStorage.getItem("strengthiva-theme") === "dark" ? "dark" : "light"
      );
    } catch {
      /* Storage may be disabled. */
    }
  }, []);
  const toggle = () =>
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("strengthiva-theme", next);
      } catch {}
      return next;
    });
  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      <div className="transparency" data-theme={theme}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
export function ThemeToggle() {
  const { theme, toggle } = useContext(ThemeContext);
  return (
    <button
      type="button"
      className="icon-btn"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      onClick={toggle}
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} />
    </button>
  );
}
export function PrintButton() {
  return (
    <button
      type="button"
      className="btn btn-quiet"
      aria-label="Print product record"
      onClick={() => window.print()}
    >
      <Icon name="printer" />
      <span>Print</span>
    </button>
  );
}
