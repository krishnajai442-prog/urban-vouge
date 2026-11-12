"use client";

import { Search, ShoppingCart, User, ChevronDown, PackageCheck, LogOut, Settings, ArrowLeft, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { CategoryRail } from "@/components/layout/CategoryRail";

export function Header() {
  const pathname = usePathname();
  const isProduct = pathname.startsWith("/product/");
  const { items, ready, authed, user } = useCart();
  const cartCount = ready ? items.filter((i) => !i.savedForLater).reduce((s, i) => s + i.quantity, 0) : 0;

  return (
    <>
      {isProduct && (
        <div className="flex items-center gap-3 bg-[#1a1a2e] px-3 py-2.5 md:hidden">
          <Link href="/" aria-label="Back" className="shrink-0 text-white">
            <ArrowLeft className="size-5" />
          </Link>
          <Link href="/products/all" className="flex h-9 flex-1 items-center gap-2 rounded bg-white px-3 text-sm text-gray-500">
            <Search className="size-4 shrink-0" />
            <span className="truncate">Search for styles, brands & more</span>
          </Link>
          <Link href="/cart" aria-label="Cart" className="shrink-0 text-white">
            <ShoppingBag className="size-5" />
          </Link>
        </div>
      )}

      <header className={cn("sticky top-0 z-40 bg-[#1a1a2e] text-white shadow", isProduct && "hidden md:block")}>
        <div className="bg-[#1a1a2e] px-4 py-2.5 text-white">
          <div className="mx-auto flex max-w-6xl items-center gap-4">
            {/* LOGO — glossy gold 3D mark on the dark navy stage */}
            <Link href="/" aria-label="Urban Vogue — home" className="shrink-0">
              <BrandLogo />
            </Link>

            {/* SEARCH BAR */}
            <form action="/products/all" method="get" className="relative hidden flex-1 md:block">
              <input
                name="q"
                placeholder="Search for shirts, trousers, jackets, shoes & more"
                className="h-9 w-full rounded bg-white pl-4 pr-10 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c9a96e]"
              />
              <button type="submit" className="absolute right-3 top-2 text-gray-500" aria-label="Search">
                <Search className="size-4" />
              </button>
            </form>

            {/* RIGHT ACTIONS */}
            <div className="ml-auto flex items-center gap-6 text-sm font-medium">
              {authed ? (
                <div className="group relative hidden md:block">
                  <button type="button" className="flex items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-white/10" aria-haspopup="true" aria-expanded="false">
                    <User className="size-4" />
                    <span>{user?.name?.split(" ")[0]}</span>
                    <ChevronDown className="size-3 opacity-60" />
                  </button>
                  <div className="invisible absolute right-0 top-full z-50 mt-1 w-48 origin-top-right translate-y-1 rounded-lg border bg-white opacity-0 shadow-lg ring-1 ring-black/5 transition-all duration-200 ease-out group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                    <nav className="flex flex-col py-1">
                      <a href="/account/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <Settings className="size-4" /> My Profile
                      </a>
                      <a href="/account/orders" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                        <PackageCheck className="size-4" /> 📦 My Orders
                      </a>
                      <hr className="my-1 border-t border-gray-100" />
                      <button
                        type="button"
                        onClick={async () => {
                          try { await fetch("/api/auth/logout", { method: "POST" }); }
                          finally { window.location.assign("/"); }
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#a93226] hover:bg-[#c0392b]/10"
                      >
                        <LogOut className="size-4" /> Sign Out
                      </button>
                    </nav>
                  </div>
                </div>
              ) : (
                <Link href="/auth/login" className="rounded bg-white px-4 py-1 font-bold text-[#1a1a2e] shadow-sm transition-colors hover:bg-[#faf5eb]">
                  Login
                </Link>
              )}

              <Link href="/cart" className="relative flex items-center gap-2 transition-colors hover:text-[#e0cfa8]">
                <ShoppingCart className="size-5" />
                <span className="hidden sm:inline">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -right-2 -top-2 grid size-4 place-items-center rounded-full bg-[#c9a96e] text-[10px] font-bold text-[#1a1a2e] ring-2 ring-[#1a1a2e]">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          <div className="mt-2 block md:hidden">
            <form action="/products/all" method="get" className="relative">
              <input
                name="q"
                placeholder="Search for Styles"
                className="h-9 w-full rounded bg-white pl-4 pr-10 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none"
              />
              <button type="submit" className="absolute right-3 top-2 text-gray-500" aria-label="Search">
                <Search className="size-4" />
              </button>
            </form>
          </div>
        </div>

        <CategoryRail />
      </header>
    </>
  );
}