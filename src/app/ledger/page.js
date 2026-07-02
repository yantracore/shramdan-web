"use client";

// /ledger — public transparency ledger (roadmap Phase 6.1 + 6.2 + 6.4).
// Totals hero strip + donations list + expenses list. Pulls from
// dummy donations / expenses generated against past events; once
// backend ledger ships, swap useMemo for fetched response.

import {
  ArrowRightOutlined,
  BankOutlined,
  FileTextOutlined,
  GiftOutlined,
  WalletOutlined
} from "@ant-design/icons";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { getDemoLedger } from "@/lib/devMockData";
import { listPastEvents } from "@/lib/eventsApi";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

function formatNPR(amount, language) {
  if (amount == null) return "—";
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "NPR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
  return localizeDigits(formatted, language);
}

function formatDate(iso, language) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const locale = language === "np" ? "ne-NP" : "en-US";
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric"
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

const COPY = {
  np: {
    pageTitle: "पारदर्शिता ल्याज",
    eyebrow: "हरेक रुपैयाँ देखिने",
    title: "श्रमदान पारदर्शिता ल्याज",
    intro:
      "हरेक दान, हरेक खर्च — सबै सार्वजनिक। दान अनाम राख्ने छनोट दाताकै हातमा हुन्छ; तर रकम र खर्च सबैले देख्न पाउनुपर्छ।",
    stats: {
      donated: "कुल दान (NPR)",
      spent: "कुल खर्च (NPR)",
      surplus: "बचत / अग्रिम (NPR)",
      inKind: "सामग्री / श्रम दान"
    },
    tabsDonations: "दान",
    tabsExpenses: "खर्च",
    donationsHeading: "दानहरू",
    expensesHeading: "खर्चहरू",
    cols: {
      date: "मिति",
      donor: "दाता",
      kind: "प्रकार",
      channel: "माध्यम",
      amount: "रकम",
      event: "अभियान",
      description: "विवरण",
      paidTo: "भुक्तानी"
    },
    anonymousDonor: "अनाम दाता",
    inKindLabel: "सामग्री",
    receiptLink: "रसिद",
    noReceipt: "—",
    eventLink: "हेर्ने",
    emptyLedger: "अहिले कुनै दर्ता छैन।",
    notesIntroNp: "सार्वजनिक खाताबही",
    notesBody:
      "यो डेमो डेटाले वास्तविक अभियानको सम्भावित प्रवाह देखाउँछ — रकम र दाता उदाहरणका लागि मात्र। साँचो खाताबही ब्याकएन्ड ल्याज लाइभ हुनेबित्तिकै यहीं प्रदर्शित हुनेछ।",
    channels: {
      ESEWA: "eSewa",
      KHALTI: "Khalti",
      BANK: "बैंक",
      IN_KIND: "सामग्री",
      FOREIGN: "विदेशबाट",
      OTHER: "अन्य"
    },
    kinds: {
      FUNDS: "रकम",
      MATERIALS: "सामग्री",
      LABOR_PLEDGE: "श्रम प्रतिज्ञा",
      LOGISTICS: "लजिस्टिक्स",
      OTHER: "अन्य"
    },
    expenseKinds: {
      TOOLS: "औजार",
      MATERIALS: "सामग्री",
      TRANSPORT: "ढुवानी",
      REFRESHMENTS: "जलपान",
      PERMITS: "अनुमति",
      MEDICAL: "मेडिकल",
      OTHER: "अन्य"
    }
  },
  en: {
    pageTitle: "Transparency Ledger",
    eyebrow: "Every rupee visible",
    title: "Shramdan transparency ledger",
    intro:
      "Every donation, every expense — fully public. Donors may stay anonymous; the amounts and the spending must not be.",
    stats: {
      donated: "Total donated (NPR)",
      spent: "Total spent (NPR)",
      surplus: "Surplus / runway (NPR)",
      inKind: "In-kind contributions"
    },
    tabsDonations: "Donations",
    tabsExpenses: "Expenses",
    donationsHeading: "Donations",
    expensesHeading: "Expenses",
    cols: {
      date: "Date",
      donor: "Donor",
      kind: "Kind",
      channel: "Channel",
      amount: "Amount",
      event: "Campaign",
      description: "Description",
      paidTo: "Paid to"
    },
    anonymousDonor: "Anonymous donor",
    inKindLabel: "In-kind",
    receiptLink: "Receipt",
    noReceipt: "—",
    eventLink: "View",
    emptyLedger: "No records yet.",
    notesIntroNp: "Public ledger",
    notesBody:
      "Demo data approximating a real campaign's cash and in-kind flow. Real ledger entries surface here once the backend ledger goes live.",
    channels: {
      ESEWA: "eSewa",
      KHALTI: "Khalti",
      BANK: "Bank",
      IN_KIND: "In-kind",
      FOREIGN: "Foreign",
      OTHER: "Other"
    },
    kinds: {
      FUNDS: "Funds",
      MATERIALS: "Materials",
      LABOR_PLEDGE: "Labour pledge",
      LOGISTICS: "Logistics",
      OTHER: "Other"
    },
    expenseKinds: {
      TOOLS: "Tools",
      MATERIALS: "Materials",
      TRANSPORT: "Transport",
      REFRESHMENTS: "Refreshments",
      PERMITS: "Permits",
      MEDICAL: "Medical",
      OTHER: "Other"
    }
  }
};

