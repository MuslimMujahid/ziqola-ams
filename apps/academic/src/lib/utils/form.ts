import { createFormHook, createFormHookContexts } from "@tanstack/react-form";

import { Select, SubmitButton, TextArea, TextField } from "@/components/forms";

export const { fieldContext, useFieldContext, formContext, useFormContext } =
  createFormHookContexts();

export const { useAppForm } = createFormHook({
  fieldComponents: {
    TextField,
    Select,
    TextArea,
  },
  formComponents: {
    SubmitButton,
  },
  fieldContext,
  formContext,
});
