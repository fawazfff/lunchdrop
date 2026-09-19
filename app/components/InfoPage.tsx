import type { ReactNode } from "react";
import { SiteNav } from "./SiteNav";

type CurrentPage = "home" | "send" | "how" | "blackbird" | "live" | "status" | "faq" | "about";

export function InfoPage({
  eyebrow,
  title,
  intro,
  children,
  current,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
  current: CurrentPage;
}) {
  return <main className="info-page">
    <SiteNav current={current} />
    <header className="info-hero shell"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{intro}</p></header>
    <section className="info-content shell">{children}</section>
    <footer className="footer shell">
      <a className="brand" href="/"><span className="brand-mark">L</span><span>LunchDrop</span></a>
      <div className="footer-links"><a href="/live">Live places</a><a href="/blackbird">Blackbird</a><a href="/status">Status</a><a href="/faq">FAQ</a><a href="/about">About</a></div>
      <p>Real restaurant choices from Flynet</p>
    </footer>
  </main>;
}
