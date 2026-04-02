"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type User = {
  id: string;
  name: string | null;
  email: string;
  status: string;
  role: string;
  createdAt: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data.users);
    } catch {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function handleAction(
    userId: string,
    action: "approve" | "reject" | "make_admin"
  ) {
    setActionLoading(userId + action);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Action failed");
      await fetchUsers();
    } catch {
      setError("Action failed. Please try again.");
    } finally {
      setActionLoading(null);
    }
  }

  const pending = users.filter((u) => u.status === "pending");
  const approved = users.filter((u) => u.status === "approved");
  const rejected = users.filter((u) => u.status === "rejected");

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
          <div className="text-lg font-semibold">Admin — User Management</div>
          <div className="ml-auto">
            <Link
              href="/onboarding"
              className="rounded-full bg-white/5 px-3 py-2 text-xs text-white/50 hover:bg-white/10"
            >
              ← Back to CRM
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-6 space-y-8">
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
            ))}
          </div>
        ) : (
          <>
            {/* Pending */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <div className="text-sm font-semibold text-white/70">PENDING APPROVAL</div>
                <div className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300">
                  {pending.length}
                </div>
              </div>

              {pending.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/40">
                  No pending requests.
                </div>
              ) : (
                <div className="space-y-3">
                  {pending.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <div>
                        <div className="font-medium">{u.name || "—"}</div>
                        <div className="text-sm text-white/50">{u.email}</div>
                        <div className="text-xs text-white/30 mt-0.5">
                          Requested {new Date(u.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={!!actionLoading}
                          onClick={() => handleAction(u.id, "approve")}
                          className="rounded-xl bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-40"
                        >
                          {actionLoading === u.id + "approve" ? "..." : "Approve"}
                        </button>
                        <button
                          type="button"
                          disabled={!!actionLoading}
                          onClick={() => handleAction(u.id, "reject")}
                          className="rounded-xl bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/30 disabled:opacity-40"
                        >
                          {actionLoading === u.id + "reject" ? "..." : "Reject"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Approved */}
            <div>
              <div className="mb-3 text-sm font-semibold text-white/70">
                APPROVED USERS ({approved.length})
              </div>
              <div className="space-y-3">
                {approved.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{u.name || "—"}</span>
                        {u.role === "admin" && (
                          <span className="rounded-full bg-fuchsia-500/20 px-2 py-0.5 text-xs text-fuchsia-300">
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-white/50">{u.email}</div>
                    </div>
                    {u.role !== "admin" && (
                      <button
                        type="button"
                        disabled={!!actionLoading}
                        onClick={() => handleAction(u.id, "make_admin")}
                        className="rounded-xl bg-white/5 px-3 py-1.5 text-xs text-white/50 hover:bg-white/10 disabled:opacity-40"
                      >
                        {actionLoading === u.id + "make_admin" ? "..." : "Make Admin"}
                      </button>
                    )}
                  </div>
                ))}
                {approved.length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/40">
                    No approved users yet.
                  </div>
                )}
              </div>
            </div>

            {/* Rejected */}
            {rejected.length > 0 && (
              <div>
                <div className="mb-3 text-sm font-semibold text-white/70">
                  REJECTED ({rejected.length})
                </div>
                <div className="space-y-3">
                  {rejected.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 opacity-50"
                    >
                      <div>
                        <div className="font-medium">{u.name || "—"}</div>
                        <div className="text-sm text-white/50">{u.email}</div>
                      </div>
                      <button
                        type="button"
                        disabled={!!actionLoading}
                        onClick={() => handleAction(u.id, "approve")}
                        className="rounded-xl bg-white/5 px-3 py-1.5 text-xs text-white/50 hover:bg-white/10 disabled:opacity-40"
                      >
                        Re-approve
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}