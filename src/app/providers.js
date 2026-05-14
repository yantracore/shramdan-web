"use client";

import { ConfigProvider } from "antd";

const theme = {
  token: {
    colorPrimary: "#176b5c",
    colorInfo: "#176b5c",
    colorSuccess: "#2e7d32",
    colorWarning: "#b7791f",
    colorError: "#b42318",
    borderRadius: 8,
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
  },
  components: {
    Button: {
      controlHeight: 40,
      borderRadius: 8
    },
    Card: {
      borderRadiusLG: 8
    },
    Tag: {
      borderRadiusSM: 999
    }
  }
};

export function Providers({ children }) {
  return <ConfigProvider theme={theme}>{children}</ConfigProvider>;
}
