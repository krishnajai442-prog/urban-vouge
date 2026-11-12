// src/app/api/auth/login/resend/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { OtpPurpose } from "@prisma/client";
import prisma from "@/lib/prisma";
import { createAndSendOtp } from "@/lib/otp";
import { clientIp, rateLimit, tooMany } from "@/lib/rate-limit";
import { jsonError } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").toLowerCase(),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = await rateLimit("otpSend", ip);
  if (!rl.success) return tooMany(rl);

  try {
    const parsed = schema.safeParse(await req.json().catch(() => ({})));

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid resend request" },
        { status: 422 },
      );
    }

    const { email } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        phone: true,
        active: true,
        role: true,
      },
    });

    // Avoid account enumeration. Return success even if the account does not exist.
    if (!user || !user.active || !user.phone || user.role !== "CUSTOMER") {
      return NextResponse.json({
        ok: true,
        message: "If an account exists, a new code has been sent.",
      });
    }

    const send = await createAndSendOtp({
      purpose: OtpPurpose.LOGIN,
      phone: user.phone,
      userId: user.id,
      ip,
      userAgent: req.headers.get("user-agent"),
    });

    if (!send.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: send.error,
          code: send.code,
          resendAfter: send.resendAfter,
        },
        { status: send.code === "OTP_COOLDOWN" ? 429 : 422 },
      );
    }

    return NextResponse.json({
      ok: true,
      requiresOtp: true,
      message: "A new OTP has been sent.",
      phoneMasked: send.phoneMasked,
      expiresAt: send.expiresAt,
      resendAfter: send.resendAfter,
      devCode: send.devCode,
    });
  } catch (e) {
    return jsonError(e, "Could not resend login OTP.");
  }
}