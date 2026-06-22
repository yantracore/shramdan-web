"use client";

// "?" anywhere on the site (when no input is focused) opens this
// dialog listing the keyboard shortcuts the app responds to. Esc
// closes. The dialog itself doesn't fire any of the listed shortcuts
// — it's a discoverability surface.

import { Modal } from "antd";
import { useEffect, useState } from "react";

const COPY = {
  np: {
    title: "की-बोर्ड सर्टकट",
    intro: "श्रमदानमा छिटो हिँड्न मद्दत गर्ने सर्टकटहरू।",
    groups: [
      {
        heading: "नेभिगेसन",
        items: [
          { keys: ["Ctrl/Cmd", "K"], label: "खोज खोल्ने" },
          { keys: ["?"], label: "यो डायलग देखाउने" },
          { keys: ["Esc"], label: "खुलेका डायलग बन्द गर्ने" }
        ]
      },
      {
        heading: "खोज भित्र",
        items: [
          { keys: ["↑", "↓"], label: "नतिजा सर्ने" },
          { keys: ["Enter"], label: "नतिजा खोल्ने" }
        ]
      },
      {
        heading: "पात्रोमा",
        items: [
          { keys: ["←", "→"], label: "मिति परिवर्तन" },
          { keys: ["Home", "End"], label: "महिनाको सुरु/अन्त" }
        ]
      },
      {
        heading: "अघि/पछि स्लाइडरमा",
        items: [
          { keys: ["←", "→"], label: "अघि र पछि तुलना" },
          { keys: ["Home", "End"], label: "एक तर्फ snap" }
        ]
      }
    ]
  },
  en: {
    title: "Keyboard shortcuts",
    intro: "Move around Shramdan faster with these shortcuts.",
    groups: [
      {
        heading: "Navigation",
        items: [
          { keys: ["Ctrl/Cmd", "K"], label: "Open search" },
          { keys: ["?"], label: "Show this dialog" },
          { keys: ["Esc"], label: "Close open dialogs" }
        ]
      },
      {
        heading: "Inside search",
        items: [
          { keys: ["↑", "↓"], label: "Move highlight" },
          { keys: ["Enter"], label: "Open the result" }
        ]
      },
      {
        heading: "Calendar",
        items: [
          { keys: ["←", "→"], label: "Change date" },
          { keys: ["Home", "End"], label: "Month edge" }
        ]
      },
      {
        heading: "Before/after slider",
        items: [
          { keys: ["←", "→"], label: "Scrub comparison" },
          { keys: ["Home", "End"], label: "Snap to edge" }
        ]
      }
    ]
  }
};

function isEditableTarget(target) {
  if (!target) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

export function KeyboardShortcutsDialog({ language = "np" }) {
  const t = COPY[language] || COPY.np;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (isEditableTarget(e.target)) return;
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      title={t.title}
      width={520}
      destroyOnHidden
      className="shortcuts-modal"
    >
      <p className="shortcuts-intro">{t.intro}</p>
      <div className="shortcuts-groups">
        {t.groups.map((g) => (
          <section key={g.heading} className="shortcuts-group">
            <h3>{g.heading}</h3>
            <ul>
              {g.items.map((it, i) => (
                <li key={i}>
                  <span className="shortcuts-keys">
                    {it.keys.map((k, ki) => (
                      <kbd key={ki}>{k}</kbd>
                    ))}
                  </span>
                  <span>{it.label}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Modal>
  );
}