export default function LedgerPage() {
  const { language } = usePreferences();
  const t = COPY[language] || COPY.np;
  const [tab, setTab] = useState("donations");

  const { donations, expenses } = useMemo(() => getDemoLedger(), []);
  const [pastEvents, setPastEvents] = useState([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items = await listPastEvents({ language });
        if (!cancelled) setPastEvents(items);
      } catch {
        if (!cancelled) setPastEvents([]);
      }
    })();
    return () => { cancelled = true; };
  }, [language]);

  const totals = useMemo(() => {
    const donated = donations
      .filter((d) => d.kind === "FUNDS")
      .reduce((sum, d) => sum + (d.amount || 0), 0);
    const spent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const inKind = donations.filter((d) => d.kind !== "FUNDS").length;
    return { donated, spent, surplus: donated - spent, inKind };
  }, [donations, expenses]);

  const eventLookup = useMemo(() => {
    const map = new Map();
    pastEvents.forEach((event) => map.set(event.id, event));
    return map;
  }, [pastEvents]);

  const sortedDonations = useMemo(
    () =>
      donations
        .slice()
        .sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt)),
    [donations]
  );
  const sortedExpenses = useMemo(
    () => expenses.slice().sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt)),
    [expenses]
  );

  const statTiles = [
    { key: "donated", icon: WalletOutlined, value: formatNPR(totals.donated, language) },
    { key: "spent", icon: BankOutlined, value: formatNPR(totals.spent, language) },
    { key: "surplus", icon: GiftOutlined, value: formatNPR(totals.surplus, language) },
    { key: "inKind", icon: FileTextOutlined, value: localizeDigits(totals.inKind, language) }
  ];

  return (
    <SiteShell pageTitle={t.pageTitle}>
      <section className="ledger-page page-section">
        <header className="ledger-hero">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
        </header>

        <div className="ledger-stats">
          {statTiles.map(({ key, icon: Icon, value }) => (
            <article key={key} className={`ledger-stat ledger-stat-${key}`}>
              <span className="ledger-stat-icon" aria-hidden="true">
                <Icon />
              </span>
              <strong className="ledger-stat-value">{value}</strong>
              <span className="ledger-stat-label">{t.stats[key]}</span>
            </article>
          ))}
        </div>

        <div className="ledger-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "donations"}
            className={`ledger-tab ${tab === "donations" ? "is-active" : ""}`}
            onClick={() => setTab("donations")}
          >
            {t.tabsDonations} ({localizeDigits(donations.length, language)})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "expenses"}
            className={`ledger-tab ${tab === "expenses" ? "is-active" : ""}`}
            onClick={() => setTab("expenses")}
          >
            {t.tabsExpenses} ({localizeDigits(expenses.length, language)})
          </button>
        </div>

        {tab === "donations" ? (
          <section className="ledger-block" aria-label={t.donationsHeading}>
            {sortedDonations.length === 0 ? (
              <p className="ledger-empty">{t.emptyLedger}</p>
            ) : (
              <div className="ledger-table-wrap">
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th>{t.cols.date}</th>
                      <th>{t.cols.donor}</th>
                      <th>{t.cols.kind}</th>
                      <th>{t.cols.channel}</th>
                      <th>{t.cols.amount}</th>
                      <th>{t.cols.event}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedDonations.map((donation) => {
                      const event = eventLookup.get(donation.eventId);
                      return (
                        <tr key={donation.id}>
                          <td>{formatDate(donation.receivedAt, language)}</td>
                          <td>
                            {donation.donorName ? (
                              donation.donorName
                            ) : (
                              <em>{t.anonymousDonor}</em>
                            )}
                          </td>
                          <td>{t.kinds[donation.kind] || donation.kind}</td>
                          <td>{t.channels[donation.channel] || donation.channel}</td>
                          <td>
                            {donation.kind === "FUNDS"
                              ? formatNPR(donation.amount, language)
                              : t.inKindLabel}
                          </td>
                          <td>
                            {event ? (
                              <Link href={`/events/${event.slug ?? event.id}`}>
                                {event.title} <ArrowRightOutlined aria-hidden="true" />
                              </Link>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : (
          <section className="ledger-block" aria-label={t.expensesHeading}>
            {sortedExpenses.length === 0 ? (
              <p className="ledger-empty">{t.emptyLedger}</p>
            ) : (
              <div className="ledger-table-wrap">
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th>{t.cols.date}</th>
                      <th>{t.cols.kind}</th>
                      <th>{t.cols.description}</th>
                      <th>{t.cols.paidTo}</th>
                      <th>{t.cols.amount}</th>
                      <th>{t.cols.event}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedExpenses.map((expense) => {
                      const event = eventLookup.get(expense.eventId);
                      return (
                        <tr key={expense.id}>
                          <td>{formatDate(expense.paidAt, language)}</td>
                          <td>{t.expenseKinds[expense.kind] || expense.kind}</td>
                          <td>{expense.description}</td>
                          <td>{expense.paidToName || "—"}</td>
                          <td>{formatNPR(expense.amount, language)}</td>
                          <td>
                            {event ? (
                              <Link href={`/events/${event.slug ?? event.id}`}>
                                {event.title} <ArrowRightOutlined aria-hidden="true" />
                              </Link>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        <aside className="ledger-note" role="complementary">
          <strong>{t.notesIntroNp}.</strong>
          <p>{t.notesBody}</p>
        </aside>
      </section>
    </SiteShell>
  );
}
