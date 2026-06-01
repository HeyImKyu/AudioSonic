import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Theme {
  name: string;
  colors: {
    background: string;
    surface: string;
    surfaceHover: string;
    primary: string;
    primaryHover: string;
    accent: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    glass: string;
    glassHover: string;
  };
  glassmorphism: boolean;
}

const themes: Record<string, Theme> = {
  readit: {
    name: 'ReadIt',
    colors: {
      background: '#0a0a0a',
      surface: '#1a1a1a',
      surfaceHover: '#2a2a2a',
      primary: '#ff6b35',
      primaryHover: '#ff8557',
      accent: '#ff6b35',
      text: '#ffffff',
      textSecondary: '#b0b0b0',
      textMuted: '#808080',
      border: '#333333',
      glass: 'rgba(255, 255, 255, 0.05)',
      glassHover: 'rgba(255, 255, 255, 0.1)',
    },
    glassmorphism: true,
  },
  midnight: {
    name: 'Midnight',
    colors: {
      background: '#0f0f23',
      surface: '#1a1a2e',
      surfaceHover: '#16213e',
      primary: '#7c3aed',
      primaryHover: '#8b5cf6',
      accent: '#7c3aed',
      text: '#ffffff',
      textSecondary: '#a1a1aa',
      textMuted: '#71717a',
      border: '#27272a',
      glass: 'rgba(124, 58, 237, 0.1)',
      glassHover: 'rgba(124, 58, 237, 0.2)',
    },
    glassmorphism: true,
  },
  nordic: {
    name: 'Nordic',
    colors: {
      background: '#2e3440',
      surface: '#3b4252',
      surfaceHover: '#434c5e',
      primary: '#88c0d0',
      primaryHover: '#81a1c1',
      accent: '#88c0d0',
      text: '#eceff4',
      textSecondary: '#d8dee9',
      textMuted: '#a3be8c',
      border: '#4c566a',
      glass: 'rgba(136, 192, 208, 0.1)',
      glassHover: 'rgba(136, 192, 208, 0.2)',
    },
    glassmorphism: true,
  },
  catppuccin: {
    name: 'Catppuccin',
    colors: {
      background: '#1e1e2e',
      surface: '#302d41',
      surfaceHover: '#575268',
      primary: '#f9e2af',
      primaryHover: '#fab387',
      accent: '#f9e2af',
      text: '#cdd6f4',
      textSecondary: '#bac2de',
      textMuted: '#a6adc8',
      border: '#45475a',
      glass: 'rgba(249, 226, 175, 0.1)',
      glassHover: 'rgba(249, 226, 175, 0.2)',
    },
    glassmorphism: true,
  },
  minimal: {
    name: 'Minimal',
    colors: {
      background: '#ffffff',
      surface: '#f8f9fa',
      surfaceHover: '#e9ecef',
      primary: '#000000',
      primaryHover: '#333333',
      accent: '#000000',
      text: '#000000',
      textSecondary: '#495057',
      textMuted: '#6c757d',
      border: '#dee2e6',
      glass: 'rgba(0, 0, 0, 0.05)',
      glassHover: 'rgba(0, 0, 0, 0.1)',
    },
    glassmorphism: false,
  },
};

interface ThemeContextType {
  currentTheme: Theme;
  themeName: string;
  setTheme: (themeName: string) => void;
  availableThemes: string[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeName] = useState(() => {
    const saved = localStorage.getItem('audiosonic-theme');
    return saved || 'readit';
  });

  const currentTheme = themes[themeName] || themes.readit;

  const setTheme = (newThemeName: string) => {
    if (themes[newThemeName]) {
      setThemeName(newThemeName);
      localStorage.setItem('audiosonic-theme', newThemeName);
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    const colors = currentTheme.colors;
    
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    
    root.style.setProperty('--glass-blur', currentTheme.glassmorphism ? 'blur(10px)' : 'none');
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{
      currentTheme,
      themeName,
      setTheme,
      availableThemes: Object.keys(themes),
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
