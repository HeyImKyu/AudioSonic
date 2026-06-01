use crate::models::*;
use anyhow::{Context, Result};
use reqwest::{Client, header};
use std::sync::Arc;
use tokio::sync::RwLock;

pub struct AudiobookshelfClient {
    client: Client,
    base_url: Arc<RwLock<String>>,
    token: Arc<RwLock<Option<String>>>,
}

impl AudiobookshelfClient {
    pub fn new() -> Self {
        Self {
            client: Client::new(),
            base_url: Arc::new(RwLock::new(String::new())),
            token: Arc::new(RwLock::new(None)),
        }
    }

    pub async fn set_config(&self, url: String, token: Option<String>) {
        let mut base_url = self.base_url.write().await;
        *base_url = url.trim_end_matches('/').to_string();
        let mut token_ref = self.token.write().await;
        *token_ref = token;
    }

    async fn get_headers(&self) -> Result<header::HeaderMap> {
        let mut headers = header::HeaderMap::new();
        headers.insert(header::CONTENT_TYPE, "application/json".parse()?);
        
        let token = self.token.read().await;
        if let Some(t) = token.as_ref() {
            headers.insert(
                header::AUTHORIZATION,
                format!("Bearer {}", t).parse()?
            );
        }
        Ok(headers)
    }

    async fn get_base_url(&self) -> String {
        self.base_url.read().await.clone()
    }

    pub async fn login(&self, username: &str, password: &str, url: &str) -> Result<LoginResponse> {
        let base_url = url.trim_end_matches('/');
        let request = LoginRequest {
            username: username.to_string(),
            password: password.to_string(),
        };

        let response = self.client
            .post(&format!("{}/login", base_url))
            .json(&request)
            .send()
            .await
            .context("Failed to send login request")?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unable to read error".to_string());
            return Err(anyhow::anyhow!("Login failed: {} - {}", status, error_text));
        }

        let response_text = response.text().await.context("Failed to read response text")?;
        
        let login_response: LoginResponse = serde_json::from_str(&response_text)
            .context("Failed to parse login response")?;

        // Store the token
        self.set_config(base_url.to_string(), login_response.user.token.clone()).await;

