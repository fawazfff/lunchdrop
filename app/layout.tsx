import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LunchDrop — Send lunch with one link",
  description: "Choose a live Blackbird restaurant, add FLY, and send a secure lunch gift powered by Flynet.",
  openGraph: { title: "LunchDrop", description: "A little food. A lot of love. Powered by Blackbird and Flynet.", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

