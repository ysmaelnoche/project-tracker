import type { Metadata } from "next";
import { Azeret_Mono, IBM_Plex_Sans } from "next/font/google";
import { TimezoneSync } from "@/components/TimezoneSync";
import "./globals.css";

const azeretMono = Azeret_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-azeret-mono",
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-ibm-plex-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shipyard — Project Tracker",
  description: "Personal command console for projects, tasks, and GitHub activity.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${azeretMono.variable} ${ibmPlexSans.variable}`}>
      <body>
        <TimezoneSync />
        {children}
      </body>
    </html>
  );
}
