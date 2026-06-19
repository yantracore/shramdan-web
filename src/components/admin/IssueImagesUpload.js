"use client";

import { DeleteOutlined, LoadingOutlined, PlusOutlined } from "@ant-design/icons";
import { Upload } from "antd";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  ACCEPTED_IMAGE_ACCEPT_ATTR,
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES
} from "@/components/admin/imageUploadConstants";
import { uploadImage } from "@/lib/uploads";
import { useToast } from "@/lib/toast";

const MAX_ITEMS = 10;

// Browsers never expose a file's absolute path, but name + size + lastModified
// is a strong fingerprint for "the same file picked again" within a session.
const fileSignature = (file) => `${file.name}::${file.size}::${file.lastModified}`;

export function IssueImagesUpload({ value, onChange, disabled, onUploadingChange }) {
  const toast = useToast();
  const items = Array.isArray(value) ? value : [];

  const valueRef = useRef(items);
  useEffect(() => {
    valueRef.current = items;
  });

  const [uploadingCount, setUploadingCount] = useState(0);
  const uploadingCountRef = useRef(0);

  // Let a parent form block its "next"/"submit" button while any tile is still
  // uploading, so a pending image can't be dropped by advancing too early.
  useEffect(() => {
    onUploadingChange?.(uploadingCount > 0);
  }, [uploadingCount, onUploadingChange]);

  // Signatures currently occupied: in-flight uploads + committed images.
  const seenSignaturesRef = useRef(new Set());
  // Committed image id -> signature, so a removed tile frees its signature.
  const signatureByIdRef = useRef(new Map());

  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const commit = (next) => {
    valueRef.current = next;
    onChange?.(next);
  };

  const handleBeforeUpload = async (file) => {
    const room = MAX_ITEMS - valueRef.current.length - uploadingCountRef.current;
    if (room <= 0) {
      toast.error(`At most ${MAX_ITEMS} additional images can be attached.`);
      return Upload.LIST_IGNORE;
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error(`${file.name}: only PNG, JPG, WebP, GIF, or AVIF images are supported.`);
      return Upload.LIST_IGNORE;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      toast.error(`${file.name} is larger than 8 MB.`);
      return Upload.LIST_IGNORE;
    }

    // Block the same photo from being added twice within this session.
    const signature = fileSignature(file);
    if (seenSignaturesRef.current.has(signature)) {
      toast.error(`${file.name} has already been added.`);
      return Upload.LIST_IGNORE;
    }
    // Reserve synchronously (before the await) so a rapid second pick or a
    // multi-select batch containing the same file is caught too.
    seenSignaturesRef.current.add(signature);

    uploadingCountRef.current += 1;
    setUploadingCount(uploadingCountRef.current);

    try {
      const result = await uploadImage(file);
      signatureByIdRef.current.set(result.id, signature);
      commit([...valueRef.current, { id: result.id, url: result.url }]);
    } catch (error) {
      // Release the reservation so the user can retry the same file.
      seenSignaturesRef.current.delete(signature);
      toast.error(error?.message || `Could not upload ${file.name}.`);
    } finally {
      uploadingCountRef.current -= 1;
      setUploadingCount(uploadingCountRef.current);
    }

    return Upload.LIST_IGNORE;
  };

  const handleRemove = (index) => {
    if (disabled) return;
    const removed = valueRef.current[index];
    if (removed) {
      // Free the signature so the user may deliberately re-add the same photo.
      const signature = signatureByIdRef.current.get(removed.id);
      if (signature) {
        seenSignaturesRef.current.delete(signature);
        signatureByIdRef.current.delete(removed.id);
      }
    }
    commit(valueRef.current.filter((_, i) => i !== index));
  };

  const handleDragStart = (index) => (event) => {
    if (disabled) return;
    setDragIndex(index);
    event.dataTransfer.effectAllowed = "move";
    try {
      event.dataTransfer.setData("text/plain", String(index));
    } catch {
      /* Firefox without setData would block drag; setData above handles it */
    }
  };

  const handleDragOver = (index) => (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) setDragOverIndex(index);
  };

  const handleDrop = (toIndex) => (event) => {
    event.preventDefault();
    setDragOverIndex(null);
    if (dragIndex === null || dragIndex === toIndex) {
      setDragIndex(null);
      return;
    }
    const next = valueRef.current.slice();
    const [moved] = next.splice(dragIndex, 1);
    next.splice(toIndex, 0, moved);
    commit(next);
    setDragIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const totalCount = items.length + uploadingCount;
  const hasRoom = totalCount < MAX_ITEMS;

  return (
    <div className="admin-issue-images">
      <div className="admin-issue-images-grid">
        {items.map((item, index) => {
          const classes = ["admin-issue-images-item"];
          if (dragIndex === index) classes.push("is-dragging");
          if (dragOverIndex === index && dragIndex !== index) classes.push("is-drop-target");
          return (
            <div
              key={item.id || item.url}
              className={classes.join(" ")}
              draggable={!disabled}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver(index)}
              onDragStart={handleDragStart(index)}
              onDrop={handleDrop(index)}
            >
              <Image
                alt=""
                height={104}
                sizes="104px"
                src={item.url}
                unoptimized
                width={104}
              />
              <button
                aria-label="Remove image"
                className="admin-issue-images-remove"
                disabled={disabled}
                onClick={() => handleRemove(index)}
                type="button"
              >
                <DeleteOutlined />
              </button>
            </div>
          );
        })}

        {Array.from({ length: uploadingCount }).map((_, idx) => (
          <div className="admin-issue-images-item is-uploading" key={`uploading-${idx}`}>
            <LoadingOutlined />
          </div>
        ))}

        {hasRoom ? (
          <Upload
            accept={ACCEPTED_IMAGE_ACCEPT_ATTR}
            beforeUpload={handleBeforeUpload}
            className="admin-issue-images-uploader"
            disabled={disabled}
            multiple
            showUploadList={false}
          >
            <div className="admin-issue-images-add">
              <PlusOutlined />
              <span>Add image</span>
            </div>
          </Upload>
        ) : null}
      </div>
      <p className="admin-issue-images-hint">
        Up to {MAX_ITEMS} additional images ({totalCount}/{MAX_ITEMS} used). PNG, JPG, WebP, GIF, or AVIF, max 8 MB each. Drag a tile to reorder.
      </p>
    </div>
  );
}
