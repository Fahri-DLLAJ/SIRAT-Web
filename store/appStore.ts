import { create } from "zustand";

export interface StatusHistoryEntry {
  status: "pending" | "active" | "resolved";
  note: string;
  timestamp: string;
}

export interface Report {
  id: string;
  type: string;
  location: string;
  lat: number;
  lng: number;
  severity: "low" | "medium" | "high" | "critical";
  status: "pending" | "active" | "resolved";
  description: string;
  timestamp: string;
  imageUrl?: string;
  name?: string;
  phone?: string;
  hidden?: boolean;
  statusHistory?: StatusHistoryEntry[];
  notes?: string[];
  response?: string;
}

export interface Device {
  id: string;
  name: string;
  type: "camera" | "lamp" | "sensor" | "traffic-light";
  lat: number;
  lng: number;
  status: "active" | "offline" | "pending";
  ip?: string;
  streamPort?: number;  // port MJPEG stream ESP32-CAM (default 81)
  aiPort?: number;      // port Python AI vision server (default 5000)
  lastSeen: string;
  description?: string;
}

interface AppState {
  reports: Report[];
  devices: Device[];
  setReports: (reports: Report[]) => void;
  setDevices: (devices: Device[]) => void;

  notifications: { id: string; message: string; read: boolean }[];
  addNotification: (message: string) => void;
  markAllRead: () => void;

  activeCameraIp: string | null;
  showProcessedStream: boolean;
  setActiveCameraIp: (ip: string | null) => void;
  setShowProcessedStream: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  reports: [],
  devices: [],
  setReports: (reports) => set({ reports }),
  setDevices: (devices) => set({ devices }),

  notifications: [],
  addNotification: (message) =>
    set((s) => ({
      notifications: [
        { id: Date.now().toString(), message, read: false },
        ...s.notifications,
      ],
    })),
  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    })),

  activeCameraIp: null,
  showProcessedStream: false,
  setActiveCameraIp: (activeCameraIp) => set({ activeCameraIp }),
  setShowProcessedStream: (showProcessedStream) => set({ showProcessedStream }),
}));
