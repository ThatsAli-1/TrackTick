"use client";

import { useState } from "react";
import { AppShell, useTrackTheme } from "@/app/components/app-shell";

export default function ProfilePage() {
  const { palette } = useTrackTheme();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  return (
    <AppShell>
      <h1 className="text-6xl">Profile information</h1>
      <p className="mt-3 text-lg">Edit your profile</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section className="space-y-6">
          <Field label="username" value={username} onChange={setUsername} />
          <Field label="email address" value={email} onChange={setEmail} />
        </section>
        <section className="space-y-6 border-l pl-6" style={{ borderColor: palette.border }}>
          <p className="text-xl">Security</p>
          <Field label="Change password" value={password} onChange={setPassword} type="password" />
          <Field label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} type="password" />
        </section>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  const { palette } = useTrackTheme();
  return (
    <label className="block">
      <p className="mb-2 text-lg">{label}</p>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full max-w-xl rounded-full px-4 outline-none"
        style={{ background: palette.accent, color: palette.text }}
      />
    </label>
  );
}
