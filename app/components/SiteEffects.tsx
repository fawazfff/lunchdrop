"use client";

import { useEffect, useRef, useState } from "react";

type SoundKind = "click" | "select" | "action" | "success";

export function SiteEffects() {
  const [soundOn, setSoundOn] = useState(true);
  const [delight, setDelight] = useState("");
  const audioRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(true);

  useEffect(() => {
    const saved = window.localStorage.getItem("lunchdrop-sound");
    const enabled = saved !== "off";
    setSoundOn(enabled);
    enabledRef.current = enabled;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const getAudio = () => {
      if (!audioRef.current) audioRef.current = new AudioContext();
      if (audioRef.current.state === "suspended") void audioRef.current.resume();
      return audioRef.current;
    };

    const tone = (frequency: number, duration: number, volume: number, delay = 0) => {
      if (!enabledRef.current) return;
      const ctx = getAudio();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + delay;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    };

    const play = (kind: SoundKind) => {
      if (!enabledRef.current) return;
      if (kind === "select") {
        tone(520, 0.055, 0.022);
      } else if (kind === "action") {
        tone(390, 0.055, 0.026);
        tone(620, 0.09, 0.022, 0.045);
      } else if (kind === "success") {
        tone(523, 0.07, 0.023);
        tone(659, 0.08, 0.023, 0.07);
        tone(784, 0.12, 0.023, 0.14);
      } else {
        tone(430, 0.04, 0.015);
      }
    };

    const addRipple = (event: PointerEvent, target: Element) => {
      if (reducedMotion.matches) return;
      const ripple = document.createElement("span");
      ripple.className = "tap-ripple";
      ripple.style.left = `${event.clientX}px`;
      ripple.style.top = `${event.clientY}px`;
      document.body.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 520);
      target.classList.remove("micro-press");
      void (target as HTMLElement).offsetWidth;
      target.classList.add("micro-press");
      window.setTimeout(() => target.classList.remove("micro-press"), 180);
    };

    const onPointerDown = (event: PointerEvent) => {
      const element = event.target instanceof Element
        ? event.target.closest("button, a, summary, [role='button']")
        : null;
      if (!element) return;

      addRipple(event, element);

      if (element.matches(".restaurant-card, .alternative-card, .special-list button, .amount-grid button")) {
        play("select");
        if ("vibrate" in navigator) navigator.vibrate(7);
      } else if (element.matches(".primary-button, .send-button, .claim-button, .link-box button, .share-button")) {
        play("action");
        if ("vibrate" in navigator) navigator.vibrate(10);
      } else {
        play("click");
      }
    };

    const revealSelector = [
      ".section-heading",
      ".simple-steps article",
      ".flynet-proof",
      ".truth-strip",
      ".home-cta",
      ".integration-proof",
      ".panel",
      ".step-row",
      ".drop-ready",
      ".info-grid article",
      ".about-stack article",
      ".faq-list details",
      ".truth-card",
      ".claim-receipt",
      ".recipient-choice",
      ".sender-status",
    ].join(",");

    const prepareReveals = (root: ParentNode = document) => {
      const targets = Array.from(root.querySelectorAll(revealSelector));
      targets.forEach((element, index) => {
        if (element.classList.contains("motion-ready")) return;
        element.classList.add("motion-ready");
        const variant = index % 4;
        if (variant === 1) element.classList.add("motion-from-left");
        if (variant === 2) element.classList.add("motion-from-right");
        if (variant === 3) element.classList.add("motion-scale");
        observer.observe(element);
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("motion-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -36px 0px" },
    );

    prepareReveals();
    requestAnimationFrame(() => document.body.classList.add("motion-booted"));

    const onPointerMove = (event: PointerEvent) => {
      const stage = document.querySelector<HTMLElement>(".hero-stage");
      if (!stage || reducedMotion.matches) return;
      const rect = stage.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return;
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      stage.style.setProperty("--mx", x.toFixed(3));
      stage.style.setProperty("--my", y.toFixed(3));
    };

    let successWasVisible = Boolean(document.querySelector(".claim-success, .drop-ready"));
    const mutationObserver = new MutationObserver((records) => {
      const successIsVisible = Boolean(document.querySelector(".claim-success, .drop-ready"));
      if (successIsVisible && !successWasVisible) {
        play("success");
        if ("vibrate" in navigator) navigator.vibrate([18, 35, 22]);
      }
      successWasVisible = successIsVisible;
      for (const record of records) {
        for (const node of Array.from(record.addedNodes)) {
          if (node instanceof Element) prepareReveals(node);
        }
      }
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    const onInternalNavigation = (event: MouseEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const raw = anchor.getAttribute("href");
      if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:") || raw.startsWith("/api/")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      if (reducedMotion.matches) return;

      event.preventDefault();
      document.body.classList.add("page-leaving");
      window.setTimeout(() => { window.location.href = url.href; }, 260);
    };

    let secret = "";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      secret = (secret + event.key.toLowerCase()).slice(-5);
      if (secret === "lunch") {
        play("success");
        document.body.classList.add("lunchie-party");
        setDelight("Lunchie says: secret lunch mode unlocked ✦");
        window.setTimeout(() => document.body.classList.remove("lunchie-party"), 4200);
        window.setTimeout(() => setDelight(""), 4300);
      }
    };

    const onToast = (event: Event) => {
      const custom = event as CustomEvent<string>;
      const message = typeof custom.detail === "string" ? custom.detail : "";
      if (!message) return;
      setDelight(message);
      window.setTimeout(() => setDelight(""), 2400);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("click", onInternalNavigation);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("lunchdrop:toast", onToast as EventListener);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("click", onInternalNavigation);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("lunchdrop:toast", onToast as EventListener);
      mutationObserver.disconnect();
      observer.disconnect();
      void audioRef.current?.close();
      audioRef.current = null;
    };
  }, []);

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    enabledRef.current = next;
    window.localStorage.setItem("lunchdrop-sound", next ? "on" : "off");
  }

  return (
    <>
      <div className="page-curtain" aria-hidden="true"><span>LunchDrop</span></div>
      {delight ? <div className="delight-toast" role="status">{delight}</div> : null}
      <button
        type="button"
        className={`sound-toggle ${soundOn ? "is-on" : ""}`}
        onClick={toggleSound}
        aria-label={soundOn ? "Mute LunchDrop sounds" : "Turn on LunchDrop sounds"}
        title={soundOn ? "Sound on" : "Sound off"}
      >
        <span aria-hidden="true">{soundOn ? "♪" : "×"}</span>
        <small>{soundOn ? "Sound on" : "Sound off"}</small>
      </button>
    </>
  );
}
