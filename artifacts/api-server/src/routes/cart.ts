import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, cartsTable, cartItemsTable, productsTable, productVariantsTable } from "@workspace/db";
import {
  GetCartQueryParams,
  AddToCartBody,
  UpdateCartItemParams,
  UpdateCartItemBody,
  RemoveFromCartParams,
  ClearCartQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getCartResponse(sessionId: string) {
  let [cart] = await db.select().from(cartsTable).where(eq(cartsTable.sessionId, sessionId));
  if (!cart) {
    [cart] = await db.insert(cartsTable).values({ sessionId }).returning();
  }
  const items = await db.select({
    id: cartItemsTable.id,
    productId: cartItemsTable.productId,
    variantId: cartItemsTable.variantId,
    quantity: cartItemsTable.quantity,
    price: cartItemsTable.price,
    productName: productsTable.name,
    productImage: sql<string>`${productsTable.images}[1]`,
  }).from(cartItemsTable)
    .innerJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
    .where(eq(cartItemsTable.cartId, cart.id));

  const enrichedItems = await Promise.all(items.map(async (item) => {
    let variantLabel: string | null = null;
    if (item.variantId) {
      const [variant] = await db.select().from(productVariantsTable).where(eq(productVariantsTable.id, item.variantId));
      if (variant) variantLabel = `${variant.name}: ${variant.value}`;
    }
    return {
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      productImage: item.productImage ?? null,
      price: parseFloat(item.price),
      quantity: item.quantity,
      variantId: item.variantId ?? null,
      variantLabel,
    };
  }));

  const subtotal = enrichedItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const itemCount = enrichedItems.reduce((s, i) => s + i.quantity, 0);

  return {
    id: cart.id,
    sessionId: cart.sessionId,
    userId: cart.userId ?? null,
    items: enrichedItems,
    subtotal: Math.round(subtotal * 100) / 100,
    itemCount,
  };
}

router.get("/cart", async (req, res): Promise<void> => {
  const parsed = GetCartQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  res.json(await getCartResponse(parsed.data.sessionId));
});

router.post("/cart/items", async (req, res): Promise<void> => {
  const parsed = AddToCartBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { sessionId, productId, quantity, variantId } = parsed.data;

  let [cart] = await db.select().from(cartsTable).where(eq(cartsTable.sessionId, sessionId));
  if (!cart) {
    [cart] = await db.insert(cartsTable).values({ sessionId }).returning();
  }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }

  let price = parseFloat(product.price);
  if (variantId) {
    const [variant] = await db.select().from(productVariantsTable).where(eq(productVariantsTable.id, variantId));
    if (variant?.priceModifier) price += parseFloat(variant.priceModifier);
  }

  const existing = await db.select().from(cartItemsTable)
    .where(and(eq(cartItemsTable.cartId, cart.id), eq(cartItemsTable.productId, productId)));

  if (existing.length > 0) {
    await db.update(cartItemsTable)
      .set({ quantity: existing[0].quantity + (quantity ?? 1) })
      .where(eq(cartItemsTable.id, existing[0].id));
  } else {
    await db.insert(cartItemsTable).values({
      cartId: cart.id,
      productId,
      variantId: variantId ?? null,
      quantity: quantity ?? 1,
      price: String(price),
    });
  }

  res.json(await getCartResponse(sessionId));
});

router.patch("/cart/items/:itemId", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;
  const params = UpdateCartItemParams.safeParse({ itemId: parseInt(rawId, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = UpdateCartItemBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [item] = await db.select().from(cartItemsTable).where(eq(cartItemsTable.id, params.data.itemId));
  if (!item) { res.status(404).json({ error: "Cart item not found" }); return; }

  if (parsed.data.quantity <= 0) {
    await db.delete(cartItemsTable).where(eq(cartItemsTable.id, params.data.itemId));
  } else {
    await db.update(cartItemsTable).set({ quantity: parsed.data.quantity }).where(eq(cartItemsTable.id, params.data.itemId));
  }

  const [cart] = await db.select().from(cartsTable).where(eq(cartsTable.id, item.cartId));
  res.json(await getCartResponse(cart.sessionId));
});

router.delete("/cart/items/:itemId", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;
  const params = RemoveFromCartParams.safeParse({ itemId: parseInt(rawId, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [item] = await db.select().from(cartItemsTable).where(eq(cartItemsTable.id, params.data.itemId));
  if (!item) { res.status(404).json({ error: "Cart item not found" }); return; }

  await db.delete(cartItemsTable).where(eq(cartItemsTable.id, params.data.itemId));

  const [cart] = await db.select().from(cartsTable).where(eq(cartsTable.id, item.cartId));
  res.json(await getCartResponse(cart.sessionId));
});

router.delete("/cart/clear", async (req, res): Promise<void> => {
  const parsed = ClearCartQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [cart] = await db.select().from(cartsTable).where(eq(cartsTable.sessionId, parsed.data.sessionId));
  if (cart) {
    await db.delete(cartItemsTable).where(eq(cartItemsTable.cartId, cart.id));
  }

  res.json(await getCartResponse(parsed.data.sessionId));
});

export default router;
