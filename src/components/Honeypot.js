"use client";

import { Form, Input } from "antd";

export const HONEYPOT_FIELD = "website";

const HIDE_STYLE = {
  position: "absolute",
  left: "-10000px",
  top: "auto",
  width: "1px",
  height: "1px",
  overflow: "hidden",
  opacity: 0,
  pointerEvents: "none",
};

export function Honeypot() {
  return (
    <Form.Item
      name={HONEYPOT_FIELD}
      label={null}
      style={HIDE_STYLE}
      aria-hidden="true"
    >
      <Input tabIndex={-1} autoComplete="off" placeholder="" />
    </Form.Item>
  );
}

export function isHoneypotTriggered(values) {
  return Boolean(values?.[HONEYPOT_FIELD]);
}
