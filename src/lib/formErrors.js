const DEFAULT_SCROLL_OPTIONS = {
  behavior: "smooth",
  block: "center",
  inline: "nearest"
};

// Request-location segments the backend prepends to every validation path
// ("body.title", "query.limit", "params.id"). Stripped before mapping to a
// form field, which only knows about the body fields.
const LOCATION_PREFIXES = ["body", "query", "params", "headers", "cookies"];

export function setFieldErrorsAndScroll(form, fields, options = DEFAULT_SCROLL_OPTIONS) {
  if (!form || !Array.isArray(fields) || fields.length === 0) return;

  form.setFields(fields);

  const firstWithError = fields.find(
    (field) => Array.isArray(field?.errors) && field.errors.length > 0
  );

  if (firstWithError?.name != null) {
    form.scrollToField(firstWithError.name, options);
  }
}

// Split a backend validation path ("body.uploadIds.0") into its field segments
// ("uploadIds", "0"), dropping the leading request-location prefix.
function splitFieldPath(rawPath) {
  if (!rawPath) return [];
  const parts = rawPath.split(".").filter((part) => part !== "");
  if (parts.length > 0 && LOCATION_PREFIXES.includes(parts[0])) {
    parts.shift();
  }
  return parts;
}

// Pull the standard validation list out of an ApiError. The backend envelope
// is { success: false, message, errors: ["<path>: <message>", ...] } — see
// docs/api-requirements. Each entry is "<location>.<field path>: <message>";
// the message itself can contain ": " (e.g. "Too small: expected ..."), so we
// split on the FIRST ": " only. Returns [{ path: string[], message }]; an empty
// array when the error is not in that shape (e.g. a plain 404 / network error).
export function extractApiValidationEntries(error) {
  const raw = error?.data?.errors;
  if (!Array.isArray(raw)) return [];

  const entries = [];
  for (const item of raw) {
    if (typeof item === "string") {
      const sep = item.indexOf(": ");
      const rawPath = sep === -1 ? "" : item.slice(0, sep).trim();
      const message = (sep === -1 ? item : item.slice(sep + 2)).trim();
      entries.push({ path: splitFieldPath(rawPath), message });
    } else if (item && typeof item === "object") {
      // Tolerate a future structured shape { path | field, message }.
      const rawPath = item.path ?? item.field ?? "";
      const message = item.message ?? "";
      entries.push({
        path: Array.isArray(rawPath) ? rawPath.map(String) : splitFieldPath(String(rawPath)),
        message: String(message).trim()
      });
    }
  }
  return entries;
}

// Map parsed validation entries onto form fields.
//   fieldMap    — backend root key → form field name (string), an Ant name
//                 path (array), or null to force the message to the form level
//                 (no inline field — e.g. payload-only keys like `language`).
//   knownFields — optional whitelist of real form field names. A key that is
//                 not in the map and resolves outside this set is bucketed as a
//                 form-level error rather than set on a field that does not
//                 render (which would hide the message).
// Returns { fieldErrors: [{ name, errors }], formErrors: [string] }.
export function parseApiValidationErrors(error, { fieldMap = {}, knownFields = null } = {}) {
  const entries = extractApiValidationEntries(error);
  const byField = new Map();
  const formErrors = [];
  const known = knownFields ? new Set(knownFields) : null;

  for (const { path, message } of entries) {
    const rootKey = path[0];
    let target;

    if (!rootKey) {
      target = null; // a root "body: ..." error — no field to pin it to
    } else if (Object.prototype.hasOwnProperty.call(fieldMap, rootKey)) {
      target = fieldMap[rootKey]; // may be null (deliberately form-level)
    } else if (!known || known.has(rootKey)) {
      target = rootKey; // identity passthrough for an unmapped-but-real field
    } else {
      target = null; // unknown key — surface at the form level, not invisibly
    }

    if (target == null) {
      if (message) formErrors.push(message);
      continue;
    }

    const key = Array.isArray(target) ? target.join(".") : String(target);
    if (!byField.has(key)) byField.set(key, { name: target, errors: [] });
    if (message) byField.get(key).errors.push(message);
  }

  const fieldErrors = [...byField.values()].filter((field) => field.errors.length > 0);
  return { fieldErrors, formErrors };
}

// One-call bridge from an ApiError to inline display on a SINGLE-SCREEN form
// (every field is mounted). Use this in the form's submit catch so backend
// validation lands on the right field instead of a generic toast. For a
// multi-step form use the useStepFormErrors hook instead — rc-field-form drops
// the error of any unmounted field, so step-gated fields need the hook's
// re-inject-on-step-change handling.
//   form            — the antd form instance owning the fields.
//   error           — the caught ApiError.
//   fieldMap        — see parseApiValidationErrors.
//   knownFields     — see parseApiValidationErrors.
//   toast           — optional antd message api; form-level messages (and a
//                     non-validation fallback) are shown through it.
//   fallbackMessage — shown via toast when the error carries no field/form
//                     validation list at all (network/permission/etc.).
// Returns { handled, fieldErrors, formErrors } — handled=true when at least one
// field received an inline error.
export function applyApiErrorsToForm(form, error, options = {}) {
  const {
    fieldMap = {},
    knownFields = null,
    toast = null,
    fallbackMessage = "",
    scrollOptions = DEFAULT_SCROLL_OPTIONS
  } = options;

  const { fieldErrors, formErrors } = parseApiValidationErrors(error, { fieldMap, knownFields });

  if (form && fieldErrors.length > 0) {
    form.setFields(fieldErrors);
    try {
      form.scrollToField(fieldErrors[0].name, scrollOptions);
    } catch {
      /* field not mounted — error is still set inline */
    }
  }

  if (toast) {
    if (formErrors.length > 0) {
      // Surface root-level messages (unrecognized keys, cross-field rules) that
      // have no single field to attach to.
      toast.error(formErrors.join("\n"));
    } else if (fieldErrors.length === 0) {
      const message = error?.message || fallbackMessage;
      if (message) toast.error(message);
    }
  }

  return { handled: fieldErrors.length > 0, fieldErrors, formErrors };
}
