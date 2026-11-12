// src/app/api/auth/register/verify/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { OtpPurpose } from "@prisma/client";
import prisma from "@/lib/prisma";
import { createSession } from "@/lib/auth/session";
import { notify } from "@/lib/notifications";
import { verifyOtp } from "@/lib/otp";
import { clientIp, rateLimit, tooMany } from "@/lib/rate-limit";
import { jsonError, normalizeMobile } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").toLowerCase(),
  phone: z.string().trim().min(10, "Mobile number is required"),
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
          error: parsed.error.issues[0]?.message ?? "Invalid verification request",
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 422 },
      );
    }

    const { email, phone, code } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        active: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Invalid verification request." },
        { status: 401 },
      );
    }

    if (user.active) {
      return NextResponse.json(
        { ok: false, error: "Account is already verified. Please log in." },
        { status: 409 },
      );
    }

    const normalizedUserPhone = normalizeMobile(user.phone);
    const normalizedInputPhone = normalizeMobile(phone);

    if (!normalizedUserPhone || normalizedUserPhone !== normalizedInputPhone) {
      return NextResponse.json(
        { ok: false, error: "Mobile number does not match this account." },
        { status: 422 },
      );
    }

    const verified = await verifyOtp({
      purpose: OtpPurpose.REGISTER,
      phone: normalizedInputPhone,
      code,
      userId: user.id,
    });

    if (!verified.ok) {
      return NextResponse.json(
        { ok: false, error: verified.error, code: verified.reason },
        { status: 422 },
      );
    }

    const activated = await prisma.user.update({
      where: { id: user.id },
      data: {
        active: true,
        lastLoginAt: new Date(),
        failedLoginCount: 0,
        lockedUntil: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        whatsappOptIn: true,
      },
    });

    await createSession(activated);

    await notify({
      template: "WELCOME",
      userId: activated.id,
      email: activated.email,
      ctx: { name: activated.name.split(" ")[0] ?? "there" },
    }).catch((e) => console.error("[auth:welcome]", e));

    return NextResponse.json({
      ok: true,
      user: activated,
      redirect: "/account",
    });
  } catch (e) {
    return jsonError(e, "OTP verification failed.");
  }
}