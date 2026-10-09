'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

type Toast = { id: number; message: string; severity: 'success' | 'error' };
type Notify = (message: string, severity?: Toast['severity']) => void;
const ToastContext = createContext<Notify | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Toast[]>([]);
  const notify = useCallback<Notify>((message, severity = 'success') => {
    setQueue((items) => [...items, { id: Date.now() + Math.random(), message, severity }]);
  }, []);
  const current = queue[0];
  const currentId = current?.id;
  const dismiss = () => setQueue((items) => items.filter((item) => item.id !== currentId));

  useEffect(() => {
    if (currentId === undefined) return;
    const timer = window.setTimeout(() => {
      setQueue((items) => items.filter((item) => item.id !== currentId));
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [currentId]);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <Snackbar
        key={current?.id}
        open={!!current}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        onClose={(_, reason) => { if (reason !== 'clickaway') dismiss(); }}
      >
        <Alert severity={current?.severity || 'success'} variant="filled" onClose={dismiss} sx={{ width: '100%' }}>
          {current?.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const notify = useContext(ToastContext);
  if (!notify) throw new Error('useToast requires ToastProvider');
  return notify;
}
