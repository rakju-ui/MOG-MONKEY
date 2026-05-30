import { pgTable, text, serial, timestamp, integer, boolean, numeric, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { categoriesTable } from "./categories";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: numeric("compare_at_price", { precision: 10, scale: 2 }),
  images: text("images").array().notNull().default([]),
  categoryId: integer("category_id").references(() => categoriesTable.id).notNull(),
  tags: text("tags").array().notNull().default([]),
  inStock: boolean("in_stock").notNull().default(true),
  stockCount: integer("stock_count"),
  isFeatured: boolean("is_featured").notNull().default(false),
  salesCount: integer("sales_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  index("products_category_idx").on(t.categoryId),
  index("products_featured_idx").on(t.isFeatured),
]);

export const productVariantsTable = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => productsTable.id).notNull(),
  name: text("name").notNull(),
  value: text("value").notNull(),
  priceModifier: numeric("price_modifier", { precision: 10, scale: 2 }),
  stockCount: integer("stock_count"),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true, updatedAt: true, salesCount: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
export type ProductVariant = typeof productVariantsTable.$inferSelect;
