use serde::{Deserialize, Serialize};

// ==================== AUTHENTICATION ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoginResponse {
    pub user: User,
    #[serde(rename = "userDefaultLibraryId", alias = "userDefaultLibraryId")]
    pub user_default_library_id: Option<String>,
    #[serde(rename = "serverSettings", alias = "serverSettings")]
    pub server_settings: ServerSettings,
    #[serde(rename = "Source", alias = "source", default)]
    pub source: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerSettings {
    #[serde(default = "default_string")]
    pub id: String,
    #[serde(default = "default_string")]
    pub version: String,
    #[serde(rename = "authMethod", alias = "authMethod", default)]
    pub auth_method: Option<String>,
}

fn default_string() -> String {
    String::new()
}

// ==================== USER ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub username: String,
    #[serde(rename = "type", alias = "userType")]
    pub user_type: String,
    pub token: Option<String>,
    #[serde(rename = "mediaProgress", alias = "mediaProgress", default)]
    pub media_progress: Option<Vec<MediaProgress>>,
    #[serde(default)]
    pub bookmarks: Option<Vec<Bookmark>>,
    #[serde(rename = "isActive", alias = "isActive", default)]
    pub is_active: bool,
    #[serde(rename = "isLocked", alias = "isLocked", default)]
    pub is_locked: bool,
    #[serde(rename = "lastSeen", alias = "lastSeen", default)]
    pub last_seen: Option<i64>,
    #[serde(rename = "createdAt", alias = "createdAt")]
    pub created_at: i64,
    pub permissions: UserPermissions,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserPermissions {
    #[serde(default)]
    pub download: bool,
    #[serde(default)]
    pub update: bool,
    #[serde(default)]
    pub delete: bool,
    #[serde(default)]
    pub upload: bool,
    #[serde(rename = "accessAllLibraries", alias = "accessAllLibraries", default)]
    pub access_all_libraries: bool,
    #[serde(rename = "accessAllTags", alias = "accessAllTags", default)]
    pub access_all_tags: bool,
    #[serde(rename = "accessExplicitContent", alias = "accessExplicitContent", default)]
    pub access_explicit_content: bool,
}

