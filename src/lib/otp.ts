// src/lib/otp.ts
import "server-only";
import crypto from "node:crypto";
import type { Prisma } from "@prisma/client";
import { OtpPurpose } from "@prisma/client";
import prisma from "@/lib/prisma";
import { sendSms } from "@/lib/notify";
import { normalizeMobile } from "@/lib/utils";

const DEFAULT_TTL_MINUTES = 5;
const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_RESEND_COOLDOWN_SECONDS = 60;

function numEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const TTL_MS = numEnv("AUTH_OTP_TTL_MINUTES", DEFAULT_TTL_MINUTES) * 60_000;
const MAX_ATTEMPTS = numEnv("AUTH_OTP_MAX_ATTEMPTS", DEFAULT_MAX_ATTEMPTS);
const RESEND_COOLDOWN_MS =
  numEnv("AUTH_OTP_RESEND_COOLDOWN_SECONDS", DEFAULT_RESEND_COOLDOWN_SECONDS) *
  1000;

function secret(): string {
  const value = process.env.OTP_SECRET || process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error(
      "OTP_SECRET (or SESSION_SECRET) is missing or too short. Generate one with: openssl rand -base64 48",
    );
  }
  return value;
}

function hashOtp(purpose: OtpPurpose, phone: string, code: string): string {
  return crypto
    .createHmac("sha256", secret())
    .update(`${purpose}:${phone}:${code}`)
    .digest("hex");
}

function generateCode(): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += crypto.randomInt(0, 10).toString();
  return s;
}

export function maskPhone(phone: string | null | undefined): string {
  const normalized = normalizeMobile(phone);
  if (!normalized) return "***";
  return `${normalized.slice(0, 5)}***${normalized.slice(-2)}`;
}

export type OtpSendResult =
  | {
      ok: true;
      purpose: OtpPurpose;
      phoneMasked: string;
      expiresAt: string;
      resendAfter: string;
      sent: boolean;
      devCode?: string;
    }
  | {
      ok: false;
      error: string;
      code?: "OTP_COOLDOWN" | "INVALID_PHONE" | "SEND_FAILED";
      resendAfter?: string;
    };

export type OtpVerifyResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "no_otp"
        | "expired"
        | "invalid"
        | "too_many_attempts"
        | "already_used";
      error: string;
    };

