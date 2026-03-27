"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  loadItems,
  saveItems,
  seedIfEmpty,
  generateId,
  loadItemsFromDB,
  createItemInDB,
  updateItemInDB,
} from "@/lib/store";

import type { CRMItem, Stage, ActivityItem } from "@/types/crm";

/* =========================================
   useCRMStore (Clerk-authenticated, DB-backed)
========================================= */

export function useCRMStore() {
  const { user, isLoaded } = useUser();

  const [items, setItems] = useState<CRMItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function nowISO() {
    return new Date().toISOString();
  }

  // ✅ organizerId is always the real Clerk user id
  function getOrganizerId(): string | null {
    return user?.id ?? null;
  }

  function setItemsState(next: CRMItem[]) {
    setItems(next);
  }

  function syncLocal(next: CRMItem[]) {
    setItems(next);
    saveItems(next);
  }

  function withActivity(item: CRMItem, text: string): CRMItem {
    const activity: ActivityItem = { at: nowISO(), text };
    return { ...item, activity: [activity, ...(item.activity || [])] };
  }

  async function fetchItemsFromSource() {
    const organizerId = getOrganizerId();

    // ✅ Don't fetch until Clerk has loaded the user
    if (!isLoaded || !organizerId) {
      setLoading(false);
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      const dbItems = await loadItemsFromDB(organizerId);

      if (Array.isArray(dbItems)) {
        syncLocal(dbItems);
        return dbItems;
      }

      const local = loadItems();
      setItemsState(local);
      return local;
    } catch {
      const local = loadItems();
      setItemsState(local);
      setError("Failed to load from database. Showing local data.");
      return local;
    } finally {
      setLoading(false);
    }
  }

  // ✅ Fetch when Clerk finishes loading (not before — user id isn't ready yet)
  useEffect(() => {
    if (!isLoaded) return;
    seedIfEmpty([]);
    fetchItemsFromSource();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.id]);

  async function refreshItems() {
    return fetchItemsFromSource();
  }

  const selected = useMemo(
    () => items.find((i) => i.id === selectedId) || null,
    [items, selectedId]
  );

  async function addItem(input: Omit<CRMItem, "id" | "activity">) {
    const organizerId = getOrganizerId();
    if (!organizerId) throw new Error("Not authenticated");

    const localItem: CRMItem = {
      ...input,
      id: generateId("item"),
      activity: [{ at: nowISO(), text: "Lead created" }],
    };

    const optimistic = [localItem, ...items];
    syncLocal(optimistic);
    setSelectedId(localItem.id);

    try {
      const created = await createItemInDB(organizerId, localItem);

      if (created?.id) {
        const replaced = optimistic.map((i) =>
          i.id === localItem.id ? created : i
        );
        syncLocal(replaced);
        setSelectedId(created.id);
        return created as CRMItem;
      }
    } catch {
      // keep optimistic
    }

    return localItem;
  }

  async function updateItem(updated: CRMItem, activityText?: string) {
    const finalItem = activityText ? withActivity(updated, activityText) : updated;

    const optimistic = items.map((i) => (i.id === finalItem.id ? finalItem : i));
    syncLocal(optimistic);

    try {
      const saved = await updateItemInDB(finalItem);
      const confirmed = optimistic.map((i) => (i.id === saved.id ? saved : i));
      syncLocal(confirmed);
      return saved;
    } catch {
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
    loading,
    error,
    refreshItems,
    addItem,
    updateItem,
    disableItem,
    moveStage,
  };
}