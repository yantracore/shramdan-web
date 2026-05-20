"use client";

import { useCallback, useState } from "react";
import { deleteJson, patchJson } from "@/lib/apiClient";
import { getResponseData } from "@/lib/adminUtils";

export function useAdminItemMutation({ messageApi, setItems }) {
  const [updatingId, setUpdatingId] = useState("");

  const patchStatus = useCallback(
    async ({ path, item, body, successMsg, errorMsg }) => {
      setUpdatingId(item.id);

      try {
        const response = await patchJson(path, body, { requireAuth: true });
        const updated = getResponseData(response, item);
        setItems((current) => current.map((entry) => (entry.id === item.id ? updated : entry)));
        if (successMsg) messageApi.success(successMsg);
        return updated;
      } catch (error) {
        messageApi.error(error.message || errorMsg);
        throw error;
      } finally {
        setUpdatingId("");
      }
    },
    [messageApi, setItems]
  );

  const patchField = useCallback(
    async ({ path, item, body, successMsg, errorMsg }) => {
      setUpdatingId(item.id);

      try {
        const response = await patchJson(path, body, { requireAuth: true });
        const updated = getResponseData(response, item);
        setItems((current) => current.map((entry) => (entry.id === item.id ? updated : entry)));
        if (successMsg) messageApi.success(successMsg);
        return updated;
      } catch (error) {
        messageApi.error(error.message || errorMsg);
        throw error;
      } finally {
        setUpdatingId("");
      }
    },
    [messageApi, setItems]
  );

  const deleteItem = useCallback(
    async ({ path, item, successMsg, errorMsg }) => {
      setUpdatingId(item.id);

      try {
        await deleteJson(path, { requireAuth: true });
        setItems((current) => current.filter((entry) => entry.id !== item.id));
        if (successMsg) messageApi.success(successMsg);
      } catch (error) {
        messageApi.error(error.message || errorMsg);
        throw error;
      } finally {
        setUpdatingId("");
      }
    },
    [messageApi, setItems]
  );

  return { updatingId, patchStatus, patchField, deleteItem };
}
