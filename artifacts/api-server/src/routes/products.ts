import { Router, type IRouter } from "express";
import { eq, ilike, and, gte, lte, desc, asc, sql } from "drizzle-orm";
import { db, productsTable, categoriesTable, reviewsTable, productVariantsTable } from "@workspace/db";
import {
  ListProductsQueryParams,
  GetProductParams,
  CreateProductBody,
  UpdateProductParams,
  UpdateProductBody,
  DeleteProductParams,
  ListRelatedProductsParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function buildProductResponse(product: typeof productsTable.$inferSelect, withVariants = false) {
  const rawId = product.id;
  const reviews = await db.select({ rating: reviewsTable.rating }).from(reviewsTable).where(eq(reviewsTable.productId, rawId));
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
  const category = await db.select({ name: categoriesTable.name }).from(categoriesTable).where(eq(categoriesTable.id, product.categoryId)).then(r => r[0]);
  let variants: any[] = [];
  if (withVariants) {
    variants = await db.select().from(productVariantsTable).where(eq(productVariantsTable.productId, rawId));
  }
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description ?? null,
    price: parseFloat(product.price),
    compareAtPrice: product.compareAtPrice ? parseFloat(product.compareAtPrice) : null,
    images: product.images ?? [],
    categoryId: product.categoryId,
    categoryName: category?.name ?? null,
    tags: product.tags ?? [],
    variants: variants.map(v => ({
      id: v.id,
      name: v.name,
      value: v.value,
      priceModifier: v.priceModifier ? parseFloat(v.priceModifier) : null,
      stockCount: v.stockCount ?? null,
    })),
    inStock: product.inStock,
    stockCount: product.stockCount ?? null,
    isFeatured: product.isFeatured,
    averageRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
    reviewCount: reviews.length,
    createdAt: product.createdAt.toISOString(),
  };
}

router.get("/products", async (req, res): Promise<void> => {
  const parsed = ListProductsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { page = 1, limit = 24, category, search, sort, minPrice, maxPrice, inStock } = parsed.data;

  const conditions: any[] = [];
  if (category) {
    const cat = await db.select({ id: categoriesTable.id }).from(categoriesTable).where(eq(categoriesTable.slug, category)).then(r => r[0]);
    if (cat) conditions.push(eq(productsTable.categoryId, cat.id));
  }
  if (search) conditions.push(ilike(productsTable.name, `%${search}%`));
  if (minPrice != null) conditions.push(gte(productsTable.price, String(minPrice)));
  if (maxPrice != null) conditions.push(lte(productsTable.price, String(maxPrice)));
  if (inStock != null) conditions.push(eq(productsTable.inStock, inStock));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  let orderBy: any = desc(productsTable.createdAt);
  if (sort === "price_asc") orderBy = asc(productsTable.price);
  else if (sort === "price_desc") orderBy = desc(productsTable.price);
  else if (sort === "popular") orderBy = desc(productsTable.salesCount);
  else if (sort === "rating") orderBy = desc(productsTable.salesCount);

  const [total] = await db.select({ count: sql<number>`count(*)` }).from(productsTable).where(where);
  const rows = await db.select().from(productsTable).where(where).orderBy(orderBy).limit(limit).offset((page - 1) * limit);

  const items = await Promise.all(rows.map(p => buildProductResponse(p)));
  res.json({ items, total: Number(total.count), page, limit });
});

router.get("/products/featured", async (_req, res): Promise<void> => {
  const rows = await db.select().from(productsTable).where(eq(productsTable.isFeatured, true)).limit(8);
  const items = await Promise.all(rows.map(p => buildProductResponse(p)));
  res.json(items);
});

router.get("/products/best-sellers", async (_req, res): Promise<void> => {
  const rows = await db.select().from(productsTable).orderBy(desc(productsTable.salesCount)).limit(8);
  const items = await Promise.all(rows.map(p => buildProductResponse(p)));
  res.json(items);
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetProductParams.safeParse({ id: parseInt(raw, 10) });
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, parsed.data.id));
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }

  res.json(await buildProductResponse(product, true));
});

router.post("/products", async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const slug = parsed.data.slug ?? parsed.data.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const [product] = await db.insert(productsTable).values({
    name: parsed.data.name,
    slug,
    description: parsed.data.description,
    price: String(parsed.data.price),
    compareAtPrice: parsed.data.compareAtPrice != null ? String(parsed.data.compareAtPrice) : undefined,
    images: parsed.data.images ?? [],
    categoryId: parsed.data.categoryId,
    tags: parsed.data.tags ?? [],
    inStock: parsed.data.inStock ?? true,
    stockCount: parsed.data.stockCount,
    isFeatured: parsed.data.isFeatured ?? false,
  }).returning();
  res.status(201).json(await buildProductResponse(product, true));
});

router.patch("/products/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateProductParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const update: Record<string, any> = {};
  if (parsed.data.name) update.name = parsed.data.name;
  if (parsed.data.description !== undefined) update.description = parsed.data.description;
  if (parsed.data.price !== undefined) update.price = String(parsed.data.price);
  if (parsed.data.compareAtPrice !== undefined) update.compareAtPrice = parsed.data.compareAtPrice != null ? String(parsed.data.compareAtPrice) : null;
  if (parsed.data.images) update.images = parsed.data.images;
  if (parsed.data.categoryId !== undefined) update.categoryId = parsed.data.categoryId;
  if (parsed.data.tags) update.tags = parsed.data.tags;
  if (parsed.data.inStock !== undefined) update.inStock = parsed.data.inStock;
  if (parsed.data.stockCount !== undefined) update.stockCount = parsed.data.stockCount;
  if (parsed.data.isFeatured !== undefined) update.isFeatured = parsed.data.isFeatured;

  const [product] = await db.update(productsTable).set(update).where(eq(productsTable.id, params.data.id)).returning();
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }
  res.json(await buildProductResponse(product, true));
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = DeleteProductParams.safeParse({ id: parseInt(rawId, 10) });
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  await db.delete(productsTable).where(eq(productsTable.id, parsed.data.id));
  res.sendStatus(204);
});

router.get("/products/:id/related", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = ListRelatedProductsParams.safeParse({ id: parseInt(rawId, 10) });
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, parsed.data.id));
  if (!product) { res.json([]); return; }

  const rows = await db.select().from(productsTable)
    .where(and(eq(productsTable.categoryId, product.categoryId), sql`${productsTable.id} != ${parsed.data.id}`))
    .limit(4);
  const items = await Promise.all(rows.map(p => buildProductResponse(p)));
  res.json(items);
});

export default router;
