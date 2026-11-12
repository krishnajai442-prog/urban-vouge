"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail, Phone, User } from "lucide-react";

import { BrandLogo } from "@/components/layout/BrandLogo";
import { OtpStep, type OtpStage } from "@/components/auth/OtpStep";
import { Button } from "@/components/ui/Button";
import { Checkbox, Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toaster";

/**
 * Self-contained OTP-aware auth forms for /auth/login and /auth/register.
 * RECONSTRUCTED shell (the original AuthForms.tsx was never visible in any
 * dump), built from the app's confirmed design tokens + the real BrandLogo so
 * it matches the live site. Exports ONLY LoginForm/RegisterForm (the two the
 * pages import, prop-less). Forgot/Reset stay in the untouched AuthForms.tsx.
 */

// Open-redirect guard: only same-origin paths, never protocol-relative "//".
function redirectAfter(fallback: string) {
  const next = new URLSearchParams(window.location.search).get("next");
  window.location.href =
    next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <div className="mb-6 flex justify-center">
        <BrandLogo />
      </div>
      <div className="card p-6">
        <h1 className="font-display text-[20px] font-bold text-ink-900">{title}</h1>
        <p className="mt-1 text-[13px] text-ink-400">{subtitle}</p>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

function FieldError({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <p role="alert" className="text-[12.5px] font-semibold text-flame-600">
      {msg}
    </p>
  );
}

/* ────────────────────────────── LOGIN ────────────────────────────── */

export function LoginForm() {
  const router = useRouter();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [otp, setOtp] = useState<OtpStage | null>(null);
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok: boolean;
        requiresOtp?: boolean;
        error?: string;
        phoneMasked?: string;
        expiresAt?: string;
        resendAfter?: string;
        devCode?: string;
        redirect?: string;
      };

      // Password ok, server now wants the 6-digit code (CUSTOMER path).
      if (json.requiresOtp) {
        setOtp({
          email,
          phoneMasked: json.phoneMasked ?? "",
          expiresAt: json.expiresAt ?? "",
          resendAfter: json.resendAfter ?? "",
          devCode: json.devCode,
        });
        return; // do NOT redirect — no session exists yet
      }

      if (!json.ok) throw new Error(json.error ?? "Invalid email or password.");

      // Staff/admin path: session already set server-side.
      redirectAfter(json.redirect ?? "/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(code: string) {
    setOtpBusy(true);
    setOtpError(null);
    try {
      const res = await fetch("/api/auth/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otp!.email, code }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok: boolean;
        error?: string;
        redirect?: string;
      };
      if (!json.ok) {
        setOtpError(json.error ?? "Incorrect OTP.");
        return;
      }
      toast.push({ tone: "success", title: "Signed in" });
      redirectAfter(json.redirect ?? "/account");
    } catch {
      setOtpError("Could not verify. Try again.");
    } finally {
      setOtpBusy(false);
    }
  }

  async function resendOtp() {
    setOtpBusy(true);
    setOtpError(null);
    try {
      const res = await fetch("/api/auth/login/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otp!.email }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok: boolean;
        error?: string;
        phoneMasked?: string;
        expiresAt?: string;
        resendAfter?: string;
        devCode?: string;
      };
      if (json.ok) {
        setOtp((s) =>
          s && {
            ...s,
            phoneMasked: json.phoneMasked ?? s.phoneMasked,
            expiresAt: json.expiresAt ?? s.expiresAt,
            resendAfter: json.resendAfter ?? s.resendAfter,
            devCode: json.devCode,
          },
        );
      } else {
        setOtpError(json.error ?? "Could not resend.");
      }
    } catch {
      setOtpError("Could not resend.");
    } finally {
      setOtpBusy(false);
    }
  }

  return (
    <AuthShell title="Sign in" subtitle="Access orders, wishlist and support.">
      {otp ? (
        <OtpStep
          stage={otp}
          busy={otpBusy}
          error={otpError}
          onSubmit={verifyOtp}
          onResend={resendOtp}
          onCancel={() => {
            setOtp(null);
            setOtpError(null);
          }}
        />
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <FieldError msg={error} />
          <div className="flex items-center justify-between">
            <a href="/auth/forgot" className="text-[12.5px] font-semibold text-ink-400 hover:text-electric-600">
              Forgot password?
            </a>
            <span className="text-[12.5px] text-ink-400">
              New here?{" "}
              <a href="/auth/register" className="font-semibold text-electric-600 hover:underline">
                Create account
              </a>
            </span>
          </div>
          <Button type="submit" loading={busy} className="w-full">
            {!busy && <ArrowRight className="size-4" />}
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

/* ──────────────────────────── REGISTER ──────────────────────────── */

export function RegisterForm() {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [otp, setOtp] = useState<OtpStage | null>(null);
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password, whatsappOptIn }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok: boolean;
        pendingVerification?: boolean;
        error?: string;
        fields?: Record<string, string[]>;
        phoneMasked?: string;
        expiresAt?: string;
        resendAfter?: string;
        devCode?: string;
      };

      if (!json.ok) {
        const first = json.fields ? Object.values(json.fields).flat()[0] : json.error;
        throw new Error(first ?? "Registration failed.");
      }

      // Account created inactive; a REGISTER OTP was sent. No session yet.
      if (json.pendingVerification) {
        setOtp({
          email,
          phone, // register verify/resend validate the phone matches the account
          phoneMasked: json.phoneMasked ?? "",
          expiresAt: json.expiresAt ?? "",
          resendAfter: json.resendAfter ?? "",
          devCode: json.devCode,
        });
        return;
      }

      // Should not happen with the OTP route, but stay safe.
      redirectAfter("/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(code: string) {
    setOtpBusy(true);
    setOtpError(null);
    try {
      const res = await fetch("/api/auth/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otp!.email, phone: otp!.phone, code }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok: boolean;
        error?: string;
        redirect?: string;
      };
      if (!json.ok) {
        setOtpError(json.error ?? "Incorrect OTP.");
        return;
      }
      toast.push({ tone: "success", title: "Account verified", body: "Welcome to Urban Vogue." });
      redirectAfter(json.redirect ?? "/account");
    } catch {
      setOtpError("Could not verify. Try again.");
    } finally {
      setOtpBusy(false);
    }
  }

  async function resendOtp() {
    setOtpBusy(true);
    setOtpError(null);
    try {
      const res = await fetch("/api/auth/register/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otp!.email, phone: otp!.phone }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok: boolean;
        error?: string;
        phoneMasked?: string;
        expiresAt?: string;
        resendAfter?: string;
        devCode?: string;
      };
      if (json.ok) {
        setOtp((s) =>
          s && {
            ...s,
            phoneMasked: json.phoneMasked ?? s.phoneMasked,
            expiresAt: json.expiresAt ?? s.expiresAt,
            resendAfter: json.resendAfter ?? s.resendAfter,
            devCode: json.devCode,
          },
        );
      } else {
        setOtpError(json.error ?? "Could not resend.");
      }
    } catch {
      setOtpError("Could not resend.");
    } finally {
      setOtpBusy(false);
    }
  }

  return (
    <AuthShell title="Create account" subtitle="Shop faster, track orders, save favourites.">
      {otp ? (
        <OtpStep
          stage={otp}
          title="Confirm your mobile"
          submitLabel="Verify & continue"
          busy={otpBusy}
          error={otpError}
          onSubmit={verifyOtp}
          onResend={resendOtp}
          onCancel={() => {
            setOtp(null);
            setOtpError(null);
          }}
        />
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Full name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Mobile number"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="10-digit mobile"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            required
          />
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Checkbox
            checked={whatsappOptIn}
            onChange={(e) => setWhatsappOptIn(e.target.checked)}
            label="Send me offers & order updates on WhatsApp"
          />
          <FieldError msg={error} />
          <p className="text-[12.5px] text-ink-400">
            Already have an account?{" "}
            <a href="/auth/login" className="font-semibold text-electric-600 hover:underline">
              Sign in
            </a>
          </p>
          <Button type="submit" loading={busy} className="w-full">
            {!busy && <ArrowRight className="size-4" />}
            {busy ? "Creating…" : "Create account"}
          </Button>
          <p className="text-[11px] leading-relaxed text-ink-300">
            A 6‑digit OTP will be sent to your mobile to activate the account.
          </p>
        </form>
      )}
    </AuthShell>
  );
}