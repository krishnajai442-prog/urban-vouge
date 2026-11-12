import { CalendarDays, MapPin, RefreshCcw, Store, Truck } from "lucide-react";

type Props = {
  returnableDays: number;
  /** e.g. "Sunday, 25 Oct" — computed by the page from now + 4 days. */
  deliveryByLabel?: string | null;
  /** Single-seller store: shown as "Seller: UrbanVogue". */
  sellerName?: string | null;
  /** Truncated saved-address line, when the actor has one. */
  addressLine?: string | null;
  /** Admin override for the delivery detail bullets. Null/empty = built-in defaults. */
  items?: string[] | null;
};

export function DeliveryDetails({ returnableDays, deliveryByLabel, sellerName, addressLine, items }: Props) {
  const defaultBullets = [
    { icon: <Truck className="size-4 shrink-0 text-[#1a1a2e]" />, text: "Free delivery" },
    { icon: <Truck className="size-4 shrink-0 text-[#1a1a2e]" />, text: "Delivery in 3–5 business days" },
    { icon: <RefreshCcw className="size-4 shrink-0 text-[#1a1a2e]" />, text: `${returnableDays}-day replacement window` },
  ];

  const bullets = items && items.length
    ? items.map((text, i) => ({
        icon: i === items.length - 1 && text.toLowerCase().includes("replacement")
          ? <RefreshCcw className="size-4 shrink-0 text-[#1a1a2e]" />
          : <Truck className="size-4 shrink-0 text-[#1a1a2e]" />,
        text,
      }))
    : defaultBullets;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-2 font-display text-[15px] font-bold text-gray-900">Delivery details</h3>
      <div className="space-y-2">
        {addressLine ? (
          <p className="flex items-center gap-2 rounded-lg bg-[#faf5eb] px-3 py-2.5 text-[13px] text-gray-800">
            <MapPin className="size-4 shrink-0 text-[#1a1a2e]" />
            <span className="truncate font-semibold">{addressLine}</span>
          </p>
        ) : null}

        {bullets.map((b, i) => (
          <p key={i} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-[13px] text-gray-800">
            {b.icon}
            {b.text}
          </p>
        ))}

        {deliveryByLabel ? (
          <p className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-[13px] text-gray-800">
            <CalendarDays className="size-4 shrink-0 text-[#1a1a2e]" />
            <span>
              Delivery by <span className="font-bold">{deliveryByLabel}</span>
            </span>
          </p>
        ) : null}

        {sellerName ? (
          <p className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-[13px] text-gray-800">
            <Store className="size-4 shrink-0 text-[#1a1a2e]" />
            <span>
              Seller: <span className="font-semibold">{sellerName}</span>
            </span>
          </p>
        ) : null}
      </div>
    </section>
  );
}

export default DeliveryDetails;