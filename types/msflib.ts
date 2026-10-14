import type { ComponentType, Dispatch, SetStateAction } from 'react';

export type FormElement = {
  id: string;
  name: string;
  width?: number;
  mData?: {
    width?: number;
  };
};

export type FormFieldProps = {
  element: FormElement;
  formData: Record<string, unknown>;
  setFormData: Dispatch<SetStateAction<Record<string, unknown>>>;
  isMobile: boolean;
  loading: boolean;
};

export type GridFormLayoutProps = Omit<FormFieldProps, 'element'> & {
  FormField: ComponentType<FormFieldProps>;
  elements: FormElement[];
};
