import Link from "next/link";
import { Percent, CreditCard, PackageSearch, Headphones, ShoppingCart, UserRound, Ruler, Truck } from "lucide-react";

const ITEMS = [
  { label: "Offers", href: "/offers", Icon: Percent },
  { label: "Size Guide", href: "/products/all", Icon: Ruler },
  { label: "Track Order", href: "/track", Icon: Truck },
  { label: "Support", href: "/contact", Icon: Headphones },
  { label: "Cart", href: "/cart", Icon: ShoppingCart },
  { label: "Account", href: "/account", Icon: UserRound },
];

export function ServiceIconRow() {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-3">
      <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ITEMS.map(({ label, href, Icon }) => (
          <Link key={label} href={href} className="flex min-w-[72px] flex-1 flex-col items-center gap-1 rounded-xl py-2 hover:bg-gray-50">
            <span className="grid size-10 place-items-center rounded-full bg-[#c9a96e]/12 text-[#8b6914]"><Icon className="size-5" /></span>
            <span className="text-[11px] font-semibold text-gray-700">{label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default ServiceIconRow;