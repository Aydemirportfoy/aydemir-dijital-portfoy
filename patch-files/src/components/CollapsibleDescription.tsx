"use client";

import { useMemo, useState } from "react";

export default function CollapsibleDescription({
  text,
}: {
  text: string;
}) {
  const [expanded, setExpanded] =
    useState(false);

  const isLong = useMemo(() => {
    const lineCount =
      text.split(/\r?\n/).filter(Boolean)
        .length;

    return (
      text.length > 520 ||
      lineCount > 9
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
      <div className="ap-description-content">
        {text}
      </div>

      {isLong ? (
        <>
          {!expanded ? (
            <div className="ap-description-fade" />
          ) : null}

          <button
            type="button"
            className="ap-description-toggle"
            onClick={() =>
              setExpanded(
                (current) => !current,
              )
            }
          >
            {expanded
              ? "Daha Az Göster"
              : "Açıklamanın Devamını Gör"}
          </button>
        </>
      ) : null}
    </div>
  );
}
