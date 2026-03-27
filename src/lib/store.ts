import type { CRMItem } from "@/types/crm";

/* ============================================================
   localStorage helpers
   — used by useCRMStore for local caching and fallback only
   — DO NOT import addItem or updateItem from here in UI code
   — always go through useCRMStore for mutations
============================================================ */

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

/* ============================================================
   DB functions — called only from useCRMStore, never from UI
============================================================ */

export async function loadItemsFromDB(organizerId: string): Promise<CRMItem[]> {
  const res = await fetch(
    `/api/items?organizerId=${encodeURIComponent(organizerId)}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Failed to load items: ${res.status}`);
  const data = await res.json();
  return data.items as CRMItem[];
}

export async function createItemInDB(
  organizerId: string,
  item: CRMItem
): Promise<CRMItem> {
  const res = await fetch(`/api/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ organizerId, ...item }),
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