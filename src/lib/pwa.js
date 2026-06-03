"use client";

// PWA push helpers — roadmap 8.3.
// Wraps the ServiceWorkerRegistration + PushManager surface so UI
// components don't have to reinvent the lifecycle each time.

const SW_PATH = "/sw.js";

export function isPushSupported() {
  if (typeof window === "undefined") return false;
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function getPermissionState() {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission; // "default" | "granted" | "denied"
}

export async function registerServiceWorker() {
  if (!isPushSupported()) return null;
  try {
    const existing = await navigator.serviceWorker.getRegistration(SW_PATH);
    if (existing) return existing;
    return await navigator.serviceWorker.register(SW_PATH, { scope: "/" });
  } catch (error) {
    // Swallow — UI surfaces failure as "could not register"
    return null;
  }
}

export async function getCurrentSubscription() {
  if (!isPushSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.getRegistration(SW_PATH);
    if (!registration) return null;
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

export async function requestPermissionAndSubscribe({ vapidPublicKey } = {}) {
  if (!isPushSupported()) {
    return { ok: false, reason: "unsupported" };
  }
  const registration = await registerServiceWorker();
  if (!registration) {
    return { ok: false, reason: "sw-register-failed" };
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, reason: "permission-denied", permission };
  }
  try {
    const existing = await registration.pushManager.getSubscription();
    if (existing) return { ok: true, subscription: existing, alreadySubscribed: true };
    if (!vapidPublicKey) {
      // Demo mode: backend hasn't shipped VAPID public key yet.
      // We treat permission grant as a partial success — the
      // browser will surface notifications via showLocalTest()
      // and notification settings are now opt-in.
      return { ok: true, subscription: null, demoOnly: true };
    }
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });
    return { ok: true, subscription, alreadySubscribed: false };
  } catch (error) {
    return { ok: false, reason: "subscribe-failed", error: error?.message };
  }
}

export async function unsubscribe() {
  const subscription = await getCurrentSubscription();
  if (!subscription) return { ok: true, alreadyOff: true };
  try {
    await subscription.unsubscribe();
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function showLocalTestNotification({ title, body }) {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission !== "granted") return false;
  try {
    const registration = await navigator.serviceWorker.getRegistration(SW_PATH);
    if (registration) {
      registration.showNotification(title, { body, icon: "/branding/favicon/favicon-32x32.png" });
    } else {
      new Notification(title, { body });
    }
    return true;
  } catch {
    return false;
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
