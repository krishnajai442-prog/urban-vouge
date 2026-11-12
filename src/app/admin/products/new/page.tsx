import prisma from "@/lib/prisma";
import { adminPage } from "@/lib/admin-page";
import { AddProductFullForm } from "@/components/admin/AddProductFullForm";
export const dynamic = "force-dynamic";
export default async function NewProductPage() {
  await adminPage();
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.brand.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, categories: true },
    }),
  ]);
  return <AddProductFullForm categories={categories} brands={brands} />;
}