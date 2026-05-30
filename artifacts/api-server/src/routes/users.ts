import { Router, type IRouter } from "express";
import { eq, ilike, desc, sql } from "drizzle-orm";
import { db, usersTable, addressesTable, ordersTable } from "@workspace/db";
import {
  ListUsersQueryParams,
  CreateUserBody,
  GetUserParams,
  UpdateUserParams,
  UpdateUserBody,
  ListUserAddressesParams,
  CreateUserAddressParams,
  CreateUserAddressBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function buildUserResponse(user: typeof usersTable.$inferSelect) {
  const [orderStats] = await db.select({
    count: sql<number>`count(*)`,
    total: sql<number>`coalesce(sum(total), 0)`,
  }).from(ordersTable).where(eq(ordersTable.userId, user.id));

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    avatarUrl: user.avatarUrl ?? null,
    role: user.role as "customer" | "admin",
    orderCount: Number(orderStats?.count ?? 0),
    totalSpent: Number(orderStats?.total ?? 0),
    createdAt: user.createdAt.toISOString(),
  };
}

router.get("/users", async (req, res): Promise<void> => {
  const parsed = ListUsersQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { page = 1, limit = 20, search } = parsed.data;
  const where = search ? ilike(usersTable.email, `%${search}%`) : undefined;

  const [total] = await db.select({ count: sql<number>`count(*)` }).from(usersTable).where(where);
  const rows = await db.select().from(usersTable).where(where).orderBy(desc(usersTable.createdAt)).limit(limit).offset((page - 1) * limit);
  const items = await Promise.all(rows.map(buildUserResponse));
  res.json({ items, total: Number(total.count), page, limit });
});

router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, parsed.data.email));
  if (existing.length > 0) { res.status(409).json({ error: "Email already in use" }); return; }

  const [user] = await db.insert(usersTable).values({
    email: parsed.data.email,
    firstName: parsed.data.firstName ?? null,
    lastName: parsed.data.lastName ?? null,
  }).returning();
  res.status(201).json(await buildUserResponse(user));
});

router.get("/users/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetUserParams.safeParse({ id: parseInt(rawId, 10) });
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, parsed.data.id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(await buildUserResponse(user));
});

router.patch("/users/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateUserParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const update: Record<string, any> = {};
  if (parsed.data.firstName !== undefined) update.firstName = parsed.data.firstName;
  if (parsed.data.lastName !== undefined) update.lastName = parsed.data.lastName;
  if (parsed.data.avatarUrl !== undefined) update.avatarUrl = parsed.data.avatarUrl;

  const [user] = await db.update(usersTable).set(update).where(eq(usersTable.id, params.data.id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(await buildUserResponse(user));
});

router.get("/users/:id/addresses", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = ListUserAddressesParams.safeParse({ id: parseInt(rawId, 10) });
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const rows = await db.select().from(addressesTable).where(eq(addressesTable.userId, parsed.data.id));
  res.json(rows.map(a => ({
    id: a.id,
    line1: a.line1,
    line2: a.line2 ?? null,
    city: a.city,
    state: a.state,
    postalCode: a.postalCode,
    country: a.country,
    isDefault: a.isDefault,
  })));
});

router.post("/users/:id/addresses", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = CreateUserAddressParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = CreateUserAddressBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [address] = await db.insert(addressesTable).values({
    userId: params.data.id,
    line1: parsed.data.line1,
    line2: parsed.data.line2 ?? null,
    city: parsed.data.city,
    state: parsed.data.state,
    postalCode: parsed.data.postalCode,
    country: parsed.data.country ?? "US",
    isDefault: parsed.data.isDefault ?? false,
  }).returning();

  res.status(201).json({
    id: address.id,
    line1: address.line1,
    line2: address.line2 ?? null,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
    isDefault: address.isDefault,
  });
});

export default router;
