"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";

type AuthScreen = "landing" | "login" | "signup" | "forgot";
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
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [screen, setScreen] = useState<AuthScreen>("landing");
  const [clock, setClock] = useState(formatClock());
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
          <button type="button" className="nav-btn" onClick={() => setScreen("landing")}>
            Pomodoro
          </button>
          <button type="button" className="nav-btn" onClick={() => setScreen("landing")}>
            Calendar
          </button>
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
            <AuthPanel screen={screen} palette={palette} setScreen={setScreen} />
          )}
        </section>

        <p
          className="absolute left-[113px] top-[988px] text-2xl"
          style={{ color: palette.text }}
        >
          {clock}
        </p>
      </div>
    </main>
  );
}

function LandingTimer({ palette }: { palette: Record<string, string> }) {
  return (
    <>
      <p className="absolute left-[158px] top-[112px] text-2xl" style={{ color: palette.text }}>
        Pomodoro
      </p>
      <div className="absolute left-[294px] top-[112px] h-[25px] w-[2px]" style={{ background: palette.text }} />
      <p className="absolute left-[320px] top-[112px] text-2xl" style={{ color: palette.subText }}>
        Short Break
      </p>
      <div className="absolute left-[500px] top-[112px] h-[25px] w-[2px]" style={{ background: palette.subText }} />
      <p className="absolute left-[528px] top-[112px] text-2xl" style={{ color: palette.subText }}>
        Long Break
      </p>

      <p className="absolute left-[271px] top-[201px] text-8xl" style={{ color: palette.text }}>
        Focus
      </p>
      <p className="absolute left-[270px] top-[318px] text-8xl" style={{ color: palette.text }}>
        14:32
      </p>

      <div className="absolute left-[133px] top-[507px] h-[23px] w-[550px] rounded-[70px] bg-[#f0e7d5]" />
      <div
        className="absolute left-[133px] top-[507px] h-[23px] w-[337px] rounded-[70px]"
        style={{ background: palette.cardBack }}
      />

      <p className="absolute left-[117px] top-[651px] text-[20px]" style={{ color: palette.text }}>
        Pomodoros 2/6
      </p>
      <div
        className="absolute left-[315px] top-[635px] flex h-[51px] w-[200px] items-center justify-center rounded-[15px]"
        style={{ background: palette.accent }}
      >
        <p className="text-[40px]" style={{ color: palette.ctaText }}>
          PAUSE
        </p>
      </div>
      <img src="/assets/pause.svg" alt="" className="absolute left-[460px] top-[636px] h-[49px] w-[49px]" />
      <SmallControl left={536} icon="/assets/Skip forward-1.svg" palette={palette} />
      <SmallControl left={606} icon="/assets/Skip forward.svg" palette={palette} />
      <SmallControl left={676} icon="/assets/Trash.svg" palette={palette} />
    </>
  );
}

function SmallControl({
  left,
  icon,
  palette,
}: {
  left: number;
  icon: string;
  palette: Record<string, string>;
}) {
  return (
    <>
      <div
        className="absolute top-[635px] h-[51px] w-[60px] rounded-[15px]"
        style={{ left, background: palette.accent }}
      />
      <img src={icon} alt="" className="absolute top-[641px] h-[36px] w-[40px]" style={{ left: left + 12 }} />
    </>
  );
}

