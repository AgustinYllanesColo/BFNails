import "server-only";
import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { orders as ordersTable } from "@/lib/db/schema";
import type { Order, OrderStatus } from "@/lib/types";

/**
 * Repositorio de pedidos. Con DATABASE_URL usa Postgres. Sin DB, SOLO en
 * desarrollo local, guarda en .data/orders.json para probar el flujo. En
 * producción sin base de datos los pedidos están deshabilitados: nunca se
 * acepta un pedido que no quede guardado en un lugar persistente.
 */
export function ordersEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL) || process.env.NODE_ENV === "development";
}

export class OrdersDisabledError extends Error {
  constructor() {
    super("Los pedidos están deshabilitados hasta conectar la base de datos.");
  }
}

function assertOrdersEnabled() {
  if (!ordersEnabled()) throw new OrdersDisabledError();
}

const LOCAL_FILE = path.join(process.cwd(), ".data", "orders.json");

async function readLocal(): Promise<Order[]> {
  try {
    return JSON.parse(await fs.readFile(LOCAL_FILE, "utf8")) as Order[];
  } catch {
    return [];
  }
}
async function writeLocal(list: Order[]) {
  await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true });
  await fs.writeFile(LOCAL_FILE, JSON.stringify(list, null, 2));
}

function rowToOrder(r: typeof ordersTable.$inferSelect): Order {
  return {
    id: r.id,
    number: r.number,
    token: r.token,
    status: r.status,
    customer: r.customer,
    items: r.items,
    subtotal: r.subtotal,
    delivery: { method: r.deliveryMethod, cost: r.deliveryCost, label: r.deliveryLabel, address: r.address ?? undefined },
    payment: {
      method: r.paymentMethod,
      mpPreferenceId: r.mpPreferenceId ?? undefined,
      mpPaymentId: r.mpPaymentId ?? undefined,
      mpInitPoint: r.mpInitPoint ?? undefined,
    },
    total: r.total,
    needsConfirmation: r.needsConfirmation,
    tracking: r.tracking ?? undefined,
    notes: r.notes ?? undefined,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export function newToken() {
  return randomBytes(12).toString("base64url");
}

export function formatOrderNumber(seq: number) {
  return `BF-${String(seq).padStart(4, "0")}`;
}

export type NewOrder = Omit<Order, "id" | "number" | "createdAt" | "updatedAt">;

export async function createOrder(input: NewOrder): Promise<Order> {
  assertOrdersEnabled();
  const db = getDb();
  const now = new Date();
  if (!db) {
    const list = await readLocal();
    const seq = list.length + 1;
    const order: Order = {
      ...input,
      id: randomBytes(8).toString("hex"),
      number: formatOrderNumber(seq),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    list.push(order);
    await writeLocal(list);
    return order;
  }
  // En Postgres el número sale del serial: insertamos con un placeholder y actualizamos.
  const placeholder = `tmp-${randomBytes(6).toString("hex")}`;
  const [row] = await db
    .insert(ordersTable)
    .values({
      number: placeholder,
      token: input.token,
      status: input.status,
      customer: input.customer,
      items: input.items,
      subtotal: input.subtotal,
      deliveryMethod: input.delivery.method,
      deliveryCost: input.delivery.cost,
      deliveryLabel: input.delivery.label,
      address: input.delivery.address,
      paymentMethod: input.payment.method,
      mpPreferenceId: input.payment.mpPreferenceId,
      mpPaymentId: input.payment.mpPaymentId,
      mpInitPoint: input.payment.mpInitPoint,
      total: input.total,
      needsConfirmation: input.needsConfirmation,
      notes: input.notes,
    })
    .returning();
  const number = formatOrderNumber(row.seq);
  const [updated] = await db.update(ordersTable).set({ number }).where(eq(ordersTable.id, row.id)).returning();
  return rowToOrder(updated);
}

export async function updateOrder(id: string, patch: Partial<Omit<Order, "id" | "number" | "createdAt">>): Promise<Order | null> {
  assertOrdersEnabled();
  const db = getDb();
  if (!db) {
    const list = await readLocal();
    const i = list.findIndex((o) => o.id === id);
    if (i < 0) return null;
    list[i] = { ...list[i], ...patch, updatedAt: new Date().toISOString() };
    await writeLocal(list);
    return list[i];
  }
  const set: Partial<typeof ordersTable.$inferInsert> = { updatedAt: new Date() };
  if (patch.status) set.status = patch.status;
  if (patch.customer) set.customer = patch.customer;
  if (patch.items) set.items = patch.items;
  if (patch.subtotal != null) set.subtotal = patch.subtotal;
  if (patch.total != null) set.total = patch.total;
  if (patch.needsConfirmation != null) set.needsConfirmation = patch.needsConfirmation;
  if (patch.tracking !== undefined) set.tracking = patch.tracking;
  if (patch.notes !== undefined) set.notes = patch.notes;
  if (patch.delivery) {
    set.deliveryMethod = patch.delivery.method;
    set.deliveryCost = patch.delivery.cost;
    set.deliveryLabel = patch.delivery.label;
    set.address = patch.delivery.address;
  }
  if (patch.payment) {
    set.paymentMethod = patch.payment.method;
    set.mpPreferenceId = patch.payment.mpPreferenceId;
    set.mpPaymentId = patch.payment.mpPaymentId;
    set.mpInitPoint = patch.payment.mpInitPoint;
  }
  const [row] = await db.update(ordersTable).set(set).where(eq(ordersTable.id, id)).returning();
  return row ? rowToOrder(row) : null;
}

export async function getOrderById(id: string): Promise<Order | null> {
  const db = getDb();
  if (!db && !ordersEnabled()) return null;
  if (!db) return (await readLocal()).find((o) => o.id === id) ?? null;
  const [row] = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
  return row ? rowToOrder(row) : null;
}

export async function getOrderByNumber(number: string): Promise<Order | null> {
  const db = getDb();
  if (!db && !ordersEnabled()) return null;
  if (!db) return (await readLocal()).find((o) => o.number === number) ?? null;
  const [row] = await db.select().from(ordersTable).where(eq(ordersTable.number, number)).limit(1);
  return row ? rowToOrder(row) : null;
}

export async function listOrders(opts: { status?: OrderStatus; limit?: number } = {}): Promise<Order[]> {
  const db = getDb();
  if (!db && !ordersEnabled()) return [];
  if (!db) {
    const list = (await readLocal()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return (opts.status ? list.filter((o) => o.status === opts.status) : list).slice(0, opts.limit ?? 200);
  }
  const q = db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)).limit(opts.limit ?? 200);
  const rows = opts.status ? await q.where(eq(ordersTable.status, opts.status)) : await q;
  return rows.map(rowToOrder);
}

export function publicOrderUrl(order: Order, base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000") {
  return `${base}/pedido/${order.number}?t=${order.token}`;
}
