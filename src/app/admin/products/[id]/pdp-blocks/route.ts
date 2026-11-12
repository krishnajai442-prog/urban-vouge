import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getActor } from "@/lib/auth/guards";
import { sanitizePdpBlocks } from "@/lib/pdp-blocks";

/**
 * Standalone save route for the per-product PDP info blocks (same convention as
 * the description route): the wholesale [id] PATCH never learns about pdpBlocks.
 */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const actor = await getActor();
  if (!actor) {
    return NextResponse.json({ ok: false, error: "Sign in to edit." }, { status: 401 });
  }
  const { id } = await ctx.params;

  let body: { blocks?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const blocks = sanitizePdpBlocks(body.blocks);
  const product = await prisma.product.update({ where: { id }, data: { pdpBlocks: blocks } });
  return NextResponse.json({ ok: true, blocks: product.pdpBlocks });
}