function AuthPanel({
  screen,
  palette,
  setScreen,
}: {
  screen: AuthScreen;
  palette: Record<string, string>;
  setScreen: (screen: AuthScreen) => void;
}) {
  const isForgot = screen === "forgot";
  const isSignup = screen === "signup";
  const labelColor = palette.text;

  return (
    <>
      {!isForgot && (
        <>
          <p className="absolute left-[209px] top-[98px] text-2xl" style={{ color: labelColor }}>
            Username or Email Address
          </p>
          <div
            className="absolute left-[151px] top-[131px] h-[51px] w-[536px] rounded-[15px]"
            style={{ background: palette.input }}
          />
          <p className="absolute left-[209px] top-[206px] text-2xl" style={{ color: labelColor }}>
            Password
          </p>
          <div
            className="absolute left-[151px] top-[241px] h-[51px] w-[536px] rounded-[15px]"
            style={{ background: palette.input }}
          />
          <img src={palette.eye} alt="" className="absolute left-[644px] top-[254px] h-[21px] w-[32px]" />

          {isSignup && (
            <>
              <p className="absolute left-[209px] top-[302px] text-2xl" style={{ color: labelColor }}>
                Confirm Password
              </p>
              <div
                className="absolute left-[151px] top-[335px] h-[51px] w-[536px] rounded-[15px]"
                style={{ background: palette.input }}
              />
              <img src={palette.eye} alt="" className="absolute left-[644px] top-[350px] h-[21px] w-[32px]" />
            </>
          )}

          {!isSignup && (
            <button
              type="button"
              className="absolute left-[551px] top-[302px] text-sm"
              style={{ color: labelColor }}
              onClick={() => setScreen("forgot")}
            >
              Forgot password?
            </button>
          )}

          <div
            className={`absolute flex h-[51px] w-[200px] items-center justify-center rounded-[15px] ${
              isSignup ? "left-[311px] top-[408px]" : "left-[315px] top-[337px]"
            }`}
            style={{ background: palette.accent }}
          >
            <p className="text-[40px]" style={{ color: palette.ctaText }}>
              {isSignup ? "SIGN UP" : "LOGIN"}
            </p>
          </div>

          <div
            className={`absolute h-[1px] w-[561px] ${isSignup ? "left-[141px] top-[484px]" : "left-[140px] top-[415px]"}`}
            style={{ background: palette.divider }}
          />
          <p
            className={`absolute text-[40px] ${isSignup ? "left-[404px] top-[472px]" : "left-[416px] top-[403px]"}`}
            style={{ color: palette.text }}
          >
            or
          </p>
          <img
            src="/assets/google.svg"
            alt="Continue with Google"
            className={`absolute h-[52px] w-[52px] ${isSignup ? "left-[404px] top-[542px]" : "left-[416px] top-[468px]"}`}
          />

          <p
            className={`absolute text-base ${isSignup ? "left-[140px] top-[653px]" : "left-[140px] top-[599px]"}`}
            style={{ color: palette.text }}
          >
            {isSignup ? "Already Have An Account ? " : "Don't Have An Account ? "}
            <button
              type="button"
              className="text-[#eb4237]"
              onClick={() => setScreen(isSignup ? "login" : "signup")}
            >
              {isSignup ? "Login" : "Sign Up"}
            </button>
            !
          </p>
        </>
      )}

      {isForgot && (
        <>
          <p className="absolute left-[209px] top-[98px] text-2xl" style={{ color: labelColor }}>
            Enter registered email
          </p>
          <div
            className="absolute left-[151px] top-[131px] h-[51px] w-[536px] rounded-[15px]"
            style={{ background: palette.input }}
          />
          <div
            className="absolute left-[293px] top-[201px] flex h-[51px] w-[257px] items-center justify-center rounded-[15px]"
            style={{ background: palette.accent }}
          >
            <p className="text-[40px]" style={{ color: palette.ctaText }}>
              Send Code
            </p>
          </div>
          <p className="absolute left-[301px] top-[297px] text-[40px]" style={{ color: palette.text }}>
            Enter OTP
          </p>

          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute top-[356px] h-[95px] w-[92px] rounded-[25px]"
              style={{
                left: 163 + i * 137,
                background: themeBoxBg(palette.text),
                border: i === 0 ? `3px solid ${palette.accent}` : "none",
              }}
            />
          ))}

          <div
            className="absolute left-[170px] top-[518px] flex h-[51px] w-[494px] items-center justify-center rounded-[15px]"
            style={{ background: palette.accent }}
          >
            <p className="text-[40px]" style={{ color: palette.ctaText }}>
              Reset Password
            </p>
          </div>
          <button
            type="button"
            className="absolute left-[170px] top-[590px] text-base text-[#eb4237]"
            onClick={() => setScreen("login")}
          >
            Back to Login
          </button>
        </>
      )}
    </>
  );
}

function themeBoxBg(textColor: string) {
  return textColor === "#4e3020" ? "#4e3020" : "#f0e7d5";
}
