import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Library, LibraryItem, MediaProgress, User, PlayResponse } from './types';

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
  
  // Queue
  queue: LibraryItem[];
  queueIndex: number;
  
  // UI State
  sidebarView: 'library' | 'collections' | 'playlists' | 'search';
  searchQuery: string;
  
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
  setQueue: (queue: LibraryItem[]) => void;
  setQueueIndex: (index: number) => void;
  addToQueue: (item: LibraryItem) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  setSidebarView: (view: 'library' | 'collections' | 'playlists' | 'search') => void;
  setSearchQuery: (query: string) => void;
  logout: () => void;
}

const initialState: AudioSonicState = {
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
  queue: [],
  queueIndex: 0,
  sidebarView: 'library',
  searchQuery: '',
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
      setQueue: (queue) => set({ queue }),
      setQueueIndex: (index) => set({ queueIndex: index }),
      addToQueue: (item) => set((state) => ({ queue: [...state.queue, item] })),
      removeFromQueue: (index) => set((state) => ({
        queue: state.queue.filter((_, i) => i !== index),
        queueIndex: state.queueIndex > index ? state.queueIndex - 1 : state.queueIndex,
      })),
      clearQueue: () => set({ queue: [], queueIndex: 0 }),
      setSidebarView: (view) => set({ sidebarView: view }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      logout: () => set(initialState),
    }),
    {
      name: 'audiosonic-storage',
      partialize: (state) => ({
        serverUrl: state.serverUrl,
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
