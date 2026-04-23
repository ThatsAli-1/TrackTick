"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authClient } from "@/lib/auth-client";

const nav = [
  { href: "/dashboard", label: "Home" },
  { href: "/pomodoro", label: "Pomodoro" },
  { href: "/tracker", label: "Tracker" },
  { href: "/profile", label: "Profile" },
];

export type ThemeMode = "dark" | "light";

type Palette = {
  pageBg: string;
  panelBg: string;
  innerBg: string;
  cardBg: string;
  text: string;
  mutedText: string;
  accent: string;
  progressTrack: string;
  progressFill: string;
  border: string;
  logo: string;
  toggle: string;
};

type ThemeContextValue = {
  mode: ThemeMode;
  palette: Palette;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_STORAGE_KEY = "tracktick-theme";
const THEME_EVENT = "tracktick-theme-change";

const DARK_PALETTE: Palette = {
  pageBg: "#171717",
  panelBg: "#1d2647",
  innerBg: "#2b3a76",
  cardBg: "#2a376a",
  text: "#f0e7d5",
  mutedText: "#c6bfd2",
  accent: "#384b90",
  progressTrack: "#3f4f93",
  progressFill: "#f0e7d5",
  border: "#465ba5",
  logo: "/assets/Darkmode logo.svg",
  toggle: "/assets/Property 1=Night.svg",
};

const LIGHT_PALETTE: Palette = {
  pageBg: "#f1e1cb",
  panelBg: "#e8cda9",
  innerBg: "#e7c8a3",
  cardBg: "#efb882",
  text: "#4a2f21",
  mutedText: "#806355",
  accent: "#f2b77f",
  progressTrack: "#b87652",
  progressFill: "#f3e3cf",
  border: "#d79f72",
  logo: "/assets/Logo dark mode.svg",
  toggle: "/assets/Property 1=light.svg",
};

export function useTrackTheme() {
  const ctx = useContext(ThemeContext);
  const [fallbackMode, setFallbackMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "dark";
    return window.localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
  });

  useEffect(() => {
    if (ctx) return;
    const onThemeChanged = () => {
      const next = window.localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
      setFallbackMode(next);
    };
    window.addEventListener(THEME_EVENT, onThemeChanged);
    window.addEventListener("storage", onThemeChanged);
    return () => {
      window.removeEventListener(THEME_EVENT, onThemeChanged);
      window.removeEventListener("storage", onThemeChanged);
    };
  }, [ctx]);

  if (ctx) return ctx;

  return {
    mode: fallbackMode,
    palette: fallbackMode === "light" ? LIGHT_PALETTE : DARK_PALETTE,
    toggleMode: () => {
      const next = fallbackMode === "dark" ? "light" : "dark";
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
      window.dispatchEvent(new Event(THEME_EVENT));
      setFallbackMode(next);
    },
  };
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "dark";
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    return saved === "light" ? "light" : "dark";
  });
  const palette = mode === "dark" ? DARK_PALETTE : LIGHT_PALETTE;

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    window.dispatchEvent(new Event(THEME_EVENT));
  }, [mode]);
  const themeValue = useMemo(
    () => ({
      mode,
      palette,
      toggleMode: () => setMode((prev) => (prev === "dark" ? "light" : "dark")),
    }),
    [mode, palette],
  );

  return (
    <ThemeContext.Provider value={themeValue}>
      <main className="min-h-screen p-3 sm:p-5" style={{ background: palette.pageBg, color: palette.text }}>
        <div className="mx-auto max-w-[1320px] rounded-sm p-6" style={{ background: palette.panelBg }}>
          <header className="mb-4 flex items-center justify-between gap-4">
            <nav className="flex flex-wrap items-center gap-4 text-sm">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className={pathname === item.href ? "underline" : "opacity-85"}>
                  {item.label}
                </Link>
              ))}
              <button
                type="button"
                className="opacity-85"
                onClick={async () => {
                  await authClient.signOut();
                  router.push("/");
                }}
              >
                Logout
              </button>
            </nav>

            <div className="flex items-center gap-3">
              <button type="button" className="h-9 w-[106px] overflow-hidden rounded-full" onClick={themeValue.toggleMode}>
                <img src={palette.toggle} alt="Toggle theme" className="h-full w-full" />
              </button>
              <img src={palette.logo} alt="Tracktick logo" className="h-8 w-[120px]" />
            </div>
          </header>

          <section className="min-h-[760px] rounded-3xl px-4 py-5 sm:px-7 sm:py-7" style={{ background: palette.innerBg }}>
            {children}
          </section>
        </div>
      </main>
    </ThemeContext.Provider>
  );
}
