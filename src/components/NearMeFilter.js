"use client";

// "नजिकैको / Near me" toggle that asks the browser for geolocation
// once granted, exposes {lat, lng} via the onLocation callback and
// flips a chip in the topright of the /issues list filter row to
// indicate the radius. Parent page does the actual sort/filter.
//
// Geolocation is opt-in: the prompt only fires when the user clicks.

import { CompassOutlined, EnvironmentFilled, EnvironmentOutlined } from "@ant-design/icons";
import { useState } from "react";

const COPY = {
  np: {
    enable: "नजिकैको",
    enabling: "स्थान खोज्दै…",
    enabled: "नजिकैका पहिले",
    disable: "बन्द",
    error: "स्थान अनुमति अस्वीकृत",
    unsupported: "ब्राउजरले समर्थन गर्दैन"
  },
  en: {
    enable: "Near me",
    enabling: "Locating…",
    enabled: "Sorted by distance",
    disable: "Turn off",
    error: "Location denied",
    unsupported: "Not supported"
  }
};

export function NearMeFilter({ language = "np", location, onLocation }) {
  const t = COPY[language] || COPY.np;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const enable = () => {
    if (!navigator?.geolocation) {
      setError(t.unsupported);
      return;
    }
    setBusy(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false);
        onLocation?.({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      },
      () => {
        setBusy(false);
        setError(t.error);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 }
    );
  };

  const disable = () => {
    setError(null);
    onLocation?.(null);
  };

  const active = Boolean(location);

  return (
    <span className={`near-me-filter${active ? " is-active" : ""}`}>
      {active ? (
        <>
          <EnvironmentFilled aria-hidden="true" />
          <span>{t.enabled}</span>
          <button type="button" onClick={disable} aria-label={t.disable}>
            ×
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={enable}
          disabled={busy}
          aria-label={t.enable}
          className="near-me-filter-toggle"
        >
          {busy ? <CompassOutlined spin /> : <EnvironmentOutlined />}
          <span>{busy ? t.enabling : t.enable}</span>
        </button>
      )}
      {error ? <span className="near-me-filter-error">{error}</span> : null}
    </span>
  );
}
