import { create } from "zustand";

import type { CreateFormFieldInput } from "@/types";

interface FormBuilderState {
  title: string;
  description: string;
  deadline: string;
  allowLate: boolean;
  maxSubmissions: string;
  allowEdit: boolean;
  collectEmail: boolean;
  successTitle: string;
  successMessage: string;
  customMessage: string;
  fields: CreateFormFieldInput[];
  selectedFieldIndex: number | null;
  isDirty: boolean;
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setDeadline: (deadline: string) => void;
  setAllowLate: (allowLate: boolean) => void;
  setMaxSubmissions: (max: string) => void;
  setAllowEdit: (allowEdit: boolean) => void;
  setCollectEmail: (collectEmail: boolean) => void;
  setSuccessTitle: (title: string) => void;
  setSuccessMessage: (message: string) => void;
  setCustomMessage: (message: string) => void;
  addField: (field: CreateFormFieldInput) => void;
  updateField: (index: number, field: Partial<CreateFormFieldInput>) => void;
  removeField: (index: number) => void;
  moveField: (from: number, to: number) => void;
  selectField: (index: number | null) => void;
  markSaved: () => void;
  loadForm: (data: {
    title: string;
    description?: string | null;
    deadline?: Date | null;
    allowLate?: boolean;
    maxSubmissions?: number | null;
    allowEdit?: boolean;
    collectEmail?: boolean;
    successTitle?: string | null;
    successMessage?: string | null;
    customMessage?: string | null;
    fields: CreateFormFieldInput[];
  }) => void;
  reset: () => void;
}

const initialState = {
  title: "",
  description: "",
  deadline: "",
  allowLate: false,
  maxSubmissions: "",
  allowEdit: false,
  collectEmail: false,
  successTitle: "Thank you!",
  successMessage: "Your submission has been received.",
  customMessage: "",
  fields: [] as CreateFormFieldInput[],
  selectedFieldIndex: null as number | null,
  isDirty: false,
};

export const useFormBuilderStore = create<FormBuilderState>((set) => ({
  ...initialState,
  setTitle: (title) => set({ title, isDirty: true }),
  setDescription: (description) => set({ description, isDirty: true }),
  setDeadline: (deadline) => set({ deadline, isDirty: true }),
  setAllowLate: (allowLate) => set({ allowLate, isDirty: true }),
  setMaxSubmissions: (maxSubmissions) => set({ maxSubmissions, isDirty: true }),
  setAllowEdit: (allowEdit) => set({ allowEdit, isDirty: true }),
  setCollectEmail: (collectEmail) => set({ collectEmail, isDirty: true }),
  setSuccessTitle: (successTitle) => set({ successTitle, isDirty: true }),
  setSuccessMessage: (successMessage) => set({ successMessage, isDirty: true }),
  setCustomMessage: (customMessage) => set({ customMessage, isDirty: true }),
  addField: (field) =>
    set((state) => ({
      fields: [...state.fields, { ...field, order: state.fields.length }],
      isDirty: true,
    })),
  updateField: (index, field) =>
    set((state) => ({
      fields: state.fields.map((f, i) => (i === index ? { ...f, ...field } : f)),
      isDirty: true,
    })),
  removeField: (index) =>
    set((state) => ({
      fields: state.fields
        .filter((_, i) => i !== index)
        .map((f, i) => ({ ...f, order: i })),
      selectedFieldIndex: state.selectedFieldIndex === index ? null : state.selectedFieldIndex,
      isDirty: true,
    })),
  moveField: (from, to) =>
    set((state) => {
      const fields = [...state.fields];
      const [moved] = fields.splice(from, 1);
      fields.splice(to, 0, moved);
      return { fields: fields.map((f, i) => ({ ...f, order: i })), isDirty: true };
    }),
  selectField: (selectedFieldIndex) => set({ selectedFieldIndex }),
  markSaved: () => set({ isDirty: false }),
  loadForm: (data) =>
    set({
      title: data.title,
      description: data.description ?? "",
      deadline: data.deadline ? new Date(data.deadline).toISOString().slice(0, 16) : "",
      allowLate: data.allowLate ?? false,
      maxSubmissions: data.maxSubmissions?.toString() ?? "",
      allowEdit: data.allowEdit ?? false,
      collectEmail: data.collectEmail ?? false,
      successTitle: data.successTitle ?? "Thank you!",
      successMessage: data.successMessage ?? "Your submission has been received.",
      customMessage: data.customMessage ?? "",
      fields: data.fields,
      selectedFieldIndex: null,
      isDirty: false,
    }),
  reset: () => set(initialState),
}));
