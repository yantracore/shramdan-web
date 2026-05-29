const DEFAULT_SCROLL_OPTIONS = {
  behavior: "smooth",
  block: "center",
  inline: "nearest"
};

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
