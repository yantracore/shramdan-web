function stripUndefined(value) {
  if (Array.isArray(value)) {
    return value
      .map(stripUndefined)
      .filter((entry) => entry !== undefined && entry !== null);
  }
  if (value && typeof value === "object") {
    const next = {};
    for (const [key, raw] of Object.entries(value)) {
      const cleaned = stripUndefined(raw);
      if (cleaned !== undefined && cleaned !== null) next[key] = cleaned;
    }
    return next;
  }
  return value;
}

export function JsonLd({ data }) {
  const payload = Array.isArray(data) ? data : [data];
  const serialized = JSON.stringify(stripUndefined(payload).map((entry) => entry))
    .replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serialized }}
    />
  );
}
