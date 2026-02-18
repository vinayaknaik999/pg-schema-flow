import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UiState {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    setTheme: (theme: 'light' | 'dark') => void;
}

export const useUiStore = create<UiState>()(
    persist(
        (set) => ({
            theme: 'light',
            toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
            setTheme: (theme) => set({ theme }),
        }),
        {
            name: 'ui-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
