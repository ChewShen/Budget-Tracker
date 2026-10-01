"use client";

import { useEffect } from "react";

// Keeps the page behind an open sheet from scrolling. `overflow: hidden` alone isn't enough on
// iPhone Safari (a swipe on the sheet can still scroll the page underneath), so the body is
// pinned in place at its current scroll position and put back exactly there on close.
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const { body } = document;
    const y = window.scrollY;
    const previous = { position: body.style.position, top: body.style.top, width: body.style.width, overflow: body.style.overflow };
    body.style.position = "fixed";
    body.style.top = `-${y}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";
    return () => {
      Object.assign(body.style, previous);
      window.scrollTo(0, y);
    };
  }, [active]);
}
