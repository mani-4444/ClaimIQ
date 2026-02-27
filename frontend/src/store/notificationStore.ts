import { create } from 'zustand';
import type { Notification } from '../types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [
    {
      id: '1',
      title: 'Claim Approved',
      message: 'Your claim #CLM-2024-001 has been approved.',
      type: 'success',
      read: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      link: '/claims/1',
    },
    {
      id: '2',
      title: 'Document Required',
      message: 'Additional documents needed for claim #CLM-2024-003.',
      type: 'warning',
      read: false,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      link: '/claims/3',
    },
    {
      id: '3',
      title: 'New Claim Assigned',
      message: 'Claim #CLM-2024-005 has been assigned to you for review.',
      type: 'info',
      read: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      link: '/claims/5',
    },
  ],
  unreadCount: 2,

  addNotification: (notification) =>
    set((state) => {
      const newNotification: Notification = {
        ...notification,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        read: false,
      };
      return {
        notifications: [newNotification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    }),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));
