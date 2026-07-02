// Nepali-aware date formatting for campaign surfaces. toLocaleString("ne-NP")
// is unreliable across runtimes — it silently falls back to English month names
// and AM/PM in some Chrome/Node builds — so for NP we compose from explicit
// Devanagari month names + localized digits, matching the format the campaign
// cards and preview panes already render.

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
const NP_MONTHS = [
  "जनवरी",
  "फेब्रुअरी",
  "मार्च",
  "अप्रिल",
  "मे",
  "जुन",
  "जुलाई",
  "अगस्ट",
  "सेप्टेम्बर",
  "अक्टोबर",
  "नोभेम्बर",
  "डिसेम्बर"
];

function npDigits(value) {
  return String(value ?? "").replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

// Compact date + time for the modal header context line:
//   np → "जुलाई १२, ७:००"   ·   en → "July 12, 7:00 AM"
// Returns "" for a missing/invalid date.
export function formatCampaignDateTime(iso, language = "np") {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  if (language === "np") {
    const month = NP_MONTHS[date.getMonth()];
    const day = npDigits(date.getDate());
    const hour = npDigits(date.getHours());
    const minute = npDigits(String(date.getMinutes()).padStart(2, "0"));
    return `${month} ${day}, ${hour}:${minute}`;
  }
  return date.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}
