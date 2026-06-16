// /app/signup — consolidated into the canonical signup flow at /signup,
// which is wired to the real backend (POST /auth/register → verify-otp →
// session). Keeping a single signup implementation avoids two divergent
// flows drifting apart.

import { redirect } from "next/navigation";

export default function AppSignupPage() {
  redirect("/signup");
}
