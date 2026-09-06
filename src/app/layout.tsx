import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "SaidZen WiFi - Mfumo wa Vocha za MikroTik",
  description:
    "Simamia biashara yako ya WiFi Hotspot kwa urahisi. Zalisha vocha, dhibiti malipo, na ongea na router zako za MikroTik moja kwa moja.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sw">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
