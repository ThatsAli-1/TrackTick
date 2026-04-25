"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell, useTrackTheme } from "@/app/components/app-shell";
import { authClient } from "@/lib/auth-client";

type SessionUser = NonNullable<ReturnType<typeof authClient.useSession>["data"]>["user"];

function AccountPanel({
  user,
  palette,
  onProfileSaved,
}: {
  user: SessionUser;
  palette: ReturnType<typeof useTrackTheme>["palette"];
  onProfileSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(() => user.name ?? "");
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function saveProfile() {
    const trimmed = name.trim();
    if (!trimmed) {
      setMessage({ type: "err", text: "Display name cannot be empty." });
      return;
    }
    setSaving(true);
    setMessage(null);
    const { error } = await authClient.updateUser({ name: trimmed });
    setSaving(false);
    if (error) {
      setMessage({ type: "err", text: error.message ?? "Could not update profile." });
      return;
    }
    setMessage({ type: "ok", text: "Profile updated." });
    await onProfileSaved();
  }

  const initial = (user.name?.trim()?.[0] ?? user.email?.[0] ?? "?").toUpperCase();

  return (
    <section
      className="rounded-2xl p-6 sm:p-7"
      style={{ background: palette.cardBg, border: `1px solid ${palette.border}` }}
    >
      <h2 className="text-lg font-medium">Account</h2>
      <p className="mt-1 text-xs opacity-75" style={{ color: palette.mutedText }}>
        Your email is used for sign-in and can&apos;t be changed here.
      </p>

      <div
        className="mt-6 flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-semibold"
        style={{ background: palette.innerBg, color: palette.text }}
      >
        {initial}
      </div>

      <label className="mt-6 block">
        <span className="mb-2 block text-sm font-medium opacity-90">Display name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          className="w-full rounded-xl px-4 py-3 text-sm outline-none"
          style={{
            background: palette.innerBg,
            color: palette.text,
            boxShadow: `inset 0 0 0 1px ${palette.border}`,
          }}
        />
      </label>

      <label className="mt-4 block">
        <span className="mb-2 block text-sm font-medium opacity-90">Email</span>
        <input
          value={user.email}
          readOnly
          className="w-full cursor-not-allowed rounded-xl px-4 py-3 text-sm opacity-90 outline-none"
          style={{ background: palette.innerBg, color: palette.text }}
        />
      </label>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-medium"
          style={{
            background: user.emailVerified ? "rgba(34,197,94,0.2)" : "rgba(234,179,8,0.25)",
            color: user.emailVerified ? "#16a34a" : "#ca8a04",
          }}
        >
          {user.emailVerified ? "Verified" : "Not verified"}
        </span>
        <span className="font-mono text-[11px] opacity-60">ID {user.id}</span>
      </div>

      {message ? (
        <p className="mt-4 text-sm font-medium" style={{ color: message.type === "ok" ? "#16a34a" : "#dc2626" }}>
          {message.text}
        </p>
      ) : null}

      <button
        type="button"
        disabled={saving || name.trim() === (user.name ?? "").trim()}
        onClick={() => void saveProfile()}
        className="mt-6 w-full rounded-xl px-4 py-3 text-sm font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
        style={{ background: palette.accent, color: palette.text }}
      >
        {saving ? "Saving…" : "Save name"}
      </button>
    </section>
  );
}

function SecurityPanel({
  palette,
  mode,
  onPasswordSaved,
}: {
  palette: ReturnType<typeof useTrackTheme>["palette"];
  mode: ReturnType<typeof useTrackTheme>["mode"];
  onPasswordSaved: () => Promise<void>;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function savePassword() {
    if (!currentPassword) {
      setMessage({ type: "err", text: "Enter your current password." });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ type: "err", text: "New password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "err", text: "New passwords do not match." });
      return;
    }
    setSaving(true);
    setMessage(null);
    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });
    setSaving(false);
    if (error) {
      setMessage({ type: "err", text: error.message ?? "Could not change password." });
      return;
    }
    setMessage({ type: "ok", text: "Password updated. Other sessions were signed out." });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    await onPasswordSaved();
  }

  return (
    <section
      className="rounded-2xl p-6 sm:p-7"
      style={{
        background: palette.cardBg,
        border: `1px solid ${palette.border}`,
      }}
    >
      <h2 className="text-lg font-medium">Security</h2>
      <p className="mt-1 text-xs opacity-75" style={{ color: palette.mutedText }}>
        Changing your password will sign out other devices.
      </p>

      <label className="mt-6 block">
        <span className="mb-2 block text-sm font-medium opacity-90">Current password</span>
        <input
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full rounded-xl px-4 py-3 text-sm outline-none"
          style={{
            background: palette.innerBg,
            color: palette.text,
            boxShadow: `inset 0 0 0 1px ${palette.border}`,
          }}
        />
      </label>

      <label className="mt-4 block">
        <span className="mb-2 block text-sm font-medium opacity-90">New password</span>
        <input
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full rounded-xl px-4 py-3 text-sm outline-none"
          style={{
            background: palette.innerBg,
            color: palette.text,
            boxShadow: `inset 0 0 0 1px ${palette.border}`,
          }}
        />
      </label>

      <label className="mt-4 block">
        <span className="mb-2 block text-sm font-medium opacity-90">Confirm new password</span>
        <input
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full rounded-xl px-4 py-3 text-sm outline-none"
          style={{
            background: palette.innerBg,
            color: palette.text,
            boxShadow: `inset 0 0 0 1px ${palette.border}`,
          }}
        />
      </label>

      {message ? (
        <p className="mt-4 text-sm font-medium" style={{ color: message.type === "ok" ? "#16a34a" : "#dc2626" }}>
          {message.text}
        </p>
      ) : null}

      <button
        type="button"
        disabled={saving || !currentPassword || !newPassword}
        onClick={() => void savePassword()}
        className="mt-6 w-full rounded-xl px-4 py-3 text-sm font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
        style={{
          background: mode === "dark" ? "#4c1d95" : palette.accent,
          color: palette.text,
        }}
      >
        {saving ? "Updating…" : "Update password"}
      </button>
    </section>
  );
}

export default function ProfilePage() {
  const { palette, mode } = useTrackTheme();
  const { data: sessionPayload, isPending, refetch } = authClient.useSession();
  const user = sessionPayload?.user;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">Profile</h1>
          <p className="mt-2 text-sm opacity-80 sm:text-base" style={{ color: palette.mutedText }}>
            Manage your display name and password.
          </p>
        </header>

        {isPending ? (
          <div className="rounded-2xl px-6 py-12 text-center text-sm opacity-80" style={{ background: palette.cardBg }}>
            Loading…
          </div>
        ) : !user ? (
          <div
            className="rounded-2xl px-6 py-10 text-center"
            style={{ background: palette.cardBg, border: `1px solid ${palette.border}` }}
          >
            <p className="text-lg">You&apos;re signed out.</p>
            <p className="mt-2 text-sm opacity-80" style={{ color: palette.mutedText }}>
              Sign in to view and edit your profile.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-xl px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90"
              style={{ background: palette.accent, color: palette.text }}
            >
              Go to sign in
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <AccountPanel user={user} palette={palette} onProfileSaved={refetch} />
            <SecurityPanel palette={palette} mode={mode} onPasswordSaved={refetch} />
          </div>
        )}
      </div>
    </AppShell>
  );
}
