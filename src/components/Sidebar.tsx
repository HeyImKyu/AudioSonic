import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useStore } from '../store';
import { Library, Book, Search, Heart } from 'lucide-react';

export default function Sidebar() {
  const { 
    libraries, 
    currentLibrary, 
    setCurrentLibrary, 
    setLibraries, 
    sidebarView, 
    setSidebarView
  } = useStore();

  useEffect(() => {
    loadLibraries();
  }, []);

  useEffect(() => {
    if (libraries.length > 0 && !currentLibrary) {
      setCurrentLibrary(libraries[0]);
    }
  }, [libraries, currentLibrary, setCurrentLibrary]);

  const loadLibraries = async () => {
    try {
      const libs = await invoke('get_libraries');
      setLibraries(libs as any[]);
    } catch (error) {
      console.error('Failed to load libraries:', error);
    }
  };

  const handleLibrarySelect = (library: any) => {
    setCurrentLibrary(library);
    setSidebarView('library');
  };

  
  
  return (
    <div className="w-64 bg-surface border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-text flex items-center">
          <span className="mr-3 text-3xl">🎧</span>
          AudioSonic
        </h1>
        <p className="text-text-secondary text-sm mt-1">Audiobook Player</p>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          {/* Main Navigation */}
          <div>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              Main
            </h3>
            <nav className="space-y-1">
              <button
                onClick={() => setSidebarView('library')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition ${
                  sidebarView === 'library' 
                    ? 'bg-primary/20 text-primary border border-primary/30' 
                    : 'text-text-secondary hover:text-text hover:bg-surface-hover'
                }`}
              >
                <Library className="w-5 h-5" />
                <span className="font-medium">Library</span>
              </button>

              <button
                onClick={() => setSidebarView('collections')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition ${
                  sidebarView === 'collections' 
                    ? 'bg-primary/20 text-primary border border-primary/30' 
                    : 'text-text-secondary hover:text-text hover:bg-surface-hover'
                }`}
              >
                <Book className="w-5 h-5" />
                <span className="font-medium">Collections</span>
              </button>

              <button
                onClick={() => setSidebarView('playlists')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition ${
                  sidebarView === 'playlists' 
                    ? 'bg-primary/20 text-primary border border-primary/30' 
                    : 'text-text-secondary hover:text-text hover:bg-surface-hover'
                }`}
              >
                <Heart className="w-5 h-5" />
                <span className="font-medium">Playlists</span>
              </button>

              <button
                onClick={() => setSidebarView('search')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition ${
                  sidebarView === 'search' 
                    ? 'bg-primary/20 text-primary border border-primary/30' 
                    : 'text-text-secondary hover:text-text hover:bg-surface-hover'
                }`}
              >
                <Search className="w-5 h-5" />
                <span className="font-medium">Search</span>
              </button>
            </nav>
          </div>

          {/* Libraries List */}
          {libraries.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                Libraries
              </h3>
              <div className="space-y-1">
                {libraries.map((library) => (
                  <button
                    key={library.id}
                    onClick={() => handleLibrarySelect(library)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                      currentLibrary?.id === library.id
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'text-text-secondary hover:text-text hover:bg-surface-hover'
                    }`}
                  >
                    {library.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
