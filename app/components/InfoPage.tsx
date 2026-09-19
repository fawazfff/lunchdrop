import type { ReactNode } from "react";

export function InfoPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return <main className="info-page">
    <nav className="nav shell">
      <a className="brand" href="/"><span className="brand-mark">L</span><span>LunchDrop</span></a>
      <div className="nav-links"><a href="/how-it-works">How it works</a><a href="/faq">FAQ</a><a href="/about">About</a></div>
      <a className="ghost-button" href="/#build-drop">Create a drop</a>
    </nav>
    <header className="info-hero shell"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{intro}</p></header>
    <section className="info-content shell">{children}</section>
    <footer className="footer shell"><a className="brand" href="/"><span className="brand-mark">L</span><span>LunchDrop</span></a><p>Live restaurant discovery via Flynet</p></footer>
  </main>;
}
