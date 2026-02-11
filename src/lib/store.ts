export type Stage = "ONBOARDING" | "ACTIVE";

export type CRMItem = {
  id: string;
  title: string;
  platform: string;
  eventType: string;
  manager: string;

  stage: Stage;

  // ✅ optional lead/event details
  orgName?: string;
  eventName?: string;
  city?: string;
  venue?: string;
  eventLink?: string;

  disabled?: boolean;
  disabledReason?: string;
  disabledAt?: string;

  onboarding: Record<string, any>;
  active: Record<string, any>;

  activity: { at: string; text: string }[];
};



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
export function addItem(item: CRMItem) {
  const items = loadItems();
  const next = [item, ...items];
  saveItems(next);
  return next;
}

export function updateItem(updated: CRMItem) {
  const items = loadItems();
  const next = items.map((i) => (i.id === updated.id ? updated : i));
  saveItems(next);
  return next;
}

export function generateId(prefix = "item") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}
// export async function loadItemsFromDB(organizerId: string): Promise<CRMItem[]> {
//   const res = await fetch(`/api/items?organizerId=${encodeURIComponent(organizerId)}`, {
//     cache: "no-store",
//   });
//   if (!res.ok) throw new Error(`Failed to load items: ${res.status}`);
//   const data = await res.json();
//   return data.items as CRMItem[];
// }

// export async function createItemInDB(item: CRMItem, organizerId: string) {
//   const res = await fetch(`/api/items`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ ...item, organizerId }),
//   });
//   if (!res.ok) throw new Error(`Failed to create item: ${res.status}`);
//   const data = await res.json();
//   return data.item as CRMItem;
// }

// export async function updateItemInDB(item: CRMItem) {
//   const res = await fetch(`/api/items/${item.id}`, {
//     method: "PATCH",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(item),
//   });
//   if (!res.ok) throw new Error(`Failed to update item: ${res.status}`);
//   const data = await res.json();
//   return data.item as CRMItem;
// }
export async function loadItemsFromDB(organizerId: string): Promise<CRMItem[]> {
  const res = await fetch(`/api/items?organizerId=${encodeURIComponent(organizerId)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to load items: ${res.status}`);
  const data = await res.json();
  return data.items as CRMItem[];
}

export async function createItemInDB(organizerId: string, item: CRMItem): Promise<CRMItem> {
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

export async function deleteItemInDB(id: string) {
  const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete item: ${res.status}`);
}