        Ok(login_response)
    }

    pub async fn get_libraries(&self) -> Result<Vec<Library>> {
        let base_url = self.get_base_url().await;
        let headers = self.get_headers().await?;

        let response = self.client
            .get(&format!("{}/api/libraries", base_url))
            .headers(headers)
            .send()
            .await
            .context("Failed to fetch libraries")?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!("Failed to get libraries: {}", response.status()));
        }

        let libraries_response: LibrariesResponse = response
            .json()
            .await
            .context("Failed to parse libraries response")?;

        Ok(libraries_response.libraries)
    }

    pub async fn get_library_items(&self, library_id: &str) -> Result<Vec<LibraryItem>> {
        let base_url = self.get_base_url().await;
        let headers = self.get_headers().await?;

        let response = self.client
            .get(&format!("{}/api/libraries/{}/items", base_url, library_id))
            .headers(headers)
            .query(&[("minified", "false")])
            .send()
            .await
            .context("Failed to fetch library items")?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!("Failed to get library items: {}", response.status()));
        }

        let items_response: LibraryItemsResponse = response
            .json()
            .await
            .context("Failed to parse library items response")?;

        Ok(items_response.results)
    }

    pub async fn get_library_item(&self, library_item_id: &str) -> Result<LibraryItem> {
        let base_url = self.get_base_url().await;
        let headers = self.get_headers().await?;

        let response = self.client
            .get(&format!("{}/api/items/{}", base_url, library_item_id))
            .headers(headers)
            .query(&[("minified", "false")])
            .send()
            .await
            .context("Failed to fetch library item")?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!("Failed to get library item: {}", response.status()));
        }

        let item: LibraryItem = response
            .json()
            .await
            .context("Failed to parse library item response")?;

        Ok(item)
    }

    pub async fn play_item(&self, library_item_id: &str, episode_id: Option<&str>) -> Result<PlayResponse> {
        let url = if let Some(ep_id) = episode_id {
            format!("{}/api/items/{}/play/{}", self.base_url.read().await, library_item_id, ep_id)
        } else {
            format!("{}/api/items/{}/play", self.base_url.read().await, library_item_id)
        };
        
        let request_body = PlayRequest {
            device_info: DeviceInfo {
                client_name: Some("AudioSonic".to_string()),
                client_version: "0.0.1".to_string(),
                device_id: Some("audio-sonic-device".to_string()),
                manufacturer: Some("AudioSonic".to_string()),
                model: Some("Desktop Client".to_string()),
            },
            supported_mime_types: vec!["audio/flac".to_string(), "audio/mpeg".to_string(), "audio/mp4".to_string()],
            direct_play: Some(true),
        };
        
        let token = self.token.read().await;
        let token_str = token.as_ref().ok_or_else(|| anyhow::anyhow!("No token set"))?;
        let response = self
            .client
            .post(&url)
            .header("Authorization", format!("Bearer {}", token_str))
            .json(&request_body)
            .send()
            .await?;

        let response_text = response.text().await?;
        let play_response: PlayResponse = serde_json::from_str(&response_text)?;
        
        Ok(play_response)
    }

    pub async fn update_progress(
        &self,
        library_item_id: &str,
        episode_id: Option<String>,
        progress_request: UpdateProgressRequest,
    ) -> Result<MediaProgress> {
        let base_url = self.get_base_url().await;
        let headers = self.get_headers().await?;

        let url = if let Some(ep_id) = episode_id {
            format!("{}/api/me/progress/{}", base_url, ep_id)
        } else {
            format!("{}/api/me/progress/{}", base_url, library_item_id)
        };

        let response = self.client
            .patch(&url)
            .headers(headers)
            .json(&progress_request)
            .send()
            .await
            .context("Failed to update progress")?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!("Failed to update progress: {}", response.status()));
        }

        let media_progress: MediaProgress = response
            .json()
            .await
            .context("Failed to parse progress response")?;

        Ok(media_progress)
    }

    pub async fn get_media_progress(&self, library_item_id: &str) -> Result<Option<MediaProgress>> {
        let base_url = self.get_base_url().await;
        let headers = self.get_headers().await?;

        let response = self.client
            .get(&format!("{}/api/me/progress/{}", base_url, library_item_id))
            .headers(headers)
            .send()
            .await
            .context("Failed to fetch media progress")?;

        if response.status() == 404 {
            return Ok(None);
        }

        if !response.status().is_success() {
            return Err(anyhow::anyhow!("Failed to get media progress: {}", response.status()));
        }

        let media_progress: MediaProgress = response
            .json()
            .await
            .context("Failed to parse media progress response")?;

        Ok(Some(media_progress))
    }

    pub async fn get_items_in_progress(&self) -> Result<Vec<LibraryItem>> {
        let base_url = self.get_base_url().await;
        let headers = self.get_headers().await?;

        let response = self.client
            .get(&format!("{}/api/me/items-in-progress", base_url))
            .headers(headers)
            .send()
            .await
            .context("Failed to fetch items in progress")?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!("Failed to get items in progress: {}", response.status()));
        }

        let items: Vec<LibraryItem> = response
            .json()
            .await
            .context("Failed to parse items in progress response")?;

        Ok(items)
    }

    pub async fn search(&self, query: &str) -> Result<SearchResponse> {
        let base_url = self.get_base_url().await;
        let headers = self.get_headers().await?;

        let response = self.client
            .get(&format!("{}/api/search", base_url))
            .headers(headers)
            .query(&[("q", query)])
            .send()
            .await
            .context("Failed to search")?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!("Search failed: {}", response.status()));
        }

        let search_response: SearchResponse = response
            .json()
            .await
            .context("Failed to parse search response")?;

        Ok(search_response)
    }

    pub async fn get_collections(&self, library_id: &str) -> Result<Vec<Collection>> {
        let base_url = self.get_base_url().await;
        let headers = self.get_headers().await?;

        let response = self.client
            .get(&format!("{}/api/libraries/{}/collections", base_url, library_id))
            .headers(headers)
            .send()
            .await
            .context("Failed to fetch collections")?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!("Failed to get collections: {}", response.status()));
        }

        let collections_response: CollectionsResponse = response
            .json()
            .await
            .context("Failed to parse collections response")?;

        Ok(collections_response.results)
    }

    pub async fn get_playlists(&self, library_id: &str) -> Result<Vec<Playlist>> {
        let base_url = self.get_base_url().await;
        let headers = self.get_headers().await?;

        let response = self.client
            .get(&format!("{}/api/libraries/{}/playlists", base_url, library_id))
            .headers(headers)
            .send()
            .await
            .context("Failed to fetch playlists")?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!("Failed to get playlists: {}", response.status()));
        }

        let playlists: Vec<Playlist> = response
            .json()
            .await
            .context("Failed to parse playlists response")?;

        Ok(playlists)
    }

    pub async fn create_collection(&self, library_id: &str, name: &str, description: Option<&str>, book_ids: &[String]) -> Result<Collection> {
        let base_url = self.get_base_url().await;
        let headers = self.get_headers().await?;

        let request_body = serde_json::json!({
            "libraryId": library_id,
            "name": name,
            "description": description,
            "books": book_ids
        });

        let response = self.client
            .post(&format!("{}/api/collections", base_url))
            .headers(headers)
            .json(&request_body)
            .send()
            .await
            .context("Failed to create collection")?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!("Failed to create collection: {}", response.status()));
        }

        let collection: Collection = response
            .json()
            .await
            .context("Failed to parse collection response")?;

        Ok(collection)
    }

    pub async fn delete_collection(&self, collection_id: &str) -> Result<()> {
        let base_url = self.get_base_url().await;
        let headers = self.get_headers().await?;

        let response = self.client
            .delete(&format!("{}/api/collections/{}", base_url, collection_id))
            .headers(headers)
            .send()
            .await
            .context("Failed to delete collection")?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!("Failed to delete collection: {}", response.status()));
        }

        Ok(())
    }

    pub async fn update_collection(&self, collection_id: &str, name: &str, description: Option<&str>) -> Result<Collection> {
        let base_url = self.get_base_url().await;
        let headers = self.get_headers().await?;

        let request_body = serde_json::json!({
            "name": name,
            "description": description
        });

        let response = self.client
            .patch(&format!("{}/api/collections/{}", base_url, collection_id))
            .headers(headers)
            .json(&request_body)
            .send()
            .await
            .context("Failed to update collection")?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!("Failed to update collection: {}", response.status()));
        }

        let collection: Collection = response
            .json()
            .await
            .context("Failed to parse collection response")?;

        Ok(collection)
    }

    pub async fn create_bookmark(
        &self,
        library_item_id: &str,
        bookmark: CreateBookmarkRequest,
    ) -> Result<Bookmark> {
        let base_url = self.get_base_url().await;
        let headers = self.get_headers().await?;

        let response = self.client
            .post(&format!("{}/api/me/bookmark/{}", base_url, library_item_id))
            .headers(headers)
            .json(&bookmark)
            .send()
            .await
            .context("Failed to create bookmark")?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!("Failed to create bookmark: {}", response.status()));
        }

        let bookmark_response: Bookmark = response
            .json()
            .await
            .context("Failed to parse bookmark response")?;

        Ok(bookmark_response)
    }

    pub async fn get_cover_url(&self, library_item_id: &str) -> Result<String> {
        let base_url = self.get_base_url().await;
        let token = self.token.read().await;
        
        if let Some(t) = token.as_ref() {
            Ok(format!(
                "{}/api/items/{}/cover?token={}",
                base_url,
                library_item_id,
                t
            ))
        } else {
            Ok(format!("{}/api/items/{}/cover", base_url, library_item_id))
        }
    }
}
