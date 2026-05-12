mod api;
mod models;

use api::AudiobookshelfClient;
use models::*;
use std::sync::Arc;
use tauri::State;

type ClientState = Arc<AudiobookshelfClient>;

#[tauri::command]
async fn set_config(
    client: State<'_, ClientState>,
    server_url: String,
    token: String,
) -> Result<(), String> {
    println!("Setting config: server_url={}, token={}", server_url, token);
    client.set_config(server_url, Some(token)).await;
    Ok(())
}

#[tauri::command]
async fn login(
    client: State<'_, ClientState>,
    username: String,
    password: String,
    url: String,
) -> Result<LoginResponse, String> {
    client
        .login(&username, &password, &url)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_libraries(client: State<'_, ClientState>) -> Result<Vec<Library>, String> {
    println!("get_libraries called");
    let result = client.get_libraries().await;
    match &result {
        Ok(libraries) => println!("Libraries fetched successfully: {} libraries", libraries.len()),
        Err(e) => println!("Failed to fetch libraries: {}", e),
    }
    result.map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_library_items(
    client: State<'_, ClientState>,
    library_id: String,
) -> Result<Vec<LibraryItem>, String> {
    client
        .get_library_items(&library_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_library_item(
    client: State<'_, ClientState>,
    library_item_id: String,
) -> Result<LibraryItem, String> {
    client
        .get_library_item(&library_item_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn play_item(
    client: State<'_, ClientState>,
    library_item_id: String,
    episode_id: Option<String>,
) -> Result<PlayResponse, String> {
    println!("play_item called with library_item_id: {}, episode_id: {:?}", library_item_id, episode_id);
    let result = client
        .play_item(&library_item_id, episode_id.as_deref())
        .await;
    
    match &result {
        Ok(response) => {
            println!("Play response successful");
            println!("Response library_item_id: {:?}", response.library_item_id);
            println!("Response episode_id: {:?}", response.episode_id);
            println!("Response audio_tracks count: {}", response.audio_tracks.len());
            if let Some(first_track) = response.audio_tracks.first() {
                println!("First track content_url: {}", first_track.content_url);
                println!("First track duration: {}", first_track.duration);
            }
        },
        Err(e) => {
            println!("Play response error: {}", e);
            println!("Error details: {:?}", e);
        },
    }
    
    result.map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_progress(
    client: State<'_, ClientState>,
    library_item_id: String,
    episode_id: Option<String>,
    current_time: f64,
    duration: f64,
    progress: f64,
    is_finished: bool,
) -> Result<MediaProgress, String> {
    let request = UpdateProgressRequest {
        current_time,
        duration,
        progress,
        is_finished,
    };
    client
        .update_progress(&library_item_id, episode_id, request)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_media_progress(
    client: State<'_, ClientState>,
    library_item_id: String,
) -> Result<Option<MediaProgress>, String> {
    client
        .get_media_progress(&library_item_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_items_in_progress(client: State<'_, ClientState>) -> Result<Vec<LibraryItem>, String> {
    client
        .get_items_in_progress()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn search(client: State<'_, ClientState>, query: String) -> Result<SearchResponse, String> {
    client
        .search(&query)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_collections(
    client: State<'_, ClientState>,
    library_id: String,
) -> Result<Vec<Collection>, String> {
    client
        .get_collections(&library_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_playlists(
    client: State<'_, ClientState>,
    library_id: String,
) -> Result<Vec<Playlist>, String> {
    client
        .get_playlists(&library_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_bookmark(
    client: State<'_, ClientState>,
    library_item_id: String,
    time: f64,
    title: String,
) -> Result<Bookmark, String> {
    let request = CreateBookmarkRequest { time, title };
    client
        .create_bookmark(&library_item_id, request)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_cover_url(
    client: State<'_, ClientState>,
    library_item_id: String,
) -> Result<String, String> {
    client
        .get_cover_url(&library_item_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_audio_stream(
    client: State<'_, ClientState>,
    library_item_id: String,
    episode_id: Option<String>,
) -> Result<String, String> {
    let play_response = client
        .play_item(&library_item_id, episode_id.as_deref())
        .await
        .map_err(|e| e.to_string())?;
    
    if let Some(track) = play_response.audio_tracks.first() {
        return Ok(track.content_url.clone());
    }
    
    Err("No tracks in play response".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let client = Arc::new(AudiobookshelfClient::new());

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .manage(client)
        .invoke_handler(tauri::generate_handler![
            set_config,
            login,
            get_libraries,
            get_library_items,
            get_library_item,
            play_item,
            update_progress,
            get_media_progress,
            get_items_in_progress,
            get_collections,
            get_playlists,
            create_bookmark,
            get_cover_url,
            get_audio_stream,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
