"use client";

import { useEffect, useState } from "react";

export default function DarkModeProvider() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    console.log("[DarkModeProvider] useEffect running");

    try {
      const html = document.documentElement;
      console.log("[DarkModeProvider] html element exists:", !!html);

      const stored = localStorage.getItem("darkMode");
      console.log("[DarkModeProvider] localStorage.getItem('darkMode'):", stored);

      const darkMode = stored === "true";
      console.log("[DarkModeProvider] darkMode boolean:", darkMode);

      if (darkMode) {
        html.classList.add("dark");
        console.log("[DarkModeProvider] classList.add('dark') called");
        console.log("[DarkModeProvider] html.className after add:", html.className);
      } else {
        html.classList.remove("dark");
        console.log("[DarkModeProvider] classList.remove('dark') called");
        console.log("[DarkModeProvider] html.className after remove:", html.className);
      }

      setMounted(true);
    } catch (error) {
      console.error("[DarkModeProvider] Error:", error);
    }
  }, []);

  return null;
}
