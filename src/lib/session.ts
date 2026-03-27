// lib/session.ts
// Returns the current user's Clerk ID from the browser cookie.
// This is used as the organizerId for all DB queries.
// On the server side, use auth() from @clerk/nextjs/server instead.

export function getOrganizerId(): string | null {
  if (typeof window === "undefined") return null;

  // Clerk stores the user id in __session cookie, but the reliable
  // client-side way is to read it from the Clerk object if loaded,
  // or fall back to parsing the __clerk_db_jwt cookie.
  // However, the cleanest approach for this codebase is to store
  // the organizerId in sessionStorage after first login (set by the
  // auth initializer in useCRMStore) and read it here.
  try {
    return sessionStorage.getItem("crm_organizer_id");
  } catch {
    return null;
  }
}

export function setOrganizerId(id: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem("crm_organizer_id", id);
  } catch {
    // ignore
  }
}