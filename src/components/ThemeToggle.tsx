"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark");
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("aydemir-theme", next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      className="ap-icon-button"
      onClick={toggle}
      aria-label={dark ? "Aydınlık temaya geç" : "Karanlık temaya geç"}
      title={dark ? "Aydınlık tema" : "Karanlık tema"}
    >
      <span className="ap-theme-icon" aria-hidden="true">
        {dark ? "☀" : "☾"}
      </span>
    </button>
  );
}
