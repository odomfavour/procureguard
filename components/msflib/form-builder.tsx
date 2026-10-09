'use client';
import dynamic from 'next/dynamic';
import { Loading } from '@/components/ui/shared';
// The installed FormBuilder reads window.innerWidth during render.
// Load its documented subpath on the client to keep Next SSR safe.
const FormBuilder = dynamic(
  () => import('@msflib/react-components/formbuilder'),
  { ssr: false, loading: Loading }
);
export default FormBuilder;
export type {
  FormElement,
  LayoutProps,
} from '@msflib/react-components/formbuilder';
