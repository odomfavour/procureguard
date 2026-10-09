import type { FormElement } from '@msflib/react-components/formbuilder';
export function field(
  name: string,
  label: string,
  eType = 'text',
  required = true
): FormElement {
  return {
    id: name,
    name,
    label,
    dType: 'string',
    eType,
    validation: required ? { required: `${label} is required` } : undefined,
    mData: { isCustomLabel: true, required },
  };
}
export function submit(label: string): FormElement {
  return {
    id: 'submit',
    name: 'submit',
    label,
    dType: 'submit',
    eType: 'button',
    mData: { variant: 'contained' },
  };
}
