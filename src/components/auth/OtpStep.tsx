"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export type OtpStage = {
  email: string;
  phone?: string;            // register verify/resend need it; login does not
  phoneMasked: string;
  expiresAt: string;         // ISO
  resendAfter: string;       // ISO
  devCode?: string;          // present only in non-prod when SMS didn't send
};

function secsLeft(iso: string): number {
  const t = new Date(iso).getTime() - Date.now();
  return t > 0 ? Math.ceil(t / 1000) : 0;
}

export function OtpStep({
  stage,
  title = "Verify your mobile",
  submitLabel = "Verify",
  busy,
  error,
  onSubmit,
  onResend,
  onCancel,
}: {
  stage: OtpStage;
  title?: string;
  submitLabel?: string;
  busy?: boolean;
  error?: string | null;
  onSubmit: (code: string) => void;
  onResend: () => void;
  onCancel?: () => void;
}) {
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(() => secsLeft(stage.resendAfter));

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // reset the box when a fresh code is sent (new timers/devCode arrive)
  useEffect(() => { setCode(""); setCooldown(secsLeft(stage.resendAfter)); },
    [stage.expiresAt, stage.resendAfter, stage.devCode]);

  const valid = /^\d{6}$/.test(code);

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-display text-[15px] font-bold text-ink-900">{title}</h3>
        <p className="mt-0.5 text-[12.5px] text-ink-400">
          We sent a 6‑digit code to <span className="font-semibold text-ink-700">{stage.phoneMasked}</span>.
          It expires in {Math.max(0, Math.ceil((new Date(stage.expiresAt).getTime() - Date.now()) / 60000))} min.
        </p>
      </div>

      {stage.devCode && (
        <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-[12px] font-semibold text-amber-700">
          Dev code (SMS not configured locally): <span className="tracking-widest">{stage.devCode}</span>
        </p>
      )}

      <Input
        autoFocus
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="••••••"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        onKeyDown={(e) => { if (e.key === "Enter" && valid && !busy) onSubmit(code); }}
        aria-label="6-digit OTP"
      />

      {error && (
        <p role="alert" className="text-[12.5px] font-semibold text-flame-600">{error}</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" loading={busy} disabled={!valid} onClick={() => onSubmit(code)}>
          {submitLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={cooldown > 0 || busy}
          onClick={onResend}
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
        </Button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-[12.5px] font-semibold text-ink-400 hover:underline">
            Change number
          </button>
        )}
      </div>
    </div>
  );
}

export default OtpStep;