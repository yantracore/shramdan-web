import { Providers } from "./providers";
import "./globals.css";

export const metadata = {
  title: "Shramdaan",
  description: "Community action platform for local cleanup campaigns in Nepal."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
