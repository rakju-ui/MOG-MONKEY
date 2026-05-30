import { Router, type IRouter } from "express";
import { sql, gte } from "drizzle-orm";
import { db, ordersTable, usersTable, productsTable } from "@workspace/db";
import { GetRevenueChartQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/admin/analytics/summary", async (_req, res): Promise<void> => {
  const [rev] = await db.select({ total: sql<number>`coalesce(sum(total), 0)`, count: sql<number>`count(*)` }).from(ordersTable);
  const [users] = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
  const [products] = await db.select({ count: sql<number>`count(*)` }).from(productsTable);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const [recentRev] = await db.select({ total: sql<number>`coalesce(sum(total), 0)` }).from(ordersTable).where(gte(ordersTable.createdAt, thirtyDaysAgo));
  const [prevRev] = await db.select({ total: sql<number>`coalesce(sum(total), 0)` }).from(ordersTable).where(gte(ordersTable.createdAt, sixtyDaysAgo));
  const [recentOrders] = await db.select({ count: sql<number>`count(*)` }).from(ordersTable).where(gte(ordersTable.createdAt, thirtyDaysAgo));
  const [prevOrders] = await db.select({ count: sql<number>`count(*)` }).from(ordersTable).where(gte(ordersTable.createdAt, sixtyDaysAgo));
  const [pendingOrders] = await db.select({ count: sql<number>`count(*)` }).from(ordersTable).where(sql`status = 'pending'`);
  const [lowStock] = await db.select({ count: sql<number>`count(*)` }).from(productsTable).where(sql`stock_count IS NOT NULL AND stock_count < 10`);

  const prevRevVal = Number(prevRev?.total ?? 0) - Number(recentRev?.total ?? 0);
  const prevOrdersVal = Number(prevOrders?.count ?? 0) - Number(recentOrders?.count ?? 0);

  res.json({
    totalRevenue: Math.round(Number(rev?.total ?? 0) * 100) / 100,
    totalOrders: Number(rev?.count ?? 0),
    totalCustomers: Number(users?.count ?? 0),
    totalProducts: Number(products?.count ?? 0),
    revenueGrowth: prevRevVal > 0 ? Math.round((Number(recentRev?.total ?? 0) / prevRevVal - 1) * 1000) / 10 : 0,
    ordersGrowth: prevOrdersVal > 0 ? Math.round((Number(recentOrders?.count ?? 0) / prevOrdersVal - 1) * 1000) / 10 : 0,
    pendingOrders: Number(pendingOrders?.count ?? 0),
    lowStockProducts: Number(lowStock?.count ?? 0),
  });
});

router.get("/admin/analytics/revenue", async (req, res): Promise<void> => {
  const parsed = GetRevenueChartQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const period = parsed.data?.period ?? "30d";
  const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;

  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await db.select({
    date: sql<string>`date_trunc('day', created_at)::date::text`,
    revenue: sql<number>`coalesce(sum(total), 0)`,
    orders: sql<number>`count(*)`,
  }).from(ordersTable)
    .where(gte(ordersTable.createdAt, since))
    .groupBy(sql`date_trunc('day', created_at)`)
    .orderBy(sql`date_trunc('day', created_at)`);

  res.json(rows.map(r => ({
    date: r.date,
    revenue: Math.round(Number(r.revenue) * 100) / 100,
    orders: Number(r.orders),
  })));
});

export default router;
