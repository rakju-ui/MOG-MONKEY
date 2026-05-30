import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, categoriesTable, productsTable } from "@workspace/db";
import { CreateCategoryBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/categories", async (_req, res): Promise<void> => {
  const rows = await db.select().from(categoriesTable).orderBy(categoriesTable.name);
  const items = await Promise.all(rows.map(async (cat) => {
    const [cnt] = await db.select({ count: sql<number>`count(*)` }).from(productsTable).where(eq(productsTable.categoryId, cat.id));
    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? null,
      imageUrl: cat.imageUrl ?? null,
      productCount: Number(cnt.count),
    };
  }));
  res.json(items);
});

router.post("/categories", async (req, res): Promise<void> => {
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [cat] = await db.insert(categoriesTable).values(parsed.data).returning();
  res.status(201).json({ id: cat.id, name: cat.name, slug: cat.slug, description: cat.description ?? null, imageUrl: cat.imageUrl ?? null, productCount: 0 });
});

export default router;
