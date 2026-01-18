import { createFormHook, createFormHookContexts } from "@tanstack/react-form";

import {
  DateField,
  PasswordField,
  Select,
  SubmitButton,
  TextArea,
  TextField,
  Switch,
} from "@/components/forms";

export const { fieldContext, useFieldContext, formContext, useFormContext } =
  createFormHookContexts();

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldComponents: {
    DateField,
    PasswordField,
    TextField,
    Select,
    TextArea,
    Switch,
  },
  formComponents: {
    SubmitButton,
  },
  fieldContext,
  formContext,
});
