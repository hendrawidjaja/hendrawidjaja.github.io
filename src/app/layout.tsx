import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import type { PropsWithChildren } from "react";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const TITLE = "Hendra's CV & Portfolio";
const DESCRIPTION =
  "Hendra's career CV showcase with experiences, education, skills, and projects, and pixel-perfect PDF export.";

const basePath = process.env.STATIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: {
    default: TITLE,
    template: `%s | ${TITLE}`,
  },
  description: DESCRIPTION,
  icons: {
    icon: `${basePath}/logo.svg`,
    shortcut: `${basePath}/logo.svg`,
    apple: `${basePath}/logo.svg`,
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
        <Script
          data-website-id="872f19d5-d4b6-4d3e-81aa-b1114f34e2ff"
          defer
          src="https://cloud.umami.is/script.js"
        />
      </body>
    </html>
  );
}