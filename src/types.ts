export interface Library {
  id: string;
  name: string;
  mediaType: string;
  folders: LibraryFolder[];
  icon?: string;
}

export interface LibraryFolder {
  id: string;
  fullPath: string;
}

export interface LibraryItem {
  id: string;
  libraryId: string;
  mediaType: string;
  media: Media;
  updatedAt?: number;
  path?: string;
}

export interface Media {
  metadata: MediaMetadata;
  coverPath?: string;
  tags?: string[];
  numTracks?: number;
  duration?: number;
  size?: number;
  tracks?: AudioTrack[];
  chapters?: Chapter[];
}

export interface MediaMetadata {
  title: string;
  titleIgnorePrefix?: string;
  subtitle?: string;
  authorName?: string;
  authorNameLF?: string;
  narratorName?: string;
  series?: SeriesSequence[];
  genres?: string[];
  publishedYear?: string;
  publisher?: string;
  description?: string;
  isbn?: string;
  asin?: string;
  language?: string;
  explicit?: boolean;
  authorImagePath?: string;
}

export interface SeriesSequence {
  id: string;
  name: string;
  sequence?: string;
}

export interface AudioTrack {
  index?: number;
  startOffset?: number;
  duration: number;
  contentUrl?: string;
  metadata?: AudioTrackMetadata;
}

export interface AudioTrackMetadata {
  filename?: string;
  ext?: string;
  path?: string;
  mimeType?: string;
}

export interface Chapter {
  id: number;
  startTime: number;
  endTime: number;
  title: string;
}

export interface MediaProgress {
  id: string;
  libraryItemId: string;
  episodeId?: string;
  duration: number;
  progress: number;
  currentTime: number;
  isFinished: boolean;
  hideFromContinueListening: boolean;
  lastUpdate: number;
  startedAt: number;
  finishedAt?: number;
}

export interface PlayResponse {
  libraryItemId: string;
  episodeId?: string;
  media: PlayMedia;
}

export interface PlayMedia {
  tracks: PlayTrack[];
}

export interface PlayTrack {
  index: number;
  startOffset: number;
  duration: number;
  contentUrl: string;
  metadata: PlayTrackMetadata;
}

export interface PlayTrackMetadata {
  filename: string;
  ext: string;
  mimeType: string;
}

export interface SearchResponse {
  book?: LibraryItem[];
  authors?: Author[];
  series?: Series[];
  tags?: string[];
}

export interface Author {
  id: string;
  name: string;
  imagePath?: string;
  asin?: string;
  description?: string;
}

export interface Series {
  id: string;
  name: string;
  nameIgnorePrefix?: string;
  books?: LibraryItem[];
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  libraryId: string;
  books: any[]; // Use any[] to match the flexible JSON structure
  createdAt: number;
  lastUpdate: number;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  items: PlaylistItem[];
  createdAt: number;
  updatedAt: number;
}

export interface PlaylistItem {
  id: string;
  libraryItemId: string;
  episodeId?: string;
  mediaType: string;
}

export interface Bookmark {
  libraryItemId: string;
  title: string;
  time: number;
  created_at?: number;
}

export interface User {
  id: string;
  username: string;
  type: string;
  token?: string;
  mediaProgress?: MediaProgress[];
  bookmarks?: Bookmark[];
  isActive: boolean;
  isLocked: boolean;
  lastSeen?: number;
  createdAt: number;
  permissions: UserPermissions;
}

export interface UserPermissions {
  download: boolean;
  update: boolean;
  delete: boolean;
  upload: boolean;
  accessAllLibraries: boolean;
  accessAllTags: boolean;
  accessExplicitContent: boolean;
}

export interface LoginResponse {
  user: User;
  userDefaultLibraryId?: string;
  serverSettings: ServerSettings;
  source: string;
}

export interface ServerSettings {
  id: string;
  version: string;
  authMethod?: string;
}

export interface AppState {
  serverUrl?: string;
  token?: string;
  user?: User;
  currentLibrary?: Library;
  currentLibraryItems?: LibraryItem[];
  currentLibraryItem?: LibraryItem;
  currentProgress?: MediaProgress;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  queue: LibraryItem[];
  queueIndex: number;
  volume: number;
  playbackSpeed: number;
}

export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  audioUrl: string | null;
  playbackSpeed: number;
  currentItem?: LibraryItem;
  currentTrackIndex: number;
  queue: LibraryItem[];
  queueIndex: number;
}

export interface AudioSonicState {
  serverUrl: string | null;
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  libraries: Library[];
  currentLibrary: Library | null;
  currentLibraryItems: LibraryItem[];
  currentLibraryItem: LibraryItem | null;
  itemsInProgress: MediaProgress[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  audioUrl: string | null;
  playbackSpeed: number;
  currentProgress: MediaProgress | null;
  playResponse: PlayResponse | null;
  queue: LibraryItem[];
  queueIndex: number;
  sidebarView: 'library' | 'collections' | 'playlists' | 'search';
  searchQuery: string;
};
