"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// Standalone editor for the Product.description long-form column.
// Auto-saves 800ms after typing stops, or instantly on blur (so clicking
// "Update product" or navigating away never loses unsaved text).
export function DescriptionEditor({
  productId,
  initial = "",
}: {
  productId: string;
  initial?: string;
}) {
  const [value, setValue] = useState(initial);
  const [state, setState] = useState<"idle" | "unsaved" | "saving" | "saved" | "error">("idle");
  const [msg, setMsg] = useState("");
  
  const lastSavedRef = useRef(initial);
  const valueRef = useRef(initial);
  
  // Keep valueRef in sync so the save function always reads the latest text
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const save = useCallback(async () => {
    const currentValue = valueRef.current;
    if (currentValue === lastSavedRef.current) {
      setState((s) => (s === "unsaved" || s === "saving" ? "idle" : s));
      return;
    }
    setState("saving");
    setMsg("");
    try {
      const res = await fetch(`/api/admin/products/${productId}/description`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: currentValue }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || json?.ok === false) {
        setState("error");
        setMsg(json?.error ?? `Save failed (${res.status})`);
        return;
      }
      lastSavedRef.current = currentValue;
      setState("saved");
      setMsg("Saved.");
    } catch {
      setState("error");
      setMsg("Network error - not saved.");
    }
  }, [productId]);

  // Debounced auto-save: waits 800ms after the user stops typing
  useEffect(() => {
    if (value === lastSavedRef.current) {
      setState((s) => (s === "unsaved" ? "idle" : s));
      return;
    }
    setState("unsaved");
    const t = setTimeout(() => {
      save();
    }, 800);
    return () => clearTimeout(t);
  }, [value, save]);

  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => { if (value !== lastSavedRef.current) save(); }}
        rows={10}
        placeholder="Long-form product description shown on the product page's Description tab. Markdown/plain text; line breaks preserved."
        className="w-full resize-y rounded-lg border border-gray-200 bg-white p-3 text-[13px] leading-relaxed text-gray-900 outline-none focus:border-[#1a1a2e] focus:ring-2 focus:ring-[#1a1a2e]/20"
      />
      <div className="flex items-center gap-3 min-h-[20px]" aria-live="polite">
        {state === "unsaved" && (
          <span className="text-[12.5px] font-semibold text-gray-500">Unsaved changes...</span>
        )}
        {state === "saving" && (
          <span className="text-[12.5px] font-semibold text-gray-500">Saving...</span>
        )}
        {state === "saved" && (
          <span className="text-[12.5px] font-semibold text-emerald-600">Saved ✓</span>
        )}
        {state === "error" && (
          <span className="text-[12.5px] font-semibold text-rose-600">{msg || "Couldn't save"}</span>
        )}
      </div>
    </div>
  );
}