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
  title:
    "श्रमदान: हाम्रो श्रम, हाम्रो समाज, हाम्रो भविष्य। | Shramdan: Our labor, our society, our future.",
  description:
    "देशका हरेक समस्या सरकारको प्रतीक्षा गरेर समाधान हुँदैन। हामी नागरिकहरू आफैं मिलेर सरसफाइ, मर्मत, वृक्षारोपण, टोल सुधार जस्ता आधारभूत काम अघि बढाउन सक्छौँ। श्रमदान त्यही सामूहिक जिम्मेवारीको सुरुवात हो। साना साना हातहरू मिलेर ठूला परिवर्तन सम्भव हुन्छ। आज हाम्रो श्रमदान, भोलि सुन्दर समाजको निर्माण।"
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
