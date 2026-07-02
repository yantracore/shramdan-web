"use client";

// Tiny localStorage-backed "saved issues" store. Issues that the user
// hearts get added to a Set persisted under the "shramdan-saved-issues"
// key. Components subscribe via useSyncExternalStore so multiple cards
// stay in sync without prop drilling.
//
// Production swap: replace the localStorage read/write with a fetch to
// POST /users/me/saved when authenticated.

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "shramdan-saved-issues";
const CUSTOM_EVENT = "shramdan-saved-issues-change";

function readSet() {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

let cachedSnapshot = null;

function getSnapshot() {
  if (cachedSnapshot === null) cachedSnapshot = readSet();
  return cachedSnapshot;
}

function getServerSnapshot() {
  return new Set();
}

function refreshSnapshot() {
  cachedSnapshot = readSet();
}

function subscribe(callback) {
  if (typeof window === "undefined") return () => {};
  const onChange = () => {
    refreshSnapshot();
    callback();
  };
  window.addEventListener(CUSTOM_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CUSTOM_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function writeSet(set) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
    window.dispatchEvent(new Event(CUSTOM_EVENT));
  } catch {
    // ignore — storage might be full or disabled
  }
}

export function useSavedIssues() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback((issueId) => {
    if (!issueId) return;
    const next = new Set(readSet());
    if (next.has(issueId)) next.delete(issueId);
    else next.add(issueId);
    writeSet(next);
  }, []);

  const isSaved = useCallback(
    (issueId) => snapshot.has(issueId),
    [snapshot]
  );

  return { saved: snapshot, isSaved, toggle, count: snapshot.size };
}
