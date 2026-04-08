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
} from "@/lib/store.client";

import type { CRMItem, Stage, ActivityItem } from "@/types/crm";
import type { SessionUser } from "@/lib/auth";

/* =========================================
   useCRMStore (session-authenticated, DB-backed)
========================================= */

export function useCRMStore() {
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const [items, setItems] = useState<CRMItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch session user on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        setSessionUser(data.user ?? null);
      })
      .catch(() => {
        setSessionUser(null);
      })
      .finally(() => {
        setIsLoaded(true);
      });
  }, []);

  function nowISO() {
    return new Date().toISOString();
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
    if (!isLoaded || !sessionUser?.id) {
      setLoading(false);
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      // ✅ loadItemsFromDB now takes no arguments — server reads userId from session
      const dbItems = await loadItemsFromDB();

      if (Array.isArray(dbItems)) {
        syncLocal(dbItems);
        return dbItems;
      }

      const local = loadItems();
      setItems(local);
      return local;
    } catch {
      const local = loadItems();
      setItems(local);
      setError("Failed to load from database. Showing local data.");
      return local;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isLoaded) return;
    seedIfEmpty([]);
    fetchItemsFromSource();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, sessionUser?.id]);

  async function refreshItems() {
    return fetchItemsFromSource();
  }

  const selected = useMemo(
    () => items.find((i) => i.id === selectedId) || null,
    [items, selectedId]
  );

  async function addItem(input: Omit<CRMItem, "id" | "activity">) {
    if (!sessionUser?.id) throw new Error("Not authenticated");

    const localItem: CRMItem = {
      ...input,
      id: generateId("item"),
      activity: [{ at: nowISO(), text: "Lead created" }],
    };

    // Optimistically add to UI immediately
    const optimistic = [localItem, ...items];
    syncLocal(optimistic);
    setSelectedId(localItem.id);

    try {
      // ✅ createItemInDB now takes just the item — no userId argument
      // The server reads userId from the session cookie
      const created = await createItemInDB(localItem);

      if (created?.id) {
        const replaced = optimistic.map((i) =>
          i.id === localItem.id ? created : i
        );
        syncLocal(replaced);
        setSelectedId(created.id);
        return created as CRMItem;
      }
    } catch (err) {
      // Log so failures are visible during debugging
      console.error("createItemInDB failed:", err);
      // Keep optimistic state — item stays visible locally
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
    sessionUser,
  };
}