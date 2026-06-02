"use client";

// localStorage-backed "recently viewed" stack. Caller pushes a route
// + title; we keep up to 6 unique entries, most-recent first. Used by
// the homepage strip + (eventually) a /history page.
//
// Production swap: replace the localStorage read/write with a fetch to
// /users/me/recent when authenticated; offline still falls back to LS.

import { useCallback, useEffect, useSyncExternalStore } from "react";

const STORAGE_KEY = "shramdan-recent";
const CUSTOM_EVENT = "shramdan-recent-change";
const MAX_ITEMS = 6;

function readList() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const arr = JSON.parse(raw || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

let cached = null;
function snapshot() {
  if (cached === null) cached = readList();
  return cached;
}
function serverSnapshot() { return []; }

function subscribe(callback) {
  if (typeof window === "undefined") return () => {};
  const onChange = () => { cached = readList(); callback(); };
  window.addEventListener(CUSTOM_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CUSTOM_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function writeList(list) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(CUSTOM_EVENT));
  } catch {
    // ignore
  }
}

export function useRecentlyViewed() {
  const items = useSyncExternalStore(subscribe, snapshot, serverSnapshot);

  const push = useCallback((entry) => {
    if (!entry || !entry.href) return;
    const list = readList();
    const filtered = list.filter((x) => x.href !== entry.href);
    filtered.unshift({ ...entry, viewedAt: Date.now() });
    writeList(filtered.slice(0, MAX_ITEMS));
  }, []);

  const clear = useCallback(() => writeList([]), []);

  return { items, push, clear };
}

// Convenience hook for pages to call inside useEffect.
export function useTrackVisit(entry) {
  const { push } = useRecentlyViewed();
  useEffect(() => {
    if (!entry?.href) return;
    push(entry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry?.href]);
}
