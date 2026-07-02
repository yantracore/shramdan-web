"use client";

import { ArrowLeftOutlined, ArrowRightOutlined, CheckOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useEffect, useRef } from "react";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

const COPY = {
  np: { stepFmt: "चरण {current} / {total}", back: "पछाडि", next: "अगाडि", submit: "पठाउने" },
  en: { stepFmt: "Step {current} of {total}", back: "Back", next: "Continue", submit: "Submit" }
};

export function MultiStepShell({
  steps,
  current,
  language = "np",
  onBack,
  onNext,
  onSubmit,
  nextDisabled = false,
  nextLoading = false,
  submitLabel,
  nextLabel,
  backLabel,
  hideBack = false,
  hideNext = false,
  isSubmitStep = false,
  children,
  cardClassName = ""
}) {
  const t = COPY[language] || COPY.np;
  const headingRef = useRef(null);
  const bodyRef = useRef(null);
  const total = steps.length;
  const currentStep = steps[current];
  const isLast = current === total - 1;

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    // After the step renders, pick the first interactive field in the card
    // body and focus it. If there isn't one (intro / done steps), fall back
    // to focusing the heading so screen readers still announce the step.
    const id = window.setTimeout(() => {
      const card = bodyRef.current;
      const target = card?.querySelector(
        'input:not([type="hidden"]):not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly]), [contenteditable="true"]'
      );
      if (target && typeof target.focus === "function") {
        target.focus({ preventScroll: false });
      } else {
        headingRef.current?.focus?.({ preventScroll: false });
      }
    }, 60);
    return () => window.clearTimeout(id);
  }, [current]);

  const stepLabel = t.stepFmt
    .replace("{current}", localizeDigits(current + 1, language))
    .replace("{total}", localizeDigits(total, language));

  const submitText = submitLabel ?? t.submit;
  const nextText = nextLabel ?? t.next;
  const backText = backLabel ?? t.back;

  return (
    <div className={`multi-step-shell ${cardClassName}`.trim()}>
      <ol className="multi-step-dots" aria-label={stepLabel}>
        {steps.map((s, i) => {
          const state =
            i < current ? "is-done" : i === current ? "is-current" : "is-future";
          return (
            <li key={s.key || i} className={`multi-step-dot ${state}`}>
              <span className="multi-step-dot-mark" aria-hidden="true">
                {i < current ? <CheckOutlined /> : localizeDigits(i + 1, language)}
              </span>
              <span className="multi-step-dot-label">{s.title}</span>
            </li>
          );
        })}
      </ol>

      <article className="multi-step-card">
        <header className="multi-step-card-heading">
          <span className="multi-step-stepline">{stepLabel}</span>
          <h1 ref={headingRef} tabIndex={-1}>
            {currentStep?.heading || currentStep?.title}
          </h1>
          {currentStep?.intro ? <p>{currentStep.intro}</p> : null}
        </header>

        <div className="multi-step-card-body" ref={bodyRef}>
          {children}
        </div>

        {(!hideBack || !hideNext) && (
          <footer className="multi-step-footer">
            {!hideBack && current > 0 ? (
              <Button
                size="large"
                icon={<ArrowLeftOutlined />}
                onClick={onBack}
                className="multi-step-back"
              >
                {backText}
              </Button>
            ) : (
              <span aria-hidden="true" />
            )}
            {!hideNext ? (
              isLast || isSubmitStep ? (
                <Button
                  type="primary"
                  size="large"
                  onClick={onSubmit}
                  loading={nextLoading}
                  disabled={nextDisabled}
                  className="multi-step-next"
                >
                  {submitText}
                </Button>
              ) : (
                <Button
                  type="primary"
                  size="large"
                  onClick={onNext}
                  loading={nextLoading}
                  disabled={nextDisabled}
                  className="multi-step-next"
                  iconPosition="end"
                  icon={<ArrowRightOutlined />}
                >
                  {nextText}
                </Button>
              )
            ) : null}
          </footer>
        )}
      </article>
    </div>
  );
}
