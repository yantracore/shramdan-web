"use client";

import { DeleteOutlined, InboxOutlined, LoadingOutlined } from "@ant-design/icons";
import { Button, Upload } from "antd";
import Image from "next/image";
import { useState } from "react";
import { uploadImage } from "@/lib/uploads";
import { useToast } from "@/lib/toast";

const { Dragger } = Upload;

const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif", "image/avif"];

export function IssueCoverUpload({ value, onChange, disabled }) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);

  const handleBeforeUpload = async (file) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Only PNG, JPG, WebP, GIF, or AVIF images are supported.");
      return Upload.LIST_IGNORE;
    }

    if (file.size > MAX_BYTES) {
      toast.error("Cover image must be smaller than 8 MB.");
      return Upload.LIST_IGNORE;
    }

    setUploading(true);
    try {
      const result = await uploadImage(file);
      onChange?.({ id: result.id, url: result.url, isNew: true });
    } catch (error) {
      toast.error(error?.message || "Could not upload cover image.");
    } finally {
      setUploading(false);
    }

    return Upload.LIST_IGNORE;
  };

  const handleRemove = () => onChange?.(null);

  if (value?.url) {
    return (
      <div className="admin-cover-preview">
        <div className="admin-cover-preview-frame">
          <Image
            alt="Cover preview"
            height={240}
            sizes="(max-width: 720px) 100vw, 480px"
            src={value.url}
            unoptimized
            width={480}
          />
        </div>
        <div className="admin-cover-preview-actions">
          <Upload
            accept={ACCEPTED_TYPES.join(",")}
            beforeUpload={handleBeforeUpload}
            disabled={disabled || uploading}
            multiple={false}
            showUploadList={false}
          >
            <Button disabled={disabled || uploading} loading={uploading}>
              Replace image
            </Button>
          </Upload>
          <Button
            danger
            disabled={disabled || uploading}
            icon={<DeleteOutlined />}
            onClick={handleRemove}
          >
            Remove
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Dragger
      accept={ACCEPTED_TYPES.join(",")}
      beforeUpload={handleBeforeUpload}
      className="admin-cover-dragger"
      disabled={disabled || uploading}
      multiple={false}
      showUploadList={false}
    >
      <p className="ant-upload-drag-icon">
        {uploading ? <LoadingOutlined /> : <InboxOutlined />}
      </p>
      <p className="ant-upload-text">
        {uploading ? "Uploading..." : "Click or drag an image here to set the cover"}
      </p>
      <p className="ant-upload-hint">PNG, JPG, WebP, GIF, or AVIF. Up to 8 MB.</p>
    </Dragger>
  );
}
