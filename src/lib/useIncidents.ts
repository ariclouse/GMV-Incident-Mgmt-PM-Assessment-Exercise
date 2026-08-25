"use client";

import { useCallback, useEffect, useState } from "react";
import { Incident, MetaOptions } from "./types";
import { apiFetch } from "./apiClient";

export function useIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ incidents: Incident[] }>("/api/incidents");
      setIncidents(data.incidents);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load incidents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount for this prototype's lightweight data layer
    refresh();
  }, [refresh]);

  return { incidents, loading, error, refresh, setIncidents };
}

export function useMeta() {
  const [meta, setMeta] = useState<MetaOptions | null>(null);

  useEffect(() => {
    apiFetch<MetaOptions>("/api/meta")
      .then(setMeta)
      .catch((err) => console.error("Failed to load meta options:", err));
  }, []);

  return meta;
}
