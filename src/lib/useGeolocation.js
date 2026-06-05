"use client";

// Browser geolocation hook used by surfaces that personalise content by
// proximity (homepage for-you grid, /events nearest sort, future map
// overlays). Silent by default — call request() to trigger the prompt.
//
// Returns:
//   position: { lat, lng } | null
//   busy:     true while a request is in flight
//   error:    "unsupported" | "denied" | "timeout" | null
//   request:  (onGranted?) => void — triggers getCurrentPosition
//
// The hook intentionally does NOT call request() on mount. The reason:
// some browsers (Safari, Firefox with strict tracking protection) treat
// an unsolicited geolocation prompt as a privacy signal and may degrade
// the site's trust score. Pages decide their own moment to ask — e.g.
// the for-you grid asks once the user has scrolled past the carousel,
// signalling intent to browse.

import { useCallback, useState } from "react";

export function useGeolocation({
  enableHighAccuracy = false,
  timeout = 8000,
  maximumAge = 60_000
} = {}) {
  const [position, setPosition] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(
    (onGranted) => {
      if (typeof window === "undefined" || !navigator?.geolocation) {
        setError("unsupported");
        return;
      }
      setError(null);
      setBusy(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setBusy(false);
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setPosition(loc);
          onGranted?.(loc);
        },
        (geoError) => {
          setBusy(false);
          if (geoError?.code === geoError?.PERMISSION_DENIED) {
            setError("denied");
          } else if (geoError?.code === geoError?.TIMEOUT) {
            setError("timeout");
          } else {
            setError("unavailable");
          }
        },
        { enableHighAccuracy, timeout, maximumAge }
      );
    },
    [enableHighAccuracy, timeout, maximumAge]
  );

  return { position, busy, error, request };
}
