"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthPanel, LandingTimer, type AuthScreen } from "@/app/components/home-auth";
import { authClient } from "@/lib/auth-client";

type ThemeMode = "dark" | "light";

function formatClock() {
  const d = new Date();
  const t = d
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
    .replace(/\s/g, "");
  const date = d.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
  return `${t} | ${date}`;
}

export default function Home() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [screen, setScreen] = useState<AuthScreen>("landing");
  const [clock, setClock] = useState(formatClock);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => setClock(formatClock()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onResize = () => {
      const nextScale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080, 1);
      setScale(nextScale);
    };

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const palette = useMemo(
    () =>
      theme === "dark"
        ? {
            bg: "#1d2647",
            text: "#f0e7d5",
            subText: "#919191",
            cardFront: "#28335d",
            cardBack: "#2c3b71",
            input: "#2c3b71",
            accent: "#2c3b71",
            divider: "#919191",
            ctaText: "#f0e7d5",
            logo: "/assets/Darkmode logo.svg",
            eye: "/assets/Eye dark mode.svg",
            toggle: "/assets/Property 1=Night.svg",
          }
        : {
            bg: "#fbe0c3",
            text: "#4e3020",
            subText: "rgba(78, 48, 32, 0.77)",
            cardFront: "#f9d4ab",
            cardBack: "#ffc28a",
            input: "#ffc28a",
            accent: "#ffc28a",
            divider: "#4e3020",
            ctaText: "#4e3020",
            logo: "/assets/Logo dark mode.svg",
            eye: "/assets/Eye light mode.svg",
            toggle: "/assets/Property 1=light.svg",
          },
    [theme],
  );

  const isLanding = screen === "landing";
  const heading =
    screen === "landing"
      ? "Stay Focused Finish More\nWith Tracktik"
      : screen === "login"
        ? "WELCOME BACK"
        : screen === "signup"
          ? "FOCUS NOW"
          : "LOST FOCUS?";
  const body =
    screen === "landing"
      ? "Tracktic brings together Pomodoro sessions, task planning, calendar goals, and progress tracking in one clean dashboard designed to help students stay organized and consistent."
      : screen === "login"
        ? "Pick up where you left off. Stay focused and keep your progress going"
        : screen === "signup"
          ? "organize your tasks, and track your progress in one place."
          : "Don't worry it happens sometimes";

  return (
    <main
      className="relative h-screen w-screen overflow-hidden"
      style={{ background: palette.bg }}
    >
      <div
        className="absolute left-1/2 top-1/2 h-[1080px] w-[1920px] origin-center"
        style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        <nav
          className="absolute left-[113px] top-[65px] flex gap-10 text-3xl"
          style={{ color: palette.text }}
        >
          <button type="button" className="nav-btn" onClick={() => setScreen("landing")}>
            Home
          </button>
          {session ? (
            <>
              <button type="button" className="nav-btn" onClick={() => router.push("/pomodoro")}>
                Pomodoro
              </button>
              <button type="button" className="nav-btn" onClick={() => router.push("/calendar")}>
                Calendar
              </button>
            </>
          ) : null}
          <button type="button" className="nav-btn" onClick={() => setScreen("signup")}>
            Sign Up
          </button>
          <button type="button" className="nav-btn" onClick={() => setScreen("login")}>
            Login
          </button>
        </nav>

        <img
          src={palette.logo}
          alt="Tracktik"
          className="absolute left-[1660px] top-[22px] h-[73px] w-[196px]"
        />
        <button
          type="button"
          onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
          className="absolute left-[1392px] top-[23px] h-[72px] w-[219px] overflow-hidden rounded-[90px]"
        >
          <img src={palette.toggle} alt="Toggle theme" className="h-full w-full" />
        </button>

        <section className="absolute left-[85px] top-[185px] w-[920px]">
          <h1
            className={`whitespace-pre-line leading-none ${isLanding ? "text-[64px] mt-[108px]" : "text-[128px]"}`}
            style={{ color: palette.text }}
          >
            {heading}
          </h1>
          <p
            className={`${isLanding ? "mt-[35px] text-2xl" : "mt-[32px] text-5xl"} leading-none`}
            style={{ color: palette.text }}
          >
            {body}
          </p>
          {isLanding && (
            <button
              type="button"
              className="mt-[72px] h-[83px] w-[649px] rounded-[15px] text-6xl"
              style={{ background: palette.accent, color: palette.ctaText }}
              onClick={() => setScreen("signup")}
            >
              Start Focusing
            </button>
          )}
        </section>

        <section className="absolute left-[1077px] top-[132px] h-[807px] w-[823px]">
          <div
            className="absolute left-[67px] top-[70px] h-[667px] w-[688px] rounded-[40px]"
            style={{
              background: palette.cardBack,
              transform: `rotate(${
                screen === "login" || screen === "forgot"
                  ? theme === "dark"
                    ? "13.28deg"
                    : "-13.28deg"
                  : theme === "dark"
                    ? "-13.28deg"
                    : "13.28deg"
              })`,
            }}
          />
          <div
            className="absolute left-[71px] top-[69px] h-[667px] w-[688px] rounded-[40px]"
            style={{ background: palette.cardFront }}
          />

          {isLanding ? (
            <LandingTimer palette={palette} />
          ) : (
            <AuthPanel
              key={screen}
              screen={screen}
              palette={palette}
              setScreen={setScreen}
              onAuthed={() => router.push("/dashboard")}
            />
          )}
        </section>

        <p
          className="absolute left-[113px] top-[988px] text-2xl"
          style={{ color: palette.text }}
          suppressHydrationWarning
        >
          {clock}
        </p>
      </div>
    </main>
  );
}
