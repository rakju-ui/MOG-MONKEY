import { Router, type IRouter } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { db, wishlistItemsTable, productsTable, categoriesTable, reviewsTable } from "@workspace/db";
import { GetWishlistParams, AddToWishlistBody, RemoveFromWishlistParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/users/:id/wishlist", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetWishlistParams.safeParse({ id: parseInt(rawId, 10) });
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const rows = await db.select().from(wishlistItemsTable).where(eq(wishlistItemsTable.userId, parsed.data.id)).orderBy(desc(wishlistItemsTable.createdAt));

  const items = await Promise.all(rows.map(async (wi) => {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, wi.productId));
    const [cat] = await db.select({ name: categoriesTable.name }).from(categoriesTable).where(eq(categoriesTable.id, product.categoryId));
    const reviews = await db.select({ rating: reviewsTable.rating }).from(reviewsTable).where(eq(reviewsTable.productId, product.id));
    const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
    return {
      id: wi.id,
      userId: wi.userId,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description ?? null,
        price: parseFloat(product.price),
        compareAtPrice: product.compareAtPrice ? parseFloat(product.compareAtPrice) : null,
        images: product.images ?? [],
        categoryId: product.categoryId,
        categoryName: cat?.name ?? null,
        tags: product.tags ?? [],
        variants: [],
        inStock: product.inStock,
        stockCount: product.stockCount ?? null,
        isFeatured: product.isFeatured,
        averageRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
        reviewCount: reviews.length,
        createdAt: product.createdAt.toISOString(),
      },
      createdAt: wi.createdAt.toISOString(),
    };
  }));

  res.json(items);
});

router.post("/users/:id/wishlist", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetWishlistParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = AddToWishlistBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const existing = await db.select().from(wishlistItemsTable)
    .where(and(eq(wishlistItemsTable.userId, params.data.id), eq(wishlistItemsTable.productId, parsed.data.productId)));
  if (existing.length > 0) { res.status(409).json({ error: "Already in wishlist" }); return; }

  const [wi] = await db.insert(wishlistItemsTable).values({ userId: params.data.id, productId: parsed.data.productId }).returning();
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, wi.productId));
  const [cat] = await db.select({ name: categoriesTable.name }).from(categoriesTable).where(eq(categoriesTable.id, product.categoryId));

  res.status(201).json({
    id: wi.id,
    userId: wi.userId,
    product: {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description ?? null,
      price: parseFloat(product.price),
      compareAtPrice: product.compareAtPrice ? parseFloat(product.compareAtPrice) : null,
      images: product.images ?? [],
      categoryId: product.categoryId,
      categoryName: cat?.name ?? null,
      tags: product.tags ?? [],
      variants: [],
      inStock: product.inStock,
      stockCount: product.stockCount ?? null,
      isFeatured: product.isFeatured,
      averageRating: null,
      reviewCount: 0,
      createdAt: product.createdAt.toISOString(),
    },
    createdAt: wi.createdAt.toISOString(),
  });
});

router.delete("/users/:id/wishlist/:productId", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const rawPid = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
  const parsed = RemoveFromWishlistParams.safeParse({ id: parseInt(rawId, 10), productId: parseInt(rawPid, 10) });
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  await db.delete(wishlistItemsTable).where(
    and(eq(wishlistItemsTable.userId, parsed.data.id), eq(wishlistItemsTable.productId, parsed.data.productId))
  );
  res.sendStatus(204);
});

export default router;
