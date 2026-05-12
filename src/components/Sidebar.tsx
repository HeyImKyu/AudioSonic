import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useStore } from '../store';
import { Library, Book, Clock, Search, LogOut, Settings } from 'lucide-react';

export default function Sidebar() {
  const { 
    libraries, 
    currentLibrary, 
    setCurrentLibrary, 
    setLibraries, 
    sidebarView, 
    setSidebarView,
    logout,
    user 
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

  const handleViewChange = (view: string) => {
    setSidebarView(view as any);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="w-64 bg-glass-dark backdrop-blur-xl border-r border-glass-200 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-glass-200">
        <h1 className="text-xl font-bold text-white flex items-center">
          <span className="mr-2">🎧</span>
          AudioSonic
        </h1>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-2">
          <button
            onClick={() => setSidebarView('library')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition ${
              sidebarView === 'library' 
                ? 'bg-accent-primary/20 text-accent-primary' 
                : 'text-gray-400 hover:text-white hover:bg-glass-200'
            }`}
          >
            <Library className="w-5 h-5" />
            <span>Library</span>
          </button>

          <button
            onClick={() => setSidebarView('collections')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition ${
              sidebarView === 'collections' 
                ? 'bg-accent-primary/20 text-accent-primary' 
                : 'text-gray-400 hover:text-white hover:bg-glass-200'
            }`}
          >
            <Book className="w-5 h-5" />
            <span>Collections</span>
          </button>

          <button
            onClick={() => setSidebarView('playlists')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition ${
              sidebarView === 'playlists' 
                ? 'bg-accent-primary/20 text-accent-primary' 
                : 'text-gray-400 hover:text-white hover:bg-glass-200'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span>Playlists</span>
          </button>

          <button
            onClick={() => setSidebarView('search')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition ${
              sidebarView === 'search' 
                ? 'bg-accent-primary/20 text-accent-primary' 
                : 'text-gray-400 hover:text-white hover:bg-glass-200'
            }`}
          >
            <Search className="w-5 h-5" />
            <span>Search</span>
          </button>
        </nav>

        {/* Libraries List */}
        {libraries.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Libraries
            </h3>
            <div className="space-y-1">
              {libraries.map((library) => (
                <button
                  key={library.id}
                  onClick={() => handleLibrarySelect(library)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                    currentLibrary?.id === library.id
                      ? 'bg-accent-primary/20 text-accent-primary'
                      : 'text-gray-400 hover:text-white hover:bg-glass-200'
                  }`}
                >
                  {library.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User & Settings */}
      <div className="p-4 border-t border-glass-200">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-full flex items-center justify-center text-white text-sm font-bold">
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-white text-sm font-medium truncate">{user?.username}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-glass-200 rounded-lg transition">
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
