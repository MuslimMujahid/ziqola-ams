import { createFormHook, createFormHookContexts } from "@tanstack/react-form";

import {
  PasswordField,
  Select,
  SubmitButton,
  TextArea,
  TextField,
} from "@/components/forms";

export const { fieldContext, useFieldContext, formContext, useFormContext } =
  createFormHookContexts();

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldComponents: {
    PasswordField,
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
