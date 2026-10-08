import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { Address, CartItem, Customer, DeliveryMethod, PaymentMethod } from "@/lib/types";

export const orderStatus = pgEnum("order_status", [
  "a_confirmar",
  "pendiente_pago",
  "pagado",
  "en_produccion",
  "listo",
  "enviado",
  "entregado",
  "cancelado",
]);

export const designs = pgTable("designs", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  images: text("images").array().notNull().default([]),
  shape: text("shape").notNull(),
  length: text("length").notNull(),
  finish: text("finish").notNull().default("glossy"),
  complexity: integer("complexity").notNull().default(1),
  price: integer("price").notNull(),
  tags: text("tags").array().notNull().default([]),
  colors: text("colors").array().notNull().default([]),
  featured: boolean("featured").notNull().default(false),
  active: boolean("active").notNull().default(true),
  sort: integer("sort").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Opciones del armador (forma, largo, acabado, base, extras) con su delta de precio. */
export const builderOptions = pgTable("builder_options", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(), // shape | length | finish | base | extra
  group: text("group"),
  label: text("label").notNull(),
  description: text("description"),
  hex: text("hex"),
  delta: integer("delta").notNull().default(0),
  complexity: integer("complexity").notNull().default(0),
  active: boolean("active").notNull().default(true),
  sort: integer("sort").notNull().default(0),
});

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  seq: serial("seq").notNull(),
  number: text("number").notNull().unique(),
  token: text("token").notNull(),
  status: orderStatus("status").notNull().default("pendiente_pago"),
  customer: jsonb("customer").$type<Customer>().notNull(),
  items: jsonb("items").$type<CartItem[]>().notNull(),
  subtotal: integer("subtotal").notNull(),
  deliveryMethod: text("delivery_method").$type<DeliveryMethod>().notNull(),
  deliveryCost: integer("delivery_cost").notNull().default(0),
  deliveryLabel: text("delivery_label").notNull(),
  address: jsonb("address").$type<Address>(),
  paymentMethod: text("payment_method").$type<PaymentMethod>().notNull(),
  mpPreferenceId: text("mp_preference_id"),
  mpPaymentId: text("mp_payment_id"),
  mpInitPoint: text("mp_init_point"),
  total: integer("total").notNull(),
  needsConfirmation: boolean("needs_confirmation").notNull().default(false),
  tracking: text("tracking"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Insumos: lo que Brenda compra. El costo unitario se deriva del pack. */
export const supplies = pgTable("supplies", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  unit: text("unit").notNull(), // "u", "g", "ml", "set"
  packCost: integer("pack_cost").notNull(),
  packQty: numeric("pack_qty", { precision: 12, scale: 3 }).notNull(),
  supplier: text("supplier"),
  url: text("url"),
  notes: text("notes"),
  active: boolean("active").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Recetas de costo: qué insumos y cuánto tiempo lleva una técnica o un diseño.
 * target: "base" (set base), "extra:<id>" (técnica del armador) o "design:<slug>".
 */
export const recipes = pgTable("recipes", {
  id: uuid("id").defaultRandom().primaryKey(),
  target: text("target").notNull().unique(),
  label: text("label").notNull(),
  minutes: integer("minutes").notNull().default(0),
  usages: jsonb("usages").$type<Array<{ supplyId: string; qty: number }>>().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Configuración general, clave → JSON. */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminUsers = pgTable("admin_users", {
  email: text("email").primaryKey(),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
