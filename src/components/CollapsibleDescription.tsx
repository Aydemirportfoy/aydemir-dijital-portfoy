"use client";

import {
  useMemo,
  useState,
} from "react";

export default function CollapsibleDescription({
  text,
}: {
  text: string;
}) {
  const [
    expanded,
    setExpanded,
  ] = useState(false);

  const isLong = useMemo(() => {
    const visibleLines =
      text
        .split(/\r?\n/)
        .filter(
          (line) =>
            line.trim().length > 0,
        ).length;

    return (
      text.length > 380 ||
      visibleLines > 7
    );
  }, [text]);

  return (
    <div
      className={
        expanded
          ? "ap-collapsible-description is-expanded"
          : "ap-collapsible-description"
      }
    >
      <div
        className="ap-description-content"
        style={{
          maxHeight:
            expanded || !isLong
              ? "none"
              : "280px",
          overflow:
            expanded || !isLong
              ? "visible"
              : "hidden",
        }}
      >
        {text}
      </div>

      {isLong ? (
        <button
          type="button"
          className="ap-description-toggle"
          aria-expanded={expanded}
          onClick={() =>
            setExpanded(
              (current) =>
                !current,
            )
          }
        >
          {expanded
            ? "Daha Az Göster"
            : "Devamını Gör"}
        </button>
      ) : null}
    </div>
  );
}
