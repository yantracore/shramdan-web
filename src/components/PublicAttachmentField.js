"use client";

import { DeleteOutlined, InboxOutlined, LoadingOutlined } from "@ant-design/icons";
import { Upload } from "antd";
import { useRef, useState } from "react";
import { uploadPublicAttachment } from "@/lib/uploads";
import { useToast } from "@/lib/toast";

const { Dragger } = Upload;

export const PUBLIC_ATTACHMENT_ACCEPT = ".pdf,image/jpeg,image/png,image/webp,image/gif";
export const PUBLIC_ATTACHMENT_MIME_ALLOWLIST = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif"
]);
export const PUBLIC_ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;

export function PublicAttachmentField({
  value,
  onChange,
  disabled,
  copy,
  accept = PUBLIC_ATTACHMENT_ACCEPT
}) {
  const toast = useToast();
  const uploadingRef = useRef(false);
  const [uploading, setUploading] = useState(false);

  const commit = (next) => {
    onChange?.(next ?? null);
  };

  const handleBeforeUpload = async (file) => {
    if (uploadingRef.current) {
      toast.error(copy.errors.busy);
      return Upload.LIST_IGNORE;
    }

    if (!PUBLIC_ATTACHMENT_MIME_ALLOWLIST.has(file.type)) {
      toast.error(copy.errors.mime);
      return Upload.LIST_IGNORE;
    }

    if (file.size > PUBLIC_ATTACHMENT_MAX_BYTES) {
      toast.error(copy.errors.size);
      return Upload.LIST_IGNORE;
    }

    uploadingRef.current = true;
    setUploading(true);

    try {
      const result = await uploadPublicAttachment(file);
      commit({ id: result.id, url: result.url, name: file.name, mimeType: file.type, size: file.size });
    } catch (error) {
      toast.error(error?.message || copy.errors.generic);
    } finally {
      uploadingRef.current = false;
      setUploading(false);
    }

    return Upload.LIST_IGNORE;
  };

  const handleRemove = () => {
    if (disabled || uploading) return;
    commit(null);
  };

  if (value?.id) {
    return (
      <div className="public-attachment-field has-file">
        <div className="public-attachment-file">
          <a href={value.url} target="_blank" rel="noopener noreferrer" className="public-attachment-name">
            {value.name || copy.attachedFallback}
          </a>
          <button
            type="button"
            className="public-attachment-remove"
            onClick={handleRemove}
            disabled={disabled || uploading}
            aria-label={copy.removeAria}
          >
            <DeleteOutlined />
            <span>{copy.removeCta}</span>
          </button>
        </div>
        <p className="public-attachment-hint">{copy.replaceHint}</p>
      </div>
    );
  }

  return (
    <div className="public-attachment-field">
      <Dragger
        accept={accept}
        beforeUpload={handleBeforeUpload}
        disabled={disabled || uploading}
        multiple={false}
        showUploadList={false}
      >
        <p className="ant-upload-drag-icon">{uploading ? <LoadingOutlined /> : <InboxOutlined />}</p>
        <p className="ant-upload-text">{uploading ? copy.uploadingText : copy.dragText}</p>
        <p className="ant-upload-hint">{copy.hint}</p>
      </Dragger>
    </div>
  );
}
