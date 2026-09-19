import type { Metadata } from "next";
import "./globals.css";
import { SiteEffects } from "./components/SiteEffects";

export const metadata: Metadata = {
  title: "LunchDrop — Send someone lunch",
  description: "Pick a real restaurant, add a note, and send lunch in one simple link.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
  },
  openGraph: {
    title: "LunchDrop",
    description: "Pick a real restaurant, add a note, and send someone lunch.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<SiteEffects /></body></html>;
}
