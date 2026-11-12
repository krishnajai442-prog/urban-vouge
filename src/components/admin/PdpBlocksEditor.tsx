"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/Toaster";

type Override = {
  deliveryDetails?: string[] | null; deliveryBy?: string | null; soldBy?: string | null;
  peaceOfMind?: string[] | null; highlights?: string[] | null;
};
type Defaults = { deliveryDetails: string[]; deliveryBy: string; soldBy: string; peaceOfMind: string[]; highlights: string[] };

const nl = (a?: string[] | null) => (a ?? []).join("\n");
const dot = (a: string[]) => a.join(" · ");
const toList = (t: string): string[] => t.split("\n").map((s) => s.trim()).filter(Boolean);
const strOrUndef = (s: string) => (s.trim() ? s.trim() : undefined);

const title = "mb-1 block text-[12.5px] font-bold text-ink-900";
const cap = "mt-1.5 text-[11.5px] leading-relaxed text-ink-400";
const area = "w-full rounded-lg border border-hairline bg-white px-3 py-2.5 text-[13px] leading-relaxed text-ink-900 outline-none transition-colors placeholder:text-ink-300 focus:border-electric-400 focus:ring-4 focus:ring-electric-500/10";
const box = "h-11 w-full rounded-lg border border-hairline bg-white px-3 text-[13px] text-ink-900 outline-none transition-colors placeholder:text-ink-300 focus:border-electric-400 focus:ring-4 focus:ring-electric-500/10";

const KEYS = ["deliveryDetails", "deliveryBy", "soldBy", "peaceOfMind", "highlights"] as const;

export function PdpBlocksEditor({ productId, initial, defaults }: { productId: string; initial?: Override | null; defaults: Defaults }) {
  const toast = useToast();
  const [deliveryDetails, setDeliveryDetails] = useState("");
  const [deliveryBy, setDeliveryBy] = useState("");
  const [soldBy, setSoldBy] = useState("");
  const [peaceOfMind, setPeaceOfMind] = useState("");
  const [highlights, setHighlights] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrs, setFieldErrs] = useState<Record<string, string[]>>({});
  const fe = (k: string) => fieldErrs[k]?.[0];
  const unmapped = Object.entries(fieldErrs).filter(([k]) => !(KEYS as readonly string[]).includes(k));

  const loadedFor = useRef<string | null>(null);
  useEffect(() => {
    if (loadedFor.current === productId) return;
    loadedFor.current = productId;
    setDeliveryDetails(nl(initial?.deliveryDetails));
    setDeliveryBy(initial?.deliveryBy ?? "");
    setSoldBy(initial?.soldBy ?? "");
    setPeaceOfMind(nl(initial?.peaceOfMind));
    setHighlights(nl(initial?.highlights));
    setSaved(false); setError(null); setFieldErrs({});
  }, [productId, initial]);

  async function save() {
    setSaving(true); setSaved(false); setError(null); setFieldErrs({});
    try {
      const res = await fetch(`/api/admin/products/${encodeURIComponent(productId)}/pdp-blocks`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocks: {
            deliveryDetails: toList(deliveryDetails), deliveryBy: strOrUndef(deliveryBy), soldBy: strOrUndef(soldBy),
            peaceOfMind: toList(peaceOfMind), highlights: toList(highlights),
          },
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; fields?: Record<string, string[]> };
      if (!res.ok || json.ok === false) {
        setFieldErrs(json.fields ?? {});
        if (!json.fields || Object.keys(json.fields).length === 0) setError(json.error ?? "Save failed");
        return;
      }
      setSaved(true); toast.push({ tone: "success", title: "PDP info blocks saved" });
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save PDP blocks"); }
    finally { setSaving(false); }
  }

  const guardEnter = (e: React.KeyboardEvent) => { if (e.key === "Enter") e.preventDefault(); };
  const d = defaults ?? { deliveryDetails: [], deliveryBy: "", soldBy: "", peaceOfMind: [], highlights: [] };

  return (
    <section className="card p-4">
      <h2 className="font-display text-[15px] font-bold text-ink-900">PDP info blocks</h2>
      <p className="mt-1 text-[12.5px] leading-relaxed text-ink-400">Leave a field empty to use the live default (shown as its placeholder). Typing a value overrides just that section for this product; clearing it restores the default.</p>

      <div className="mt-4 space-y-4">
        <div>
          <p className={title}>Delivery details (one per line)</p>
          <textarea rows={3} value={deliveryDetails} onChange={(e) => { setDeliveryDetails(e.target.value); setSaved(false); }} placeholder={nl(d.deliveryDetails)} className={area} />
          {fe("deliveryDetails") && <p className="mt-1 text-[11.5px] font-semibold text-flame-600">{fe("deliveryDetails")}</p>}
          <p className={cap}>Default: {dot(d.deliveryDetails)}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p className={title}>Delivery by</p>
            <input value={deliveryBy} onChange={(e) => { setDeliveryBy(e.target.value); setSaved(false); }} onKeyDown={guardEnter} placeholder={d.deliveryBy} className={box} />
            {fe("deliveryBy") && <p className="mt-1 text-[11.5px] font-semibold text-flame-600">{fe("deliveryBy")}</p>}
            <p className={cap}>Default updates daily: {d.deliveryBy}</p>
          </div>
          <div>
            <p className={title}>Sold by</p>
            <input value={soldBy} onChange={(e) => { setSoldBy(e.target.value); setSaved(false); }} onKeyDown={guardEnter} placeholder={d.soldBy} className={box} />
            {fe("soldBy") && <p className="mt-1 text-[11.5px] font-semibold text-flame-600">{fe("soldBy")}</p>}
            <p className={cap}>Default: {d.soldBy}</p>
          </div>
        </div>

        <div>
          <p className={title}>Shop with peace of mind (one per line)</p>
          <textarea rows={3} value={peaceOfMind} onChange={(e) => { setPeaceOfMind(e.target.value); setSaved(false); }} placeholder={nl(d.peaceOfMind)} className={area} />
          {fe("peaceOfMind") && <p className="mt-1 text-[11.5px] font-semibold text-flame-600">{fe("peaceOfMind")}</p>}
          <p className={cap}>Default: {dot(d.peaceOfMind)}</p>
        </div>

        <div>
          <p className={title}>Product highlights (one per line)</p>
          <textarea rows={4} value={highlights} onChange={(e) => { setHighlights(e.target.value); setSaved(false); }} placeholder={nl(d.highlights)} className={area} />
          {fe("highlights") && <p className="mt-1 text-[11.5px] font-semibold text-flame-600">{fe("highlights")}</p>}
          {d.highlights.length > 0 && <p className={cap}>Default derived from this product: {dot(d.highlights)}</p>}
        </div>
      </div>

      {(error || unmapped.length > 0) && (
        <div role="alert" className="mt-3 space-y-1 rounded-xl bg-flame-500/10 px-4 py-3 text-[12.5px] font-semibold text-flame-600">
          {error && <p>{error}</p>}
          {unmapped.map(([k, v]) => (<p key={k}>{k} — {v.join("; ")}</p>))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-end gap-3">
        {saved && !saving && <span className="text-[12.5px] font-semibold text-emerald-600">Saved</span>}
        <button type="button" onClick={save} disabled={!productId || saving} className="rounded-xl bg-ink-900 px-5 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-electric-600 disabled:opacity-50">{saving ? "Saving…" : "Save PDP blocks"}</button>
      </div>
    </section>
  );
}

export default PdpBlocksEditor;