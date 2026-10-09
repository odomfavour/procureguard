import type { ComponentProps, ComponentType } from 'react';

type FormElement = {
  id: string;
  name: string;
  width?: number;
  mData?: {
    width?: number;
  };
};

type GridFormLayoutProps = {
  FormField: ComponentType<any>;
  elements: FormElement[];
  formData: Record<string, unknown>;
  setFormData: ComponentProps<any>['setFormData'];
  isMobile: boolean;
  loading: boolean;
};

export function GridFormLayout({
  FormField,
  elements,
  formData,
  setFormData,
  isMobile,
  loading,
}: GridFormLayoutProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
      {elements.map((element) => {
        const width = element.mData?.width ?? element.width ?? 100;

        const colSpan =
          width >= 100
            ? 'md:col-span-6'
            : width >= 50
              ? 'md:col-span-3'
              : width >= 33
                ? 'md:col-span-2'
                : 'md:col-span-2';

        return (
          <div key={element.id} className={`min-w-0 w-full ${colSpan}`}>
            <FormField
              element={element}
              formData={formData}
              setFormData={setFormData}
              isMobile={isMobile}
              loading={loading}
            />
          </div>
        );
      })}
    </div>
  );
}
