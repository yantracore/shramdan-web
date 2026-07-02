import { ApiError, postJson } from "@/lib/apiClient";

export async function uploadImage(file) {
  const presign = await postJson(
    "/uploads/presign",
    {
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      isPublic: true,
      fileType: "IMAGE"
    },
    { requireAuth: true }
  );

  const upload = presign?.data?.upload;
  const presignedUrl = presign?.data?.presignedUrl;

  if (!upload?.id || !presignedUrl) {
    throw new ApiError("Upload could not be initiated.", {
      errorCode: "UPLOAD_INIT_FAILED",
      status: 500,
      data: presign
    });
  }

  const putResponse = await fetch(presignedUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type }
  });

  if (!putResponse.ok) {
    throw new ApiError("File could not be uploaded to storage.", {
      errorCode: "UPLOAD_TRANSFER_FAILED",
      status: putResponse.status
    });
  }

  const confirmed = await postJson(`/uploads/${upload.id}/confirm`, {}, { requireAuth: true });
  const downloadUrl = confirmed?.data?.downloadUrl;

  if (!downloadUrl) {
    throw new ApiError("Upload confirmation did not return a URL.", {
      errorCode: "UPLOAD_CONFIRM_FAILED",
      status: 500,
      data: confirmed
    });
  }

  return { id: upload.id, url: downloadUrl };
}

export async function uploadAvatar(file) {
  const result = await uploadImage(file);
  return result.url;
}

export async function uploadPublicAttachment(file) {
  const presign = await postJson(
    "/uploads/public/presign",
    {
      filename: file.name,
      mimeType: file.type,
      size: file.size
    },
    { token: null }
  );

  const upload = presign?.data?.upload;
  const presignedUrl = presign?.data?.presignedUrl;

  if (!upload?.id || !presignedUrl) {
    throw new ApiError("Upload could not be initiated.", {
      errorCode: "UPLOAD_INIT_FAILED",
      status: 500,
      data: presign
    });
  }

  const putResponse = await fetch(presignedUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type }
  });

  if (!putResponse.ok) {
    throw new ApiError("File could not be uploaded to storage.", {
      errorCode: "UPLOAD_TRANSFER_FAILED",
      status: putResponse.status
    });
  }

  const confirmed = await postJson(`/uploads/public/${upload.id}/confirm`, {}, { token: null });
  const downloadUrl = confirmed?.data?.downloadUrl;

  if (!downloadUrl) {
    throw new ApiError("Upload confirmation did not return a URL.", {
      errorCode: "UPLOAD_CONFIRM_FAILED",
      status: 500,
      data: confirmed
    });
  }

  return { id: upload.id, url: downloadUrl };
}
