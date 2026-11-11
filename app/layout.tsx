import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import type { PropsWithChildren } from "react";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
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
    <html className={dmSans.variable} lang="en" translate="no">
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}