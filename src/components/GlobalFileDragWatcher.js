"use client";

import { useEffect } from "react";

// Watches for files being dragged anywhere on the page and exposes that
// signal as `:root[data-file-dragging="true"]` so drop zones can paint a
// hint (accent border + gentle pulse) the moment a file enters the window.
// Per-zone hover state from antd's Dragger still takes over once the file
// moves over a specific drop area.
export function GlobalFileDragWatcher() {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    let depth = 0;
    let armed = false;

    const isFileDrag = (event) => {
      const types = event.dataTransfer?.types;
      if (!types) return false;
      if (typeof types.contains === "function") return types.contains("Files");
      return Array.from(types).includes("Files");
    };

    const arm = () => {
      if (armed) return;
      armed = true;
      root.dataset.fileDragging = "true";
    };

    const disarm = () => {
      depth = 0;
      if (!armed) return;
      armed = false;
      delete root.dataset.fileDragging;
    };

    const onDragEnter = (event) => {
      if (!isFileDrag(event)) return;
      depth += 1;
      arm();
    };

    const onDragLeave = (event) => {
      if (!isFileDrag(event)) return;
      depth = Math.max(0, depth - 1);
      // relatedTarget is null when the cursor leaves the window entirely;
      // depth==0 catches the normal nested-element bookkeeping.
      if (depth === 0 || !event.relatedTarget) disarm();
    };

    const onDrop = () => disarm();
    const onDragEnd = () => disarm();
    const onWindowBlur = () => disarm();

    document.addEventListener("dragenter", onDragEnter);
    document.addEventListener("dragleave", onDragLeave);
    document.addEventListener("drop", onDrop);
    document.addEventListener("dragend", onDragEnd);
    window.addEventListener("blur", onWindowBlur);

    return () => {
      document.removeEventListener("dragenter", onDragEnter);
      document.removeEventListener("dragleave", onDragLeave);
      document.removeEventListener("drop", onDrop);
      document.removeEventListener("dragend", onDragEnd);
      window.removeEventListener("blur", onWindowBlur);
      disarm();
    };
  }, []);

  return null;
}
