export type LeadStatus = "NEW" | "CONTACTED" | "NEGOTIATING" | "WON" | "LOST";

export type Lead = {
  id: string;
  organizerId: string;
  title: string;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  status: LeadStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function fetchLeads(organizerId: string) {
  const res = await fetch(`/api/leads?organizerId=${encodeURIComponent(organizerId)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch leads: ${res.status}`);
  return (await res.json()) as { leads: Lead[] };
}

export async function createLead(payload: { organizerId: string; title: string }) {
  const res = await fetch(`/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to create lead: ${res.status}`);
  return (await res.json()) as { lead: Lead };
}

export async function updateLead(id: string, patch: Partial<Pick<Lead, "title" | "status" | "notes">>) {
  const res = await fetch(`/api/leads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`Failed to update lead: ${res.status}`);
  return (await res.json()) as { lead: Lead };
}
