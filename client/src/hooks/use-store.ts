import { create } from 'zustand';

interface AppState {
  activeTab: 'discover' | 'chat' | 'store' | 'profile';
  setActiveTab: (tab: 'discover' | 'chat' | 'store' | 'profile') => void;
  showVipModal: boolean;
  setShowVipModal: (show: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  activeTab: 'discover',
  setActiveTab: (tab) => set({ activeTab: tab }),
  showVipModal: false,
  setShowVipModal: (show) => set({ showVipModal: show }),
}));
