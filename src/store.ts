import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';
import { Library, LibraryItem, MediaProgress, User, PlayResponse, Collection, Chapter, AudioTrack } from './types';

interface AudioSonicState {
  // Auth & Server
  serverUrl: string;
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  
  // Library
  libraries: Library[];
  currentLibrary: Library | null;
  currentLibraryItems: LibraryItem[];
  currentLibraryItem: LibraryItem | null;
  itemsInProgress: LibraryItem[];
  
  // Player
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  audioUrl: string | null;
  playbackSpeed: number;
  currentProgress: MediaProgress | null;
  playResponse: PlayResponse | null;
  audioTracks: AudioTrack[];
  currentTrackIndex: number;
  chapters: Chapter[];
  useRemainingTime: boolean;
  
  // Queue
  queue: LibraryItem[];
  queueIndex: number;
  
  // Collections (server-side only)
  collections: Collection[];
  collectionsLoading: boolean;
  currentCollection: Collection | null;
  
  // UI State
  sidebarView: 'library' | 'collections' | 'playlists' | 'search';
  searchQuery: string;
  settingsOpen: boolean;
  viewMode: 'grid' | 'list';
  zoomLevel: number;
  
  // Actions
  setServerUrl: (url: string) => void;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setAuthenticated: (auth: boolean) => void;
  setLibraries: (libraries: Library[]) => void;
  setCurrentLibrary: (library: Library | null) => void;
  setCurrentLibraryItems: (items: LibraryItem[]) => void;
  setCurrentLibraryItem: (item: LibraryItem | null) => void;
  setItemsInProgress: (items: LibraryItem[]) => void;
  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  setAudioUrl: (url: string | null) => void;
  setPlaybackSpeed: (speed: number) => void;
  setCurrentProgress: (progress: MediaProgress | null) => void;
  setPlayResponse: (response: PlayResponse | null) => void;
  setAudioTracks: (tracks: AudioTrack[]) => void;
  setCurrentTrackIndex: (index: number) => void;
  setChapters: (chapters: Chapter[]) => void;
  setQueue: (queue: LibraryItem[]) => void;
  setQueueIndex: (index: number) => void;
  addToQueue: (item: LibraryItem) => void;
  removeFromQueue: (index: number) => void;
  setSettingsOpen: (open: boolean) => void;
  clearQueue: () => void;
  setSidebarView: (view: 'library' | 'collections' | 'playlists' | 'search') => void;
  setSearchQuery: (query: string) => void;
  setCollections: (collections: Collection[]) => void;
  setCollectionsLoading: (loading: boolean) => void;
  loadCollections: (libraryId: string) => Promise<void>;
  setCurrentCollection: (collection: Collection | null) => void;
  logout: () => void;
  setUseRemainingTime: (useRemainingTime: boolean) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setZoomLevel: (level: number) => void;
  cycleZoomLevel: () => void;
}

const initialState = {
  serverUrl: '',
  token: null,
  user: null,
  isAuthenticated: false,
  libraries: [],
  currentLibrary: null,
  currentLibraryItems: [],
  currentLibraryItem: null,
  itemsInProgress: [],
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  audioUrl: null,
  playbackSpeed: 1,
  currentProgress: null,
  playResponse: null,
  audioTracks: [],
  currentTrackIndex: 0,
  chapters: [],
  queue: [],
  queueIndex: 0,
  collections: [],
  collectionsLoading: false,
  currentCollection: null,
  sidebarView: 'library' as const,
  searchQuery: '',
  settingsOpen: false,
  viewMode: 'grid' as const,
  zoomLevel: 4,
  useRemainingTime: false,
};

export const useStore = create<AudioSonicState>()(
  persist(
    (set) => ({
      ...initialState,
      setServerUrl: (url) => set({ serverUrl: url }),
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      setAuthenticated: (auth) => set({ isAuthenticated: auth }),
      setLibraries: (libraries) => set({ libraries }),
      setCurrentLibrary: (library) => set({ currentLibrary: library }),
      setCurrentLibraryItems: (items) => set({ currentLibraryItems: items }),
      setCurrentLibraryItem: (item) => set({ currentLibraryItem: item }),
      setItemsInProgress: (items) => set({ itemsInProgress: items }),
      setPlaying: (playing) => set({ isPlaying: playing }),
      setCurrentTime: (time) => set({ currentTime: time }),
      setDuration: (duration) => set({ duration }),
      setVolume: (volume) => set({ volume }),
      setAudioUrl: (url) => set({ audioUrl: url }),
      setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
      setCurrentProgress: (progress) => set({ currentProgress: progress }),
      setPlayResponse: (response) => set({ playResponse: response }),
      setAudioTracks: (tracks) => set({ audioTracks: tracks }),
      setCurrentTrackIndex: (index) => set({ currentTrackIndex: index }),
      setChapters: (chapters) => set({ chapters }),
      setQueue: (queue) => set({ queue }),
      setQueueIndex: (index) => set({ queueIndex: index }),
      addToQueue: (item) => set((state) => ({ queue: [...state.queue, item] })),
      removeFromQueue: (index) => set((state) => ({
        queue: state.queue.filter((_, i) => i !== index),
        queueIndex: state.queueIndex > index ? state.queueIndex - 1 : state.queueIndex,
      })),
      clearQueue: () => set({ queue: [], queueIndex: 0 }),
      setSidebarView: (view) => set({ sidebarView: view, currentCollection: null }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSettingsOpen: (open) => set({ settingsOpen: open }),
      setCollections: (collections) => set({ collections }),
      setCollectionsLoading: (loading) => set({ collectionsLoading: loading }),
      setCurrentCollection: (collection) => set({ currentCollection: collection }),
      loadCollections: async (libraryId) => {
        set({ collectionsLoading: true });
        try {
          const collections = await invoke<Collection[]>('get_collections', { libraryId });
          set({ collections: collections || [] });
        } catch (error) {
          console.error('Failed to load collections:', error);
          set({ collections: [] });
        } finally {
          set({ collectionsLoading: false });
        }
      },
      logout: () => set(initialState),
      setUseRemainingTime: (useRemainingTime) => set({ useRemainingTime }),
      setViewMode: (mode: 'grid' | 'list') => set({ viewMode: mode }),
      setZoomLevel: (level: number) => set({ zoomLevel: Math.max(2, Math.min(6, level)) }),
      cycleZoomLevel: () => set((state: AudioSonicState) => {
        const levels = [2, 3, 4, 5, 6];
        const currentIndex = levels.indexOf(state.zoomLevel);
        const nextIndex = (currentIndex + 1) % levels.length;
        return { zoomLevel: levels[nextIndex] };
      }),
    }),
    {
      name: 'audiosonic-storage',
      partialize: (state: AudioSonicState) => ({
        serverUrl: state.serverUrl,
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
