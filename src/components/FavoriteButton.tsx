"use client";

import { useEffect, useState } from "react";

export default function FavoriteButton({ slug }: { slug: string }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const values = JSON.parse(localStorage.getItem("aydemir-favorites") || "[]") as string[];
    setActive(values.includes(slug));
  }, [slug]);

  function toggle() {
    const values = JSON.parse(localStorage.getItem("aydemir-favorites") || "[]") as string[];
    const next = values.includes(slug)
      ? values.filter((item) => item !== slug)
      : [...values, slug];

    localStorage.setItem("aydemir-favorites", JSON.stringify(next));
    setActive(next.includes(slug));
  }

  return (
    <button
      type="button"
      className={`ap-icon-button ${active ? "is-active" : ""}`}
      onClick={toggle}
      aria-label={active ? "Favorilerden çıkar" : "Favorilere ekle"}
    >
      {active ? "★" : "☆"}
    </button>
  );
}
