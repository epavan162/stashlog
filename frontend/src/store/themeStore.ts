import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') return getSystemTheme();
  return theme;
}

function applyTheme(resolved: 'light' | 'dark') {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(resolved);
}

const storedTheme = (typeof window !== 'undefined'
  ? localStorage.getItem('stashlog-theme') as Theme
  : null) || 'system';

const initialResolved = resolveTheme(storedTheme);
if (typeof window !== 'undefined') {
  applyTheme(initialResolved);
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: storedTheme,
  resolvedTheme: initialResolved,
  setTheme: (theme) => {
    const resolved = resolveTheme(theme);
    localStorage.setItem('stashlog-theme', theme);
    applyTheme(resolved);
    set({ theme, resolvedTheme: resolved });
  },
  toggleTheme: () => {
    set((state) => {
      const newTheme: 'light' | 'dark' = state.resolvedTheme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('stashlog-theme', newTheme);
      applyTheme(newTheme);
      return { theme: newTheme, resolvedTheme: newTheme };
    });
  },
}));

// Listen for system theme changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const state = useThemeStore.getState();
    if (state.theme === 'system') {
      const resolved = getSystemTheme();
      applyTheme(resolved);
      useThemeStore.setState({ resolvedTheme: resolved });
    }
  });
}
