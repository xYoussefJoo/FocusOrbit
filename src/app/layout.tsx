import type { Metadata } from "next";
import { JetBrains_Mono, Manrope, Sora } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

// Vesper type: Sora for display, Manrope for UI, JetBrains Mono for code.
// next/font self-hosts them and exposes CSS variables that globals.css maps to tokens.
const sora = Sora({ subsets: ["latin"], variable: "--font-sora", weight: ["300", "500", "600"] });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "Vesper — Evening focus, engineered",
  description: "A focus workspace for developers: code, notes and a session timer that remembers what you studied.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark", sora.variable, manrope.variable, jetbrains.variable)}>
      <body className="bg-canvas text-ink font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
