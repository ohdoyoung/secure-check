import { useEffect, useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { CheckupPage } from "./pages/CheckupPage";

export type ThemeMode = "dark" | "light";

const THEME_STORAGE_KEY = "chwiyakhaenne-theme";

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    const isDark = theme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Theme still applies even when browser storage is unavailable.
    }
  }, [theme]);

  return (
    <div className="min-h-screen transition-colors duration-300">
      <AppHeader theme={theme} onThemeToggle={() => setTheme((current) => current === "dark" ? "light" : "dark")} />
      <CheckupPage />
    </div>
  );
}
