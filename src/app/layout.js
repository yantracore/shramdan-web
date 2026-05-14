import { Providers } from "./providers";
import { Baloo_2, Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap"
});

const baloo2 = Baloo_2({
  subsets: ["devanagari", "latin"],
  variable: "--font-baloo-2",
  display: "swap"
});

export const metadata = {
  title: "Shramdan",
  description: "Community action platform for local cleanup campaigns in Nepal."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} ${baloo2.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
