// src/app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { OtpPurpose } from "@prisma/client";
import prisma from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
import { createAndSendOtp } from "@/lib/otp";
import { clientIp, rateLimit, tooMany } from "@/lib/rate-limit";
import { jsonError, sanitizeText } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = await rateLimit("register", ip);
  if (!rl.success) return tooMany(rl);

  try {
    const parsed = registerSchema.safeParse(
      await req.json().catch(() => ({})),
    );

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: parsed.error.issues[0]?.message ?? "Invalid registration",
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 422 },
      );
    }

    const data = parsed.data;

    if (data.honeypot) {
      return NextResponse.json({ ok: true });
    }

    const email = data.email;
    const phone = data.phone;

    const existing = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        active: true,
        phone: true,
      },
    });

    let userId: string;

    if (existing) {
      if (existing.active) {
        return NextResponse.json(
          {
            ok: false,
            error: "An account with this email already exists.",
          },
          { status: 409 },
        );
      }

      const passwordHash = await bcrypt.hash(data.password, 12);

      const user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: sanitizeText(data.name, 80),
          phone,
          passwordHash,
          whatsappOptIn: Boolean(data.whatsappOptIn),
          active: false,
        },
        select: { id: true },
      });

      userId = user.id;
    } else {
      const passwordHash = await bcrypt.hash(data.password, 12);

      const user = await prisma.user.create({
        data: {
          name: sanitizeText(data.name, 80),
          email,
          phone,
          passwordHash,
          role: "CUSTOMER",
          whatsappOptIn: Boolean(data.whatsappOptIn),
          marketingOptIn: true,
          active: false,
          cart: { create: {} },
          wishlist: { create: {} },
        },
        select: { id: true },
      });

      userId = user.id;
    }

    const send = await createAndSendOtp({
      purpose: OtpPurpose.REGISTER,
      phone,
      userId,
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
      message: "We sent a 6-digit OTP to your mobile number.",
      phoneMasked: send.phoneMasked,
      expiresAt: send.expiresAt,
      resendAfter: send.resendAfter,
      devCode: send.devCode,
    });
  } catch (e) {
    return jsonError(e, "Registration failed.");
  }
}