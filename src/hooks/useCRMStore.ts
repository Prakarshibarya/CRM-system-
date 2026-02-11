"use client";

import { useEffect, useMemo, useState } from "react";
import {
  loadItems,
  saveItems,
  seedIfEmpty,
  generateId,
  loadItemsFromDB,
  createItemInDB,
  updateItemInDB,
} from "@/lib/store";
import { getOrganizerId } from "@/lib/session";

import type { CRMItem, Stage, ActivityItem } from "@/types/crm";

/* =========================================
   useCRMStore (DB-backed, matches store.ts)
========================================= */

export function useCRMStore() {
  const [items, setItems] = useState<CRMItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function nowISO() {
    return new Date().toISOString();
  }

  function persist(next: CRMItem[]) {
    setItems(next);
    saveItems(next);
  }

  function withActivity(item: CRMItem, text: string): CRMItem {
    const activity: ActivityItem = { at: nowISO(), text };
    return { ...item, activity: [activity, ...(item.activity || [])] };
  }

  /* ---------- initial load (DB -> local fallback) ---------- */
  useEffect(() => {
    seedIfEmpty([]);
    const organizerId = getOrganizerId() ?? "test123";

    (async () => {
      try {
        const dbItems = await loadItemsFromDB(organizerId);
        if (Array.isArray(dbItems)) {
          persist(dbItems);
          return;
        }
        setItems(loadItems());
      } catch {
        setItems(loadItems());
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- derived ---------- */
  const selected = useMemo(
    () => items.find((i) => i.id === selectedId) || null,
    [items, selectedId]
  );

  /* ---------- CRUD ---------- */

  async function addItem(input: Omit<CRMItem, "id" | "activity">) {
    const organizerId = getOrganizerId() ?? "test123";

    const localItem: CRMItem = {
      ...input,
      id: generateId("item"),
      activity: [{ at: nowISO(), text: "Lead created" }],
    };

    // optimistic UI
    const nextLocal = [localItem, ...items];
    persist(nextLocal);
    setSelectedId(localItem.id);

    try {
      // ✅ matches: createItemInDB(organizerId, item)
      const created = await createItemInDB(organizerId, localItem);

      if (created?.id) {
        const replaced = nextLocal.map((i) => (i.id === localItem.id ? created : i));
        persist(replaced);
        setSelectedId(created.id);
        return created as CRMItem;
      }
    } catch {
      // keep local if DB fails
    }

    return localItem;
  }

 async function updateItem(updated: CRMItem, activityText?: string) {
  const finalItem = activityText ? withActivity(updated, activityText) : updated;

  // optimistic UI
  const optimistic = items.map((i) => (i.id === finalItem.id ? finalItem : i));
  persist(optimistic);

  try {
    const saved = await updateItemInDB(finalItem); // ✅ WAIT for DB
    const next = optimistic.map((i) => (i.id === saved.id ? saved : i));
    persist(next);
    return saved;
  } catch (e) {
    // keep optimistic if DB fails
    return finalItem;
  }
}


  function disableItem(itemId: string, reason: string) {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    updateItem(
      {
        ...item,
        disabled: true,
        disabledReason: reason,
        disabledAt: nowISO(),
      },
      `Lead disabled: ${reason}`
    );

    setSelectedId(null);
  }

  function moveStage(itemId: string, stage: Stage) {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    updateItem(
      { ...item, stage },
      stage === "ACTIVE" ? "Moved to Active Events" : "Moved to Onboarding"
    );
  }

  function selectItem(id: string | null) {
    setSelectedId(id);
  }

  return {
    items,
    selected,
    selectedId,
    selectItem,

    addItem,
    updateItem,
    disableItem,
    moveStage,
  };
}
