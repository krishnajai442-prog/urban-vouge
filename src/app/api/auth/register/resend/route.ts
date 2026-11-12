// src/app/api/auth/register/resend/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { OtpPurpose } from "@prisma/client";
import prisma from "@/lib/prisma";
import { createAndSendOtp } from "@/lib/otp";
import { clientIp, rateLimit, tooMany } from "@/lib/rate-limit";
import { jsonError, normalizeMobile } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").toLowerCase(),
  phone: z.string().trim().min(10, "Mobile number is required"),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = await rateLimit("otpSend", ip);
  if (!rl.success) return tooMany(rl);

  try {
    const parsed = schema.safeParse(await req.json().catch(() => ({})));

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: parsed.error.issues[0]?.message ?? "Invalid resend request",
        },
        { status: 422 },
      );
    }

    const { email, phone } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        phone: true,
        active: true,
      },
    });

    if (!user || user.active || !user.phone) {
      return NextResponse.json({
        ok: true,
        message: "If a pending verification exists, a new code has been sent.",
      });
    }

    const normalizedUserPhone = normalizeMobile(user.phone);
    const normalizedInputPhone = normalizeMobile(phone);

    if (!normalizedUserPhone || normalizedUserPhone !== normalizedInputPhone) {
      return NextResponse.json({
        ok: true,
        message: "If a pending verification exists, a new code has been sent.",
      });
    }

    const send = await createAndSendOtp({
      purpose: OtpPurpose.REGISTER,
      phone: normalizedInputPhone,
      userId: user.id,
      ip,
      userAgent: req.headers.get("user-agent"),
      meta: { email },
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
      pendingVerification: true,
      message: "A new OTP has been sent.",
      phoneMasked: send.phoneMasked,
      expiresAt: send.expiresAt,
      resendAfter: send.resendAfter,
      devCode: send.devCode,
    });
  } catch (e) {
    return jsonError(e, "Could not resend OTP.");
  }
}