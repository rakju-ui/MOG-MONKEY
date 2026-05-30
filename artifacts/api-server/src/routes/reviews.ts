import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, reviewsTable } from "@workspace/db";
import { ListProductReviewsParams, CreateReviewBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/products/:id/reviews", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = ListProductReviewsParams.safeParse({ id: parseInt(rawId, 10) });
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const rows = await db.select().from(reviewsTable).where(eq(reviewsTable.productId, parsed.data.id)).orderBy(desc(reviewsTable.createdAt));
  res.json(rows.map(r => ({
    id: r.id,
    productId: r.productId,
    userId: r.userId ?? null,
    authorName: r.authorName,
    rating: r.rating,
    title: r.title ?? null,
    body: r.body ?? null,
    createdAt: r.createdAt.toISOString(),
  })));
});

router.post("/products/:id/reviews", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ListProductReviewsParams.safeParse({ id: parseInt(rawId, 10) }); // reuse id schema
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [review] = await db.insert(reviewsTable).values({
    productId: params.data.id,
    userId: parsed.data.userId ?? null,
    authorName: parsed.data.authorName,
    rating: parsed.data.rating,
    title: parsed.data.title ?? null,
    body: parsed.data.body ?? null,
  }).returning();

  res.status(201).json({
    id: review.id,
    productId: review.productId,
    userId: review.userId ?? null,
    authorName: review.authorName,
    rating: review.rating,
    title: review.title ?? null,
    body: review.body ?? null,
    createdAt: review.createdAt.toISOString(),
  });
});

export default router;
