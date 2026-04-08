"use client";

import { useEffect, useState } from "react";

export type Manager = { id: string; label: string };

export function useManagers() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users/managers")
      .then((r) => r.json())
      .then((data) => setManagers(data.managers ?? []))
      .catch(() => setManagers([]))
      .finally(() => setLoading(false));
  }, []);

  return { managers, loading };
}