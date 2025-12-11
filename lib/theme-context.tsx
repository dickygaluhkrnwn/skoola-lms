"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

// Update: Definisi 4 Jenjang Sekolah
export type Theme = "sd" | "smp" | "sma" | "uni";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Default sementara ke 'sd' sebelum user login/memilih
  const [theme, setTheme] = useState<Theme>("sd");

  useEffect(() => {
    // 1. Cek Local Storage saat pertama load
    const savedTheme = localStorage.getItem("skoola-theme") as Theme;
    const validThemes: Theme[] = ["sd", "smp", "sma", "uni"];

    if (savedTheme && validThemes.includes(savedTheme)) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
      // Fallback default
      document.documentElement.setAttribute("data-theme", "sd");
    }
  }, []);

  const toggleTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("skoola-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}