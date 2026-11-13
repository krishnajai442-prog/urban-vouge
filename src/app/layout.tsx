import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { Toaster } from "@/components/ui/Toaster";
import { siteUrl } from "@/lib/utils";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { HideOnProduct } from "@/components/HideOnProduct";
import { ImageGuard } from "@/components/ImageGuard";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl("/")),
  title: {
    default: "Urban Vogue — Premium Men's Clothing & Fashion Store India",
    template: "%s · Urban Vogue",
  },
  description:
    "India's premium men's fashion destination. Curated shirts, trousers, jackets, shoes & accessories from top brands with easy returns and express delivery.",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl("/"),
    siteName: "Urban Vogue",
    title: "Urban Vogue — Premium Men's Clothing & Fashion Store India",
    description:
      "Curated men's fashion, transparent pricing, easy exchanges, express delivery across India.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Urban Vogue — Premium Men's Clothing & Fashion Store India",
    description:
      "India's premium men's fashion store. Curated collections, easy returns and fast delivery.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1a1a2e",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${space.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh bg-[#faf8f5] text-ink-900 antialiased">
        <ImageGuard />
        <CartProvider>
          <Header />
          <main className="min-h-[60vh] pb-20 md:pb-0">{children}</main>
          <HideOnProduct>
            <MobileTabBar />
            <MobileBottomNav />
          </HideOnProduct>
          <Toaster />
        </CartProvider>
      </body>
    </html>
  );
}