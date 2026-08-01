"use client";

import { useEffect, useState } from "react";

export default function AdminThemeToggle() {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved =
      window.localStorage.getItem(
        "aydemir-admin-theme",
      );

    const initialDark = saved === "dark";

    setDark(initialDark);
    document.documentElement.classList.toggle(
      "aydemir-admin-dark",
      initialDark,
    );
    setReady(true);
  }, []);

  function toggleTheme() {
    const nextDark = !dark;

    setDark(nextDark);

    window.localStorage.setItem(
      "aydemir-admin-theme",
      nextDark ? "dark" : "light",
    );

    document.documentElement.classList.toggle(
      "aydemir-admin-dark",
      nextDark,
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="admin-theme-toggle"
      aria-label={
        dark
          ? "Açık moda geç"
          : "Karanlık moda geç"
      }
      title={
        dark
          ? "Açık moda geç"
          : "Karanlık moda geç"
      }
    >
      <span className="admin-theme-track">
        <span
          className="admin-theme-thumb"
          data-dark={ready && dark}
        >
          {ready && dark ? "☾" : "☀"}
        </span>
      </span>
    </button>
  );
}
