"use client";

import { useEffect, useState } from "react";

export function useManagers() {
  const [managers, setManagers] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/auth/managers")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.managers)) setManagers(d.managers);
      })
      .catch(() => setManagers([]));
  }, []);

  return { managers };
}