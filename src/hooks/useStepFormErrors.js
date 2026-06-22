"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { parseApiValidationErrors } from "@/lib/formErrors";

const SCROLL_OPTIONS = {
  behavior: "smooth",
  block: "center",
  inline: "nearest"
};

// Backend validation errors for a MULTI-STEP antd form.
//
// rc-field-form keeps a field's error on the mounted Field instance, not in a
// central store, so calling form.setFields on a field whose step isn't rendered
// is a no-op — and navigating to that step later mounts the field fresh, with no
// error. That's why a step-gated error "disappears" when you walk back to it.
//
// This hook holds the parsed errors in React state and re-injects each step's
// errors whenever that step becomes visible. Result:
//   • the form jumps straight to the earliest step carrying an error,
//   • the page scrolls to that first error,
//   • and the error is preserved on its field — walk to any errored step and
//     it's still there, until the user edits that field.
//
//   form         — antd form instance
//   stepIndex    — current step index (controlled by the caller)
//   setStepIndex — setter used to jump to the offending step
//   fieldStep    — { [fieldName]: stepIndex } map of which step renders a field
export function useStepFormErrors({ form, stepIndex, setStepIndex, fieldStep }) {
  // { [fieldName]: string[] } of errors still outstanding, or null when clear.
  const [pending, setPending] = useState(null);
  // Field to scroll to once its step is mounted (the first/earliest error).
  const scrollTargetRef = useRef(null);

  // Whenever the visible step (or the pending set) changes, re-apply the errors
  // for fields that live on the now-current step, then scroll to the target.
  useEffect(() => {
    if (!pending) return undefined;

    const here = Object.keys(pending).filter((name) => fieldStep[name] === stepIndex);
    if (here.length === 0) return undefined;

    let raf2 = 0;
    // Two frames: one to let React commit the step swap, one to let the new
    // step's layout settle before setting errors + scrolling into view.
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        form.setFields(here.map((name) => ({ name, errors: pending[name] })));
        // Scroll only on the initial auto-jump (scrollTargetRef set), not on
        // every re-apply (manual step nav, or a sibling error being cleared) —
        // re-injecting the error is enough to keep it visible there.
        if (scrollTargetRef.current) {
          const target = here.includes(scrollTargetRef.current)
            ? scrollTargetRef.current
            : here[0];
          try {
            form.scrollToField(target, SCROLL_OPTIONS);
          } catch {
            /* field momentarily unmounted — error is still set inline */
          }
          scrollTargetRef.current = null;
        }
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [pending, stepIndex, form, fieldStep]);

  // Call from the submit catch. Jumps to the earliest errored step, stores the
  // errors for re-injection, and routes form-level/non-validation messages to
  // the toast. Returns { handled, fieldErrors, formErrors }.
  const applyApiErrors = useCallback(
    (error, { fieldMap = {}, knownFields = null, toast = null, fallbackMessage = "" } = {}) => {
      const { fieldErrors, formErrors } = parseApiValidationErrors(error, {
        fieldMap,
        knownFields
      });

      if (fieldErrors.length > 0) {
        const map = {};
        for (const fieldError of fieldErrors) {
          const name = Array.isArray(fieldError.name)
            ? fieldError.name.join(".")
            : fieldError.name;
          map[name] = fieldError.errors;
        }

        // Jump to the EARLIEST step carrying an error, so fixes read top-down.
        const names = Object.keys(map);
        let firstName = names[0];
        let firstStep = fieldStep[firstName] ?? 0;
        for (const name of names) {
          const step = fieldStep[name];
          if (step != null && step < firstStep) {
            firstStep = step;
            firstName = name;
          }
        }

        scrollTargetRef.current = firstName;
        setPending(map);
        setStepIndex(firstStep);
      }

      if (toast) {
        if (formErrors.length > 0) {
          toast.error(formErrors.join("\n"));
        } else if (fieldErrors.length === 0) {
          const message = error?.message || fallbackMessage;
          if (message) toast.error(message);
        }
      }

      return { handled: fieldErrors.length > 0, fieldErrors, formErrors };
    },
    [fieldStep, setStepIndex]
  );

  // Wire to the form's onValuesChange: once the user edits a field, drop its
  // stored error so navigating back doesn't re-surface a now-fixed message.
  const clearFieldErrors = useCallback((changedValues) => {
    if (!changedValues) return;
    const names = Object.keys(changedValues);
    if (names.length === 0) return;
    setPending((prev) => {
      if (!prev) return prev;
      let touched = false;
      const next = { ...prev };
      for (const name of names) {
        if (name in next) {
          delete next[name];
          touched = true;
        }
      }
      if (!touched) return prev;
      return Object.keys(next).length ? next : null;
    });
  }, []);

  return { applyApiErrors, clearFieldErrors };
}
