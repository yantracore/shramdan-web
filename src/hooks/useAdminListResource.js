"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getJson } from "@/lib/apiClient";
import { getResponseData } from "@/lib/adminUtils";

export function useAdminListResource({
  path,
  initialFilters = {},
  extraParams,
  parseList,
  errorMessage = "Could not load data.",
  onError
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(initialFilters);

  const configRef = useRef({ extraParams, parseList, errorMessage, onError });
  useEffect(() => {
    configRef.current = { extraParams, parseList, errorMessage, onError };
  }, [extraParams, parseList, errorMessage, onError]);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError("");

    const { extraParams: currentExtra, parseList: currentParse, errorMessage: currentErrorMsg, onError: currentOnError } = configRef.current;

    try {
      const response = await getJson(path, {
        params: { ...filters, ...(currentExtra ?? {}) },
        requireAuth: true
      });
      const list = currentParse ? currentParse(response) : getResponseData(response, []);
      setItems(list);
    } catch (caughtError) {
      const message = caughtError.message || currentErrorMsg;
      setError(message);
      currentOnError?.(message);
    } finally {
      setLoading(false);
    }
  }, [path, filters]);

  useEffect(() => {
    const fetchTimer = window.setTimeout(() => {
      void refetch();
    }, 0);

    return () => {
      window.clearTimeout(fetchTimer);
    };
  }, [refetch]);

  const setFilter = useCallback((key, value) => {
    setFilters((currentFilters) => ({ ...currentFilters, [key]: value }));
  }, []);

  return { items, setItems, loading, error, filters, setFilter, refetch };
}
