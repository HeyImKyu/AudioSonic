import { useTheme } from '../contexts/ThemeContext';
import { Palette, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function ThemeSelector() {
  const { currentTheme, themeName, setTheme, availableThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themeIcons: Record<string, string> = {
    readit: '🎧',
    midnight: '🌙',
    nordic: '❄️',
    catppuccin: '🐱',
    minimal: '⚪',
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-surface hover:bg-surface-hover rounded-lg border border-border transition"
      >
        <Palette className="w-4 h-4 text-text-secondary" />
        <span className="text-sm text-text">
          {themeIcons[themeName]} {currentTheme.name}
        </span>
        <ChevronDown className={`w-4 h-4 text-text-secondary transition-transform ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-lg shadow-glass z-20">
            <div className="p-2">
              {availableThemes.map((theme) => {
                const themeData = {
                  readit: { name: 'ReadIt', icon: '🎧', desc: 'Dark with orange accents' },
                  midnight: { name: 'Midnight', icon: '🌙', desc: 'Deep purple night theme' },
                  nordic: { name: 'Nordic', icon: '❄️', desc: 'Cool blue tones' },
                  catppuccin: { name: 'Catppuccin', icon: '🐱', desc: 'Warm pastel colors' },
                  minimal: { name: 'Minimal', icon: '⚪', desc: 'Clean light theme' },
                };
                
                const info = themeData[theme as keyof typeof themeData];
                
                return (
                  <button
                    key={theme}
                    onClick={() => {
                      setTheme(theme);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 p-2 rounded-lg transition ${
                      themeName === theme 
                        ? 'bg-primary/20 border border-primary/30' 
                        : 'hover:bg-surface-hover'
                    }`}
                  >
                    <span className="text-lg">{info.icon}</span>
                    <div className="flex-1 text-left">
                      <p className={`text-sm font-medium ${
                        themeName === theme ? 'text-primary' : 'text-text'
                      }`}>
                        {info.name}
                      </p>
                      <p className="text-xs text-text-secondary">{info.desc}</p>
                    </div>
                    {themeName === theme && (
                      <div className="w-2 h-2 bg-primary rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
