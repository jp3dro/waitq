'use client';

import { toast } from 'sonner';

export const toastManager = {
  add: ({ title, description, type }: { title: string; description: string; type: 'success' | 'error' | 'info' | 'warning' | 'default' }) => {
    switch (type) {
      case 'success':
        toast.success(title, { description });
        break;
      case 'error':
        toast.error(title, { description });
        break;
      case 'warning':
        toast.warning(title, { description });
        break;
      case 'info':
        toast.info(title, { description });
        break;
      default:
        toast(title, { description });
    }
  }
};

export const useToast = () => {
  return {
    add: toastManager.add
  };
};
