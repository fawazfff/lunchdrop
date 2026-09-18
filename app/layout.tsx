import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LunchDrop — Send lunch with one link",
  description:
    "Pick a Blackbird restaurant, add FLY, and send a lunch someone can claim in one tap.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
