"use client";

import { useEffect, useRef, useState } from "react";

type SoundKind = "click" | "select" | "action" | "success";

export function SiteEffects() {
  const [soundOn, setSoundOn] = useState(true);
  const audioRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(true);

  useEffect(() => {
    const saved = window.localStorage.getItem("lunchdrop-sound");
    const enabled = saved !== "off";
    setSoundOn(enabled);
    enabledRef.current = enabled;

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
        tone(520, 0.055, 0.025);
      } else if (kind === "action") {
        tone(390, 0.055, 0.03);
        tone(620, 0.09, 0.026, 0.045);
      } else if (kind === "success") {
        tone(523, 0.07, 0.025);
        tone(659, 0.08, 0.025, 0.07);
        tone(784, 0.12, 0.025, 0.14);
      } else {
        tone(430, 0.04, 0.018);
      }
    };

    const addRipple = (event: PointerEvent, target: Element) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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
      } else if (element.matches(".primary-button, .send-button, .claim-button, .link-box button")) {
        play("action");
      } else {
        play("click");
      }
    };

    const revealTargets = Array.from(document.querySelectorAll(
      ".simple-steps article, .flynet-proof, .home-cta, .integration-proof, .panel, .drop-ready, .info-grid article, .about-stack article, .faq-list details, .claim-receipt, .recipient-choice",
    ));
    revealTargets.forEach((element) => element.classList.add("motion-ready"));

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("motion-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -30px 0px" },
    );
    revealTargets.forEach((element) => observer.observe(element));

    const onPointerMove = (event: PointerEvent) => {
      const stage = document.querySelector<HTMLElement>(".hero-stage");
      if (!stage || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const rect = stage.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return;
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      stage.style.setProperty("--mx", x.toFixed(3));
      stage.style.setProperty("--my", y.toFixed(3));
    };

    let successWasVisible = Boolean(document.querySelector(".claim-success"));
    const mutationObserver = new MutationObserver(() => {
      const successIsVisible = Boolean(document.querySelector(".claim-success"));
      if (successIsVisible && !successWasVisible) play("success");
      successWasVisible = successIsVisible;
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointermove", onPointerMove);
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
  );
}
