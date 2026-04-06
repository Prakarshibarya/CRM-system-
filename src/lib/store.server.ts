/**
 * store.server.ts — server-only DB helpers
 *
 * ONLY import this from API routes and server components.
 * Never import this from a client component or "use client" file.
 *
 * These functions access the DB via Prisma directly and rely on
 * the session being validated by the calling route before use.
 */

import { prisma } from "@/lib/prisma";
import type { CRMItem } from "@/types/crm";
import { generateId } from "@/lib/store.client";

export async function loadItemsFromDB(userId: string): Promise<CRMItem[]> {
  const rows = await prisma.crmItem.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  return rows as unknown as CRMItem[];
}

export async function createItemInDB(
  userId: string,
  item: CRMItem
): Promise<CRMItem> {
  const row = await prisma.crmItem.create({
    data: {
      id: item.id ?? generateId("item"),
      userId,
      title: item.title,
      platform: item.platform,
      eventType: item.eventType,
      manager: item.manager,
      stage: item.stage ?? "ONBOARDING",
      orgName: item.orgName ?? "",
      eventName: item.eventName ?? null,
      city: item.city ?? null,
      venue: item.venue ?? null,
      eventLink: item.eventLink ?? null,
      onboarding: item.onboarding as object,
      active: item.active as object,
      activity: item.activity as object,
    },
  });
  return row as unknown as CRMItem;
}

export async function updateItemInDB(
  userId: string,
  item: CRMItem
): Promise<CRMItem> {
  // ✅ Scope update to userId so users cannot overwrite each other's records
  const row = await prisma.crmItem.update({
    where: { id: item.id, userId },
    data: {
      title: item.title,
      platform: item.platform,
      eventType: item.eventType,
      manager: item.manager,
      stage: item.stage,
      orgName: item.orgName,
      eventName: item.eventName,
      city: item.city,
      venue: item.venue,
      onboarding: item.onboarding as object,
      active: item.active as object,
      activity: item.activity as object,
      disabled: item.disabled,
      disabledReason: item.disabledReason ?? null,
      disabledAt: item.disabledAt ? new Date(item.disabledAt) : null,
    },
  });
  return row as unknown as CRMItem;
}

export async function deleteItemInDB(
  userId: string,
  id: string
): Promise<void> {
  // ✅ Scope delete to userId
  await prisma.crmItem.delete({ where: { id, userId } });
}