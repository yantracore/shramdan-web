"use client";

import { Form } from "antd";
import { useCallback, useState } from "react";

export function useAdminEditModal({
  fieldName,
  getInitialValue = (item) => (item ? item[fieldName] ?? "" : ""),
  save,
  messageApi,
  successMsg,
  errorMsg
}) {
  const [form] = Form.useForm();
  const [item, setItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const openFor = useCallback(
    (nextItem) => {
      setItem(nextItem);
      form.setFieldsValue({ [fieldName]: getInitialValue(nextItem) });
    },
    [form, fieldName, getInitialValue]
  );

  const close = useCallback(() => {
    setItem(null);
    form.resetFields();
  }, [form]);

  const handleOk = useCallback(async () => {
    if (!item) return;

    try {
      const values = await form.validateFields();
      setSaving(true);
      await save(item, values);
      if (successMsg) messageApi.success(successMsg);
      setItem(null);
      form.resetFields();
    } catch (error) {
      if (error?.errorFields) return;
      messageApi.error(error?.message || errorMsg);
    } finally {
      setSaving(false);
    }
  }, [item, form, save, successMsg, errorMsg, messageApi]);

  return { form, item, open: Boolean(item), openFor, close, saving, handleOk };
}
