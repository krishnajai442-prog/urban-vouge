// src/app/api/auth/login/verify/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { OtpPurpose } from "@prisma/client";
import prisma from "@/lib/prisma";
import { createSession, isStaffRole } from "@/lib/auth/session";
import { verifyOtp } from "@/lib/otp";
import { clientIp, rateLimit, tooMany } from "@/lib/rate-limit";
import { jsonError } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").toLowerCase(),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit OTP"),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = await rateLimit("otpVerify", ip);
  if (!rl.success) return tooMany(rl);

  try {
    const parsed = schema.safeParse(await req.json().catch(() => ({})));

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: parsed.error.issues[0]?.message ?? "Invalid OTP request",
        },
        { status: 422 },
      );
    }

    const { email, code } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        active: true,
        whatsappOptIn: true,
      },
    });

    if (!user || !user.active) {
      return NextResponse.json(
        { ok: false, error: "Invalid login request." },
        { status: 401 },
      );
    }

    if (!user.phone) {
      return NextResponse.json(
        {
          ok: false,
          code: "PHONE_REQUIRED",
          error: "No mobile number is registered for this account.",
        },
        { status: 422 },
      );
    }

    const verified = await verifyOtp({
      purpose: OtpPurpose.LOGIN,
      phone: user.phone,
      code,
      userId: user.id,
    });

    if (!verified.ok) {
      return NextResponse.json(
        { ok: false, error: verified.error, code: verified.reason },
        { status: 422 },
      );
    }

    await createSession(user);

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        whatsappOptIn: user.whatsappOptIn,
      },
      redirect: isStaffRole(user.role) ? "/admin/dashboard" : "/account",
    });
  } catch (e) {
    return jsonError(e, "OTP login verification failed.");
  }
}