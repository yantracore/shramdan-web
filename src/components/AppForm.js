"use client";

import { Form as AntForm } from "antd";
import { forwardRef } from "react";

const DEFAULT_SCROLL_OPTIONS = {
  behavior: "smooth",
  block: "center",
  inline: "nearest"
};

const AppForm = forwardRef(function AppForm(
  { scrollToFirstError = DEFAULT_SCROLL_OPTIONS, ...rest },
  ref
) {
  return <AntForm ref={ref} scrollToFirstError={scrollToFirstError} {...rest} />;
});

AppForm.Item = AntForm.Item;
AppForm.List = AntForm.List;
AppForm.Provider = AntForm.Provider;
AppForm.ErrorList = AntForm.ErrorList;
AppForm.useForm = AntForm.useForm;
AppForm.useWatch = AntForm.useWatch;
AppForm.useFormInstance = AntForm.useFormInstance;

export { AppForm as Form };
export default AppForm;
