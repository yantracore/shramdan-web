const FALLBACK_API_BASE_URL = "https://z0n76c1j-3000.usw3.devtunnels.ms/api";

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || FALLBACK_API_BASE_URL
).replace(/\/+$/, "");

export function compactPayload(values) {
  return Object.fromEntries(
    Object.entries(values).flatMap(([key, value]) => {
      if (value === undefined || value === null) {
        return [];
      }

      const normalizedValue = typeof value === "string" ? value.trim() : value;

      if (normalizedValue === "") {
        return [];
      }

      return [[key, normalizedValue]];
    })
  );
}

function getApiErrorMessage(data, status) {
  return (
    data?.error?.message ||
    data?.message ||
    data?.error ||
    `Request failed with status ${status}.`
  );
}

export async function postJson(path, values) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(compactPayload(values))
  });

  const responseText = await response.text();
  let data = null;

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { message: responseText };
    }
  }

  if (!response.ok || data?.success === false) {
    throw new Error(getApiErrorMessage(data, response.status));
  }

  return data;
}
