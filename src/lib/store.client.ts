/**
 * store.client.ts — browser-only helpers
 *
 * ONLY import this from client components ("use client") or hooks.
 * Never import this from a server route or server component.
 *
 * For server-side DB access use store.server.ts instead.
 */

import type { CRMItem } from "@/types/crm";

const KEY = "ha_crm_items_v1";

export function loadItems(): CRMItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CRMItem[]) : [];
  } catch {
    return [];
  }
}

export function saveItems(items: CRMItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function seedIfEmpty(seed: CRMItem[]) {
  const items = loadItems();
  if (items.length === 0) saveItems(seed);
}

export function generateId(prefix = "item") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

// ─── API mutation helpers (called from client hooks only) ───────────────────

export async function loadItemsFromDB(): Promise<CRMItem[]> {
  const res = await fetch(`/api/items`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load items: ${res.status}`);
  const data = await res.json();
  return data.items as CRMItem[];
}

export async function createItemInDB(item: CRMItem): Promise<CRMItem> {
  const res = await fetch(`/api/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error(`Failed to create item: ${res.status}`);
  const data = await res.json();
  return data.item as CRMItem;
}

export async function updateItemInDB(item: CRMItem): Promise<CRMItem> {
  const res = await fetch(`/api/items/${item.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error(`Failed to update item: ${res.status}`);
  const data = await res.json();
  return data.item as CRMItem;
}

export async function deleteItemInDB(id: string): Promise<void> {
  const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete item: ${res.status}`);
}