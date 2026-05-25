"use client";

import { App } from "antd";

export function useToast() {
  const { message } = App.useApp();
  return message;
}
