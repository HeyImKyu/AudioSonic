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
        assert_eq!(metadata.mime_type, "audio/mp4");
    }
}