// ==================== LIBRARY ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Library {
    pub id: String,
    pub name: String,
    #[serde(rename = "mediaType")]
    pub media_type: String,
    pub folders: Vec<LibraryFolder>,
    pub icon: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LibraryFolder {
    pub id: String,
    #[serde(rename = "fullPath")]
    pub full_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LibrariesResponse {
    pub libraries: Vec<Library>,
}

// ==================== LIBRARY ITEMS ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LibraryItemsResponse {
    pub results: Vec<LibraryItem>,
    pub total: i32,
    pub limit: i32,
    pub page: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LibraryItem {
    pub id: String,
    #[serde(rename = "libraryId")]
    pub library_id: String,
    #[serde(rename = "mediaType")]
    pub media_type: String,
    pub media: Media,
    #[serde(rename = "updatedAt")]
    pub updated_at: Option<i64>,
    pub path: Option<String>,
    #[serde(default)]
    #[serde(rename = "ino")]
    pub ino: Option<String>,
    #[serde(default)]
    #[serde(rename = "oldLibraryItemId")]
    pub old_library_item_id: Option<String>,
    #[serde(default)]
    #[serde(rename = "folderId")]
    pub folder_id: Option<String>,
    #[serde(default)]
    #[serde(rename = "relPath")]
    pub rel_path: Option<String>,
    #[serde(default)]
    #[serde(rename = "isFile")]
    pub is_file: Option<bool>,
    #[serde(default)]
    #[serde(rename = "mtimeMs")]
    pub mtime_ms: Option<i64>,
    #[serde(default)]
    #[serde(rename = "ctimeMs")]
    pub ctime_ms: Option<i64>,
    #[serde(default)]
    #[serde(rename = "birthtimeMs")]
    pub birthtime_ms: Option<i64>,
    #[serde(default)]
    #[serde(rename = "addedAt")]
    pub added_at: Option<i64>,
    #[serde(default)]
    #[serde(rename = "lastScan")]
    pub last_scan: Option<i64>,
    #[serde(default)]
    #[serde(rename = "scanVersion")]
    pub scan_version: Option<String>,
    #[serde(default)]
    #[serde(rename = "isMissing")]
    pub is_missing: Option<bool>,
    #[serde(default)]
    #[serde(rename = "isInvalid")]
    pub is_invalid: Option<bool>,
    #[serde(default)]
    #[serde(rename = "libraryFiles")]
    pub library_files: Option<Vec<LibraryFile>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Media {
    #[serde(default)]
    pub id: Option<String>,
    #[serde(default)]
    #[serde(rename = "libraryItemId")]
    pub library_item_id: Option<String>,
    pub metadata: MediaMetadata,
    #[serde(rename = "coverPath")]
    pub cover_path: Option<String>,
    pub tags: Option<Vec<String>>,
    #[serde(rename = "numTracks")]
    pub num_tracks: Option<i32>,
    pub duration: Option<f64>,
    pub size: Option<i64>,
    #[serde(default)]
    #[serde(rename = "audioFiles")]
    pub audio_files: Option<Vec<AudioFile>>,
    pub tracks: Option<Vec<AudioTrack>>,
    pub chapters: Option<Vec<Chapter>>,
    #[serde(default)]
    #[serde(rename = "ebookFile")]
    pub ebook_file: Option<EbookFile>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaMetadata {
    pub title: String,
    #[serde(rename = "titleIgnorePrefix")]
    pub title_ignore_prefix: Option<String>,
    pub subtitle: Option<String>,
    pub authors: Option<Vec<AuthorRef>>,
    pub narrators: Option<Vec<String>>,
    pub series: Option<Vec<SeriesSequence>>,
    pub genres: Option<Vec<String>>,
    #[serde(rename = "publishedYear")]
    pub published_year: Option<String>,
    #[serde(rename = "publishedDate")]
    pub published_date: Option<String>,
    pub publisher: Option<String>,
    pub description: Option<String>,
    #[serde(rename = "descriptionPlain")]
    pub description_plain: Option<String>,
    pub isbn: Option<String>,
    pub asin: Option<String>,
    pub language: Option<String>,
    pub explicit: Option<bool>,
    pub abridged: Option<bool>,
    #[serde(rename = "authorName")]
    pub author_name: Option<String>,
    #[serde(rename = "authorNameLF")]
    pub author_name_lf: Option<String>,
    #[serde(rename = "narratorName")]
    pub narrator_name: Option<String>,
    #[serde(rename = "seriesName")]
    pub series_name: Option<String>,
    #[serde(rename = "authorImagePath")]
    pub author_image_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthorRef {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SeriesSequence {
    pub id: String,
    pub name: String,
    pub sequence: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioTrack {
    #[serde(rename = "index")]
    pub track_index: Option<i32>,
    #[serde(rename = "startOffset")]
    pub start_offset: Option<f64>,
    pub duration: f64,
    #[serde(rename = "contentUrl")]
    pub content_url: Option<String>,
    pub metadata: Option<AudioTrackMetadata>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioTrackMetadata {
    pub filename: Option<String>,
    pub ext: Option<String>,
    pub path: Option<String>,
    #[serde(rename = "mimeType")]
    pub mime_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioFile {
    pub index: i32,
    pub ino: String,
    pub metadata: AudioFileMetadata,
    #[serde(rename = "addedAt")]
    pub added_at: Option<i64>,
    #[serde(rename = "updatedAt")]
    pub updated_at: Option<i64>,
    #[serde(rename = "trackNumFromMeta")]
    pub track_num_from_meta: Option<i32>,
    #[serde(rename = "discNumFromMeta")]
    pub disc_num_from_meta: Option<i32>,
    #[serde(rename = "trackNumFromFilename")]
    pub track_num_from_filename: Option<i32>,
    #[serde(rename = "discNumFromFilename")]
    pub disc_num_from_filename: Option<i32>,
    #[serde(rename = "manuallyVerified")]
    pub manually_verified: Option<bool>,
    pub exclude: Option<bool>,
    pub error: Option<String>,
    pub format: Option<String>,
    pub duration: Option<f64>,
    #[serde(rename = "bitRate")]
    pub bit_rate: Option<i32>,
    pub language: Option<String>,
    pub codec: Option<String>,
    #[serde(rename = "timeBase")]
    pub time_base: Option<String>,
    pub channels: Option<i32>,
    #[serde(rename = "channelLayout")]
    pub channel_layout: Option<String>,
    pub chapters: Option<Vec<Chapter>>,
    #[serde(rename = "embeddedCoverArt")]
    pub embedded_cover_art: Option<String>,
    #[serde(rename = "metaTags")]
    pub meta_tags: Option<serde_json::Value>,
    #[serde(rename = "mimeType")]
    pub mime_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioFileMetadata {
    pub filename: String,
    pub ext: String,
    pub path: String,
    #[serde(rename = "relPath")]
    pub rel_path: String,
    pub size: i64,
    #[serde(rename = "mtimeMs")]
    pub mtime_ms: Option<i64>,
    #[serde(rename = "ctimeMs")]
    pub ctime_ms: Option<i64>,
    #[serde(rename = "birthtimeMs")]
    pub birthtime_ms: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EbookFile {
    pub ino: String,
    pub metadata: LibraryFileMetadata,
    #[serde(rename = "isSupplementary")]
    pub is_supplementary: Option<bool>,
    #[serde(rename = "addedAt")]
    pub added_at: Option<i64>,
    #[serde(rename = "updatedAt")]
    pub updated_at: Option<i64>,
    #[serde(rename = "fileType")]
    pub file_type: Option<String>,
    #[serde(rename = "ebookFormat")]
    pub ebook_format: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Chapter {
    pub id: i32,
    #[serde(rename = "startTime")]
    pub start_time: f64,
    #[serde(rename = "endTime")]
    pub end_time: f64,
    pub title: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LibraryFile {
    pub ino: String,
    pub metadata: LibraryFileMetadata,
    #[serde(rename = "isSupplementary")]
    pub is_supplementary: Option<bool>,
    #[serde(rename = "addedAt")]
    pub added_at: Option<i64>,
    #[serde(rename = "updatedAt")]
    pub updated_at: Option<i64>,
    #[serde(rename = "fileType")]
    pub file_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LibraryFileMetadata {
    pub filename: String,
    pub ext: String,
    pub path: String,
    #[serde(rename = "relPath")]
    pub rel_path: String,
    pub size: i64,
    #[serde(rename = "mtimeMs")]
    pub mtime_ms: Option<i64>,
    #[serde(rename = "ctimeMs")]
    pub ctime_ms: Option<i64>,
    #[serde(rename = "birthtimeMs")]
    pub birthtime_ms: Option<i64>,
}

// ==================== MEDIA PROGRESS ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaProgress {
    pub id: String,
    #[serde(rename = "libraryItemId")]
    pub library_item_id: String,
    #[serde(rename = "episodeId")]
    pub episode_id: Option<String>,
    pub duration: f64,
    pub progress: f64,
    #[serde(rename = "currentTime")]
    pub current_time: f64,
    #[serde(rename = "isFinished")]
    pub is_finished: bool,
    #[serde(rename = "hideFromContinueListening")]
    pub hide_from_continue_listening: bool,
    #[serde(rename = "lastUpdate")]
    pub last_update: i64,
    #[serde(rename = "startedAt")]
    pub started_at: i64,
    #[serde(rename = "finishedAt")]
    pub finished_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateProgressRequest {
    #[serde(rename = "currentTime")]
    pub current_time: f64,
    pub duration: f64,
    pub progress: f64,
    #[serde(rename = "isFinished")]
    pub is_finished: bool,
}

// ==================== PLAYBACK SESSION ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayRequest {
    #[serde(rename = "deviceInfo")]
    pub device_info: DeviceInfo,
    #[serde(rename = "supportedMimeTypes")]
    pub supported_mime_types: Vec<String>,
    #[serde(rename = "directPlay")]
    pub direct_play: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceInfo {
    #[serde(rename = "clientVersion")]
    pub client_version: String,
    #[serde(rename = "manufacturer")]
    pub manufacturer: Option<String>,
    #[serde(rename = "model")]
    pub model: Option<String>,
    #[serde(rename = "clientName")]
    pub client_name: Option<String>,
    #[serde(rename = "deviceId")]
    pub device_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayResponse {
    pub id: String,
    #[serde(rename = "userId")]
    pub user_id: String,
    #[serde(rename = "libraryId")]
    pub library_id: String,
    #[serde(rename = "libraryItemId")]
    pub library_item_id: String,
    #[serde(rename = "bookId")]
    pub book_id: Option<String>,
    #[serde(rename = "episodeId")]
    pub episode_id: Option<String>,
    #[serde(rename = "mediaType")]
    pub media_type: String,
    #[serde(rename = "mediaMetadata")]
    pub media_metadata: serde_json::Value,
    #[serde(default)]
    pub chapters: Vec<PlayChapter>,
    #[serde(rename = "displayTitle")]
    pub display_title: String,
    #[serde(rename = "displayAuthor")]
    pub display_author: String,
    #[serde(rename = "coverPath")]
    pub cover_path: Option<String>,
    pub duration: f64,
    #[serde(rename = "playMethod")]
    pub play_method: i32,
    #[serde(rename = "mediaPlayer")]
    pub media_player: String,
    #[serde(rename = "deviceInfo")]
    pub device_info: DeviceInfo,
    #[serde(rename = "serverVersion")]
    pub server_version: String,
    #[serde(default)]
    #[serde(rename = "audioTracks")]
    pub audio_tracks: Vec<PlayTrack>,
    #[serde(default)]
    #[serde(rename = "videoTrack")]
    pub video_track: Option<serde_json::Value>,
    #[serde(default)]
    #[serde(rename = "libraryItem")]
    pub library_item: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayTrackMetadata {
    pub filename: String,
    pub ext: String,
    #[serde(rename = "mimeType", default)]
    pub mime_type: Option<String>,
    #[serde(default)]
    pub path: Option<String>,
    #[serde(rename = "relPath", default)]
    pub rel_path: Option<String>,
    #[serde(default)]
    pub ino: Option<String>,
    #[serde(rename = "mtimeMs", default)]
    pub mtime_ms: Option<i64>,
    #[serde(rename = "ctimeMs", default)]
    pub ctime_ms: Option<i64>,
    #[serde(rename = "birthtimeMs", default)]
    pub birthtime_ms: Option<i64>,
    #[serde(rename = "addedAt", default)]
    pub added_at: Option<i64>,
    #[serde(rename = "updatedAt", default)]
    pub updated_at: Option<i64>,
    #[serde(rename = "trackNumFromMeta", default)]
    pub track_num_from_meta: Option<i32>,
    #[serde(rename = "discNumFromMeta", default)]
    pub disc_num_from_meta: Option<i32>,
    #[serde(rename = "trackNumFromFilename", default)]
    pub track_num_from_filename: Option<i32>,
    #[serde(rename = "discNumFromFilename", default)]
    pub disc_num_from_filename: Option<i32>,
    #[serde(default)]
    pub manually_verified: Option<bool>,
    #[serde(default)]
    pub exclude: Option<bool>,
    #[serde(default)]
    pub error: Option<String>,
    #[serde(default)]
    pub format: Option<String>,
    #[serde(default)]
    pub duration: Option<f64>,
    #[serde(default)]
    pub bit_rate: Option<i32>,
    #[serde(default)]
    pub language: Option<String>,
    #[serde(default)]
    pub codec: Option<String>,
    #[serde(rename = "timeBase", default)]
    pub time_base: Option<String>,
    #[serde(default)]
    pub channels: Option<i32>,
    #[serde(rename = "channelLayout", default)]
    pub channel_layout: Option<String>,
    #[serde(default)]
    pub chapters: Option<Vec<PlayChapter>>,
    #[serde(rename = "embeddedCoverArt", default)]
    pub embedded_cover_art: Option<String>,
    #[serde(rename = "metaTags", default)]
    pub meta_tags: Option<serde_json::Value>,
    #[serde(default)]
    pub title: Option<String>,
    #[serde(rename = "startOffset", default)]
    pub start_offset: Option<f64>,
    #[serde(rename = "contentUrl", default)]
    pub content_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayChapter {
    pub start: f64,
    pub end: f64,
    pub title: String,
    pub id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayMedia {
    pub tracks: Vec<PlayTrack>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayTrack {
    pub index: i32,
    #[serde(rename = "startOffset")]
    pub start_offset: f64,
    pub duration: f64,
    #[serde(rename = "contentUrl")]
    pub content_url: String,
    pub metadata: PlayTrackMetadata,
}

// ==================== BOOKMARK ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bookmark {
    #[serde(rename = "libraryItemId")]
    pub library_item_id: String,
    pub title: String,
    pub time: f64,
    pub created_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateBookmarkRequest {
    pub time: f64,
    pub title: String,
}

pub struct AddToCollectionRequest {
    pub collection_id: String,
    pub library_item_id: String,
}

// ==================== SEARCH ====================

// Use serde_json::Value to avoid strict parsing issues with expanded search responses
pub type SearchResponse = serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Author {
    pub id: String,
    pub name: String,
    #[serde(rename = "imagePath")]
    pub image_path: Option<String>,
    #[serde(rename = "asyn")]
    pub asin: Option<String>,
    #[serde(rename = "description")]
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Series {
    pub id: String,
    pub name: String,
    #[serde(rename = "nameIgnorePrefix")]
    pub name_ignore_prefix: Option<String>,
    pub books: Option<Vec<LibraryItem>>,
}

// ==================== COLLECTIONS & PLAYLISTS ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollectionsResponse {
    pub results: Vec<Collection>,
    pub total: i32,
    pub limit: i32,
    pub page: i32,
    #[serde(default)]
    pub sort_desc: bool,
    #[serde(default)]
    pub minified: bool,
    #[serde(default)]
    pub include: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Collection {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    #[serde(rename = "libraryId")]
    pub library_id: String,
    // Use serde_json::Value for books to handle complex nested structure
    #[serde(default)]
    pub books: Vec<serde_json::Value>,
    #[serde(rename = "createdAt")]
    pub created_at: i64,
    #[serde(rename = "lastUpdate")]
    pub last_update: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Playlist {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub items: Vec<LibraryItem>,
    #[serde(rename = "createdAt")]
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerConfig {
    pub id: String,
    pub scanner_find_covers: bool,
    pub scanner_cover_provider: String,
    pub scanner_parse_subtitle: bool,
    pub scanner_prefer_matched_metadata: bool,
    pub scanner_disable_watcher: bool,
    pub store_cover_with_item: bool,
    pub store_metadata_with_item: bool,
    pub metadata_file_format: String,
    pub rate_limit_login_requests: i32,
    pub rate_limit_login_window: i64,
    pub allow_iframe: bool,
    pub backup_path: String,
    pub backup_schedule: bool,
    pub backups_to_keep: i32,
    pub max_backup_size: i32,
    pub logger_daily_logs_to_keep: i32,
    pub logger_scanner_logs_to_keep: i32,
    pub home_bookshelf_view: i32,
    pub bookshelf_view: i32,
    pub podcast_episode_schedule: String,
    pub sorting_ignore_prefix: bool,
    pub sorting_prefixes: Vec<String>,
    pub chromecast_enabled: bool,
    pub date_format: String,
    pub time_format: String,
    pub language: String,
    pub allowed_origins: Vec<String>,
    pub log_level: i32,
    pub version: String,
    pub build_number: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppState {
    pub libraries: Vec<Library>,
    pub library_items: Vec<LibraryItem>,
    pub users: Vec<User>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json;

    #[test]
    fn test_play_response_parsing() {
        let json = r#"{
            "libraryItemId": "test-id",
            "episodeId": null,
            "media": {
                "tracks": [
                    {
                        "index": 1,
                        "startOffset": 0.0,
                        "duration": 100.0,
                        "contentUrl": "/api/items/test/file/1",
                        "metadata": {
                            "filename": "test.m4b",
                            "ext": ".m4b",
                            "mimeType": "audio/mp4"
                        }
                    }
                ]
            },
            "libraryFiles": [],
            "size": 1000
        }"#;

        let result: Result<PlayResponse, _> = serde_json::from_str(json);
        assert!(result.is_ok(), "Failed to parse PlayResponse: {:?}", result.err());
        
        let play_response = result.unwrap();
        assert_eq!(play_response.library_item_id, "test-id");
        assert_eq!(play_response.media.tracks.len(), 1);
        assert_eq!(play_response.media.tracks[0].content_url, "/api/items/test/file/1");
    }

    #[test]
    fn test_play_track_metadata_parsing() {
        let json = r#"{
            "filename": "test.m4b",
            "ext": ".m4b",
            "mimeType": "audio/mp4",
            "path": "/path/to/test.m4b",
            "relPath": "test.m4b",
            "size": 1000,
            "mtimeMs": 1234567890,
            "ctimeMs": 1234567890,
            "birthtimeMs": 1234567890
        }"#;

        let result: Result<PlayTrackMetadata, _> = serde_json::from_str(json);
        assert!(result.is_ok(), "Failed to parse PlayTrackMetadata: {:?}", result.err());
        
        let metadata = result.unwrap();
        assert_eq!(metadata.filename, "test.m4b");
        assert_eq!(metadata.ext, ".m4b");
        assert_eq!(metadata.mime_type, Some("audio/mp4".to_string()));
    }
}
