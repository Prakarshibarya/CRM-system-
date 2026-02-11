const ORG_KEY = "ha_organizer_id_v1";

export function getOrganizerId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ORG_KEY);
}

export function setOrganizerId(id: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("ha_organizer_id_v1", "test123");
}
