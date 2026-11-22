import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import type { PropsWithChildren } from "react";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const TITLE = "Hendra's CV & Portfolio";
const DESCRIPTION =
  "Hendra's Professional career CV showcase with experiences, education, skills, and projects, and pixel-perfect PDF export.";

export const metadata: Metadata = {
  title: {
    default: TITLE,
    template: `%s | ${TITLE}`,
  },
  description: DESCRIPTION,
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: {
      default: TITLE,
      template: `%s | ${TITLE}`,
    },
    description: DESCRIPTION,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: TITLE,
      template: `%s | ${TITLE}`,
    },
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html className={montserrat.variable} dir="ltr" lang="id" translate="no">
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}