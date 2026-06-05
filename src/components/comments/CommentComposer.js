"use client";

import { CloseOutlined, SendOutlined } from "@ant-design/icons";
import { Button, Input, Mentions } from "antd";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { COMMENT_LIMITS } from "@/lib/comments";
import { buildLoginHref } from "@/lib/loginRedirect";

const COPY = {
  np: {
    placeholderTop: "तपाईंको विचार राख्नुहोस्…",
    placeholderReply: "जवाफ लेख्नुहोस्…",
    placeholderEdit: "टिप्पणी सम्पादन गर्नुहोस्…",
    submitTop: "पठाउनुहोस्",
    submitReply: "जवाफ पठाउनुहोस्",
    submitEdit: "बचत गर्नुहोस्",
    cancel: "रद्द",
    loginNeededTitle: "टिप्पणी लेख्न लग-इन आवश्यक",
    loginNeededBody: "तपाईंको आवाज दर्जको लागि लग-इन गर्नुहोस् — फेरि यहीं फर्किनुहुनेछ।",
    loginAction: "लग-इन गर्नुहोस्",
    tooLong: "टिप्पणी अति लामो छ।"
  },
  en: {
    placeholderTop: "Add your thought…",
    placeholderReply: "Write a reply…",
    placeholderEdit: "Edit your comment…",
    submitTop: "Post",
    submitReply: "Post Reply",
    submitEdit: "Save",
    cancel: "Cancel",
    loginNeededTitle: "Log In to Comment",
    loginNeededBody: "Sign in to add your voice — we'll bring you right back here.",
    loginAction: "Log In",
    tooLong: "Comment is too long."
  }
};

export function CommentComposer({
  mode = "top",
  initialText = "",
  language = "np",
  isAuthenticated = false,
  loginRedirect = "/",
  onSubmit,
  onCancel,
  autoFocus = false,
  submittingState = false,
  mentionPool = []
}) {
  const t = COPY[language] || COPY.np;
  // The composer is remounted by its parent whenever its mode changes
  // (`isEditing` / `isReplying` toggle in CommentNode → composer mounted
  // fresh), so initialText only needs to seed the first render. No effect
  // sync required.
  const [text, setText] = useState(initialText);
  const textareaRef = useRef(null);
  // Mentions component swap-in only when we have a real pool — keeps
  // edit / no-pool flows on the simpler TextArea, fewer moving parts.
  const useMentions = mentionPool.length > 0 && mode !== "edit";
  const mentionOptions = useMemo(
    () =>
      mentionPool.map((m) => ({
        value: m.name,
        label: m.role ? `${m.name} · ${m.role}` : m.name
      })),
    [mentionPool]
  );

  useEffect(() => {
    if (!autoFocus) return;
    const ref = textareaRef.current;
    // The native textarea node sits at different paths on Input.TextArea
    // vs Mentions. Probe both.
    const el =
      ref?.resizableTextArea?.textArea || // Input.TextArea
      ref?.nativeElement?.querySelector?.("textarea") || // Mentions
      ref?.focus
        ? ref
        : null;
    if (el?.focus) el.focus();
    if (el?.setSelectionRange) {
      const v = (el.value ?? "").length;
      el.setSelectionRange(v, v);
    }
  }, [autoFocus]);

  if (mode === "top" && !isAuthenticated) {
    return (
      <div className="comment-login-wall" role="status">
        <div className="comment-login-wall-body">
          <strong>{t.loginNeededTitle}</strong>
          <p>{t.loginNeededBody}</p>
        </div>
        <Link href={buildLoginHref(loginRedirect, "comment")}>
          <Button type="primary">{t.loginAction}</Button>
        </Link>
      </div>
    );
  }

  const placeholder =
    mode === "edit"
      ? t.placeholderEdit
      : mode === "reply"
        ? t.placeholderReply
        : t.placeholderTop;
  const submitLabel =
    mode === "edit" ? t.submitEdit : mode === "reply" ? t.submitReply : t.submitTop;

  const trimmed = text.trim();
  const tooLong = trimmed.length > COMMENT_LIMITS.MAX_TEXT_LENGTH;
  const canSubmit = trimmed.length > 0 && !tooLong && !submittingState;

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    if (!canSubmit) return;
    onSubmit?.(trimmed);
    if (mode === "top") setText("");
  };

  return (
    <form
      className={`comment-composer comment-composer-${mode}`}
      onSubmit={handleSubmit}
    >
      {useMentions ? (
        <Mentions
          ref={textareaRef}
          value={text}
          onChange={setText}
          placeholder={placeholder}
          autoSize={{ minRows: 2, maxRows: 6 }}
          options={mentionOptions}
          prefix="@"
          // Match anywhere inside the name — handles Devanagari mid-word
          // queries the right way too.
          filterOption={(input, option) =>
            String(option?.value ?? "")
              .toLowerCase()
              .includes(String(input ?? "").toLowerCase())
          }
        />
      ) : (
        <Input.TextArea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          autoSize={{ minRows: 2, maxRows: 6 }}
          maxLength={COMMENT_LIMITS.MAX_TEXT_LENGTH}
          showCount={mode !== "top"}
        />
      )}
      <div className="comment-composer-foot">
        {tooLong ? (
          <span className="comment-composer-error">{t.tooLong}</span>
        ) : (
          <span className="comment-composer-spacer" />
        )}
        <div className="comment-composer-actions">
          {mode !== "top" && onCancel ? (
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={onCancel}
              disabled={submittingState}
            >
              {t.cancel}
            </Button>
          ) : null}
          <Button
            type="primary"
            htmlType="submit"
            icon={<SendOutlined />}
            disabled={!canSubmit}
            loading={submittingState}
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
