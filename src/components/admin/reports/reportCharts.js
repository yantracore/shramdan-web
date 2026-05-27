"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "antd";

const chartLoading = () => (
  <Skeleton.Node active style={{ width: "100%", height: 220 }}>
    <span />
  </Skeleton.Node>
);

export const LineChart = dynamic(
  () => import("@ant-design/charts").then((mod) => mod.Line),
  { ssr: false, loading: chartLoading }
);

export const ColumnChart = dynamic(
  () => import("@ant-design/charts").then((mod) => mod.Column),
  { ssr: false, loading: chartLoading }
);

export const BarChart = dynamic(
  () => import("@ant-design/charts").then((mod) => mod.Bar),
  { ssr: false, loading: chartLoading }
);

export const PieChart = dynamic(
  () => import("@ant-design/charts").then((mod) => mod.Pie),
  { ssr: false, loading: chartLoading }
);

export const AreaChart = dynamic(
  () => import("@ant-design/charts").then((mod) => mod.Area),
  { ssr: false, loading: chartLoading }
);

export const FunnelChart = dynamic(
  () => import("@ant-design/charts").then((mod) => mod.Funnel),
  { ssr: false, loading: chartLoading }
);

export const RadialBarChart = dynamic(
  () => import("@ant-design/charts").then((mod) => mod.RadialBar),
  { ssr: false, loading: chartLoading }
);

export const GaugeChart = dynamic(
  () => import("@ant-design/charts").then((mod) => mod.Gauge),
  { ssr: false, loading: chartLoading }
);

export const RoseChart = dynamic(
  () => import("@ant-design/charts").then((mod) => mod.Rose),
  { ssr: false, loading: chartLoading }
);