export async function createAndSendOtp(input: {
  purpose: OtpPurpose;
  phone: string;
  userId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  meta?: Record<string, unknown>;
}): Promise<OtpSendResult> {
  const phone = normalizeMobile(input.phone);
  if (!phone) {
    return {
      ok: false,
      code: "INVALID_PHONE",
      error: "A valid 10-digit Indian mobile number is required.",
    };
  }

  const now = new Date();

  const activeWhere = {
    purpose: input.purpose,
    phone,
    userId: input.userId ?? null,
    consumedAt: null,
    expiresAt: { gt: now },
  } satisfies Prisma.OtpCodeWhereInput;

  const active = await prisma.otpCode.findFirst({
    where: activeWhere,
    orderBy: { sentAt: "desc" },
    select: {
      sentAt: true,
      resendAfter: true,
    },
  });

  if (active) {
    const resendAfter =
      active.resendAfter ??
      new Date(active.sentAt.getTime() + RESEND_COOLDOWN_MS);

    if (resendAfter > now) {
      return {
        ok: false,
        code: "OTP_COOLDOWN",
        error: "Please wait before requesting another code.",
        resendAfter: resendAfter.toISOString(),
      };
    }
  }

  // Invalidate any prior unconsumed code for this purpose/phone/user.
  await prisma.otpCode.updateMany({
    where: activeWhere,
    data: { consumedAt: now },
  });

  const code = generateCode();
  const expiresAt = new Date(now.getTime() + TTL_MS);
  const resendAfter = new Date(now.getTime() + RESEND_COOLDOWN_MS);

  await prisma.otpCode.create({
    data: {
      purpose: input.purpose,
      phone,
      userId: input.userId ?? null,
      codeHash: hashOtp(input.purpose, phone, code),
      expiresAt,
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
      consumedAt: null,
      sentAt: now,
      resendAfter,
      ip: input.ip ?? null,
      userAgent: input.userAgent?.slice(0, 500) ?? null,
      meta: (input.meta ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });

  const minutes = Math.round(TTL_MS / 60_000);
  const message = `Your Urban Vogue verification code is ${code}. It expires in ${minutes} minutes. Do not share this code.`;

  const sent = await sendSms(phone, message);

  if (!sent && process.env.NODE_ENV === "production") {
    return {
      ok: false,
      code: "SEND_FAILED",
      error: "Could not send the OTP right now. Please try again.",
    };
  }

  return {
    ok: true,
    purpose: input.purpose,
    phoneMasked: maskPhone(phone),
    expiresAt: expiresAt.toISOString(),
    resendAfter: resendAfter.toISOString(),
    sent,
    devCode: !sent && process.env.NODE_ENV !== "production" ? code : undefined,
  };
}

export async function verifyOtp(input: {
  purpose: OtpPurpose;
  phone: string;
  code: string;
  userId?: string | null;
  consume?: boolean;
}): Promise<OtpVerifyResult> {
  const phone = normalizeMobile(input.phone);
  if (!phone) {
    return { ok: false, reason: "invalid", error: "Invalid mobile number." };
  }

  const code = input.code.trim();
  if (!/^\d{6}$/.test(code)) {
    return { ok: false, reason: "invalid", error: "Enter the 6-digit code." };
  }

  const now = new Date();

  const otp = await prisma.otpCode.findFirst({
    where: {
      purpose: input.purpose,
      phone,
      userId: input.userId ?? null,
      consumedAt: null,
    },
    orderBy: { sentAt: "desc" },
  });

  if (!otp) {
    return {
      ok: false,
      reason: "no_otp",
      error: "No active code was sent to this number.",
    };
  }

  if (otp.expiresAt <= now) {
    await prisma.otpCode
      .update({
        where: { id: otp.id },
        data: { consumedAt: now },
      })
      .catch(() => undefined);

    return {
      ok: false,
      reason: "expired",
      error: "This code has expired. Request a new one.",
    };
  }

  if (otp.attempts >= otp.maxAttempts) {
    return {
      ok: false,
      reason: "too_many_attempts",
      error: "Too many incorrect attempts. Request a new code.",
    };
  }

  const incremented = await prisma.otpCode.updateMany({
    where: {
      id: otp.id,
      attempts: { lt: otp.maxAttempts },
      consumedAt: null,
      expiresAt: { gt: now },
    },
    data: {
      attempts: { increment: 1 },
    },
  });

  if (incremented.count !== 1) {
    return {
      ok: false,
      reason: "too_many_attempts",
      error: "Too many incorrect attempts. Request a new code.",
    };
  }

  const expected = Buffer.from(otp.codeHash, "utf8");
  const actual = Buffer.from(hashOtp(input.purpose, phone, code), "utf8");

  const match =
    expected.length === actual.length &&
    crypto.timingSafeEqual(expected, actual);

  if (!match) {
    return {
      ok: false,
      reason: "invalid",
      error: "Incorrect OTP. Please try again.",
    };
  }

  if (input.consume !== false) {
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    });
  }

  return { ok: true };
}

export async function purgeExpiredOtps(): Promise<{
  expired: number;
  consumed: number;
}> {
  const now = Date.now();

  const expired = await prisma.otpCode.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(now - 24 * 60 * 60 * 1000),
      },
    },
  });

  const consumed = await prisma.otpCode.deleteMany({
    where: {
      consumedAt: {
        lt: new Date(now - 7 * 24 * 60 * 60 * 1000),
      },
    },
  });

  return {
    expired: expired.count,
    consumed: consumed.count,
  };
}