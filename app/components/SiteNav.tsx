"use client";

import { useState } from "react";
import { BlackbirdConnect } from "./BlackbirdConnect";

type SiteNavProps = {
  current?: "home" | "send" | "how" | "blackbird" | "live" | "history" | "status" | "faq" | "about";
};

const links = [
  { href: "/how-it-works", label: "How it works", key: "how" },
  { href: "/live", label: "Live places", key: "live" },
  { href: "/history", label: "My LunchDrops", key: "history" },
] as const;

export function SiteNav({ current = "home" }: SiteNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="nav shell site-nav">
      <a className="brand" href="/" aria-label="LunchDrop home">
        <span className="brand-mark">L</span>
        <span>LunchDrop</span>
      </a>

      <div className="nav-links" aria-label="Main navigation">
        {links.map((link) => (
          <a className={current === link.key ? "active" : ""} href={link.href} key={link.href}>
            {link.label}
          </a>
        ))}
      </div>

      <div className="nav-actions">
        <BlackbirdConnect compact />
        {current !== "send" ? <a className="ghost-button nav-send-button" href="/send">Send lunch</a> : null}
        <button
          type="button"
          className="mobile-menu-button"
          aria-expanded={menuOpen}
          aria-controls="mobile-site-menu"
          onClick={() => setMenuOpen((value) => !value)}
        >
          <span aria-hidden="true">{menuOpen ? "×" : "☰"}</span>
          <small>Menu</small>
        </button>
      </div>

      {menuOpen ? (
        <div className="mobile-site-menu" id="mobile-site-menu">
          <div className="mobile-menu-head">
            <span>Explore LunchDrop</span>
            <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu">×</button>
          </div>
          {[...links,
            { href: "/blackbird", label: "About Blackbird", key: "blackbird" as const },
            { href: "/status", label: "What’s working", key: "status" as const },
            { href: "/faq", label: "FAQ", key: "faq" as const },
            { href: "/about", label: "About", key: "about" as const },
          ].map((link) => (
            <a className={current === link.key ? "active" : ""} href={link.href} key={link.href}>
              <span>{link.label}</span><b>→</b>
            </a>
          ))}
          {current !== "send" ? <a className="mobile-menu-primary" href="/send"><span>Send a LunchDrop</span><b>→</b></a> : null}
        </div>
      ) : null}
    </nav>
  );
}
