import { Router, type IRouter } from "express";
import { eq, desc, sql, and } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, cartItemsTable, cartsTable, productsTable } from "@workspace/db";
import {
  ListOrdersQueryParams,
  CreateOrderBody,
  GetOrderParams,
  UpdateOrderStatusParams,
  UpdateOrderStatusBody,
  ListAdminOrdersQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function buildOrderResponse(order: typeof ordersTable.$inferSelect, items: typeof orderItemsTable.$inferSelect[]) {
  return {
    id: order.id,
    userId: order.userId ?? null,
    customerEmail: order.customerEmail,
    status: order.status,
    items: items.map(i => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      productImage: i.productImage ?? null,
      price: parseFloat(i.price),
      quantity: i.quantity,
      variantLabel: i.variantLabel ?? null,
    })),
    subtotal: parseFloat(order.subtotal),
    shippingCost: parseFloat(order.shippingCost),
    tax: parseFloat(order.tax),
    total: parseFloat(order.total),
    shippingAddress: {
      id: order.id,
      line1: order.shippingLine1,
      line2: order.shippingLine2 ?? null,
      city: order.shippingCity,
      state: order.shippingState,
      postalCode: order.shippingPostalCode,
      country: order.shippingCountry,
      isDefault: false,
    },
    notes: order.notes ?? null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

router.get("/orders", async (req, res): Promise<void> => {
  const parsed = ListOrdersQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { page = 1, limit = 20, userId } = parsed.data;
  const conditions: any[] = [];
  if (userId) conditions.push(eq(ordersTable.userId, userId));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [total] = await db.select({ count: sql<number>`count(*)` }).from(ordersTable).where(where);
  const rows = await db.select().from(ordersTable).where(where).orderBy(desc(ordersTable.createdAt)).limit(limit).offset((page - 1) * limit);
  const items = await Promise.all(rows.map(async o => {
    const oi = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, o.id));
    return buildOrderResponse(o, oi);
  }));
  res.json({ items, total: Number(total.count), page, limit });
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { sessionId, customerEmail, shippingAddress, notes, userId } = parsed.data;

  const [cart] = await db.select().from(cartsTable).where(eq(cartsTable.sessionId, sessionId));
  if (!cart) { res.status(400).json({ error: "Cart not found" }); return; }

  const cartItems = await db.select({
    id: cartItemsTable.id,
    productId: cartItemsTable.productId,
    quantity: cartItemsTable.quantity,
    price: cartItemsTable.price,
    variantId: cartItemsTable.variantId,
    productName: productsTable.name,
    productImage: sql<string>`${productsTable.images}[1]`,
  }).from(cartItemsTable)
    .innerJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
    .where(eq(cartItemsTable.cartId, cart.id));

  if (cartItems.length === 0) { res.status(400).json({ error: "Cart is empty" }); return; }

  const subtotal = cartItems.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);
  const shippingCost = subtotal > 50 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shippingCost + tax;

  const [order] = await db.insert(ordersTable).values({
    userId: userId ?? null,
    customerEmail,
    status: "confirmed",
    subtotal: String(Math.round(subtotal * 100) / 100),
    shippingCost: String(Math.round(shippingCost * 100) / 100),
    tax: String(Math.round(tax * 100) / 100),
    total: String(Math.round(total * 100) / 100),
    shippingLine1: shippingAddress.line1,
    shippingLine2: shippingAddress.line2 ?? null,
    shippingCity: shippingAddress.city,
    shippingState: shippingAddress.state,
    shippingPostalCode: shippingAddress.postalCode,
    shippingCountry: shippingAddress.country ?? "US",
    notes: notes ?? null,
  }).returning();

  const orderItems = await db.insert(orderItemsTable).values(
    cartItems.map(i => ({
      orderId: order.id,
      productId: i.productId,
      productName: i.productName,
      productImage: i.productImage ?? null,
      price: i.price,
      quantity: i.quantity,
      variantLabel: null,
    }))
  ).returning();

  // Clear cart
  await db.delete(cartItemsTable).where(eq(cartItemsTable.cartId, cart.id));

  // Update sales count
  for (const item of cartItems) {
    await db.update(productsTable).set({ salesCount: sql`${productsTable.salesCount} + ${item.quantity}` }).where(eq(productsTable.id, item.productId));
  }

  res.status(201).json(buildOrderResponse(order, orderItems));
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetOrderParams.safeParse({ id: parseInt(rawId, 10) });
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, parsed.data.id));
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }

  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
  res.json(buildOrderResponse(order, items));
});

router.patch("/orders/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateOrderStatusParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [order] = await db.update(ordersTable).set({ status: parsed.data.status }).where(eq(ordersTable.id, params.data.id)).returning();
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }

  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
  res.json(buildOrderResponse(order, items));
});

router.get("/admin/orders", async (req, res): Promise<void> => {
  const parsed = ListAdminOrdersQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { page = 1, limit = 20, status } = parsed.data;
  const conditions: any[] = [];
  if (status) conditions.push(eq(ordersTable.status, status));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [total] = await db.select({ count: sql<number>`count(*)` }).from(ordersTable).where(where);
  const rows = await db.select().from(ordersTable).where(where).orderBy(desc(ordersTable.createdAt)).limit(limit).offset((page - 1) * limit);
  const items = await Promise.all(rows.map(async o => {
    const oi = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, o.id));
    return buildOrderResponse(o, oi);
  }));
  res.json({ items, total: Number(total.count), page, limit });
});

export default router;
