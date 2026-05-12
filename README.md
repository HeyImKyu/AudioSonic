# AudioSonic

A gorgeous, modern, and blazing fast Audiobookshelf desktop client. Inspired by Winamp, built for the future with Tauri & React.

![AudioSonic](https://img.shields.io/badge/AudioSonic-v0.1.0-purple)
![Tauri](https://img.shields.io/badge/Tauri-2.0-blue)
![React](https://img.shields.io/badge/React-18.2-blue)
![Rust](https://img.shields.io/badge/Rust-1.74-orange)

## Features

- **Beautiful UI**: Winamp-inspired design with glassmorphism effects and modern aesthetics
- **Library Management**: Browse and manage your audiobook and podcast libraries
- **Playback Controls**: Full-featured audio player with seek, volume, and speed controls
- **Progress Sync**: Automatically sync listening progress with your Audiobookshelf server
- **Queue System**: Build and manage playback queues
- **Search**: Quickly find books, authors, and series
- **Collections & Playlists**: Access your custom collections and playlists
- **Bookmarks**: Save your favorite moments in audiobooks
- **Dark Mode**: Beautiful dark theme optimized for long listening sessions

## Tech Stack

- **Backend**: Rust + Tauri 2.0
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS with custom glassmorphism effects
- **State Management**: Zustand
- **Icons**: Lucide React
- **Animations**: Framer Motion

## Prerequisites

- Node.js 18+ and npm
- Rust 1.74+ and Cargo
- Tauri CLI (installed via npm)
- An Audiobookshelf server instance

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/audiosonic.git
   cd audiosonic
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Tauri CLI** (if not already installed)
   ```bash
   npm install -g @tauri-apps/cli
   ```

## Development

Run the development server:

```bash
npm run tauri dev
```

This will start:
- The Tauri development window
- The Vite development server for hot-reloading
- The Rust backend with auto-reload on changes

## Building

### Build for your current platform

```bash
npm run tauri build
```

The built application will be in `src-tauri/target/release/bundle/`.

### Build for specific platforms

```bash
# Linux
npm run tauri build -- --target x86_64-unknown-linux-gnu

# macOS
npm run tauri build -- --target x86_64-apple-darwin

# Windows
npm run tauri build -- --target x86_64-pc-windows-msvc
```

## Configuration

AudioSonic connects to your Audiobookshelf server. On first launch, you'll need to:

1. Enter your Audiobookshelf server URL (e.g., `https://audiobookshelf.example.com`)
2. Enter your username and password
3. Click "Connect"

Your credentials are stored locally and used to authenticate with the server.

## Usage

### Library Browsing
- Select a library from the sidebar
- Browse books/podcasts in a grid view
- Click on an item to start playback

### Playback Controls
- Use the bottom player bar to control playback
- Seek through the audio with the progress bar
- Adjust volume with the volume slider
- Skip forward/backward with the control buttons

### Queue Management
- Add items to your queue
- Reorder the queue
- Clear the queue when done

### Search
- Use the search view to find specific books, authors, or series
- Filter by media type (books vs podcasts)

### Progress Sync
- Your listening progress is automatically synced with the server
- Resume from where you left off on any device

## Roadmap

- [ ] Gapless playback
- [ ] Crossfade support
- [ ] Equalizer with presets
- [ ] Offline mode
- [ ] Download support
- [ ] Lyrics display
- [ ] Statistics dashboard
- [ ] Theme customization
- [ ] Keyboard shortcuts
- [ ] Mini player mode

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Audiobookshelf](https://www.audiobookshelf.org/) - The amazing self-hosted audiobook server
- [Tauri](https://tauri.app/) - The framework that makes this possible
- [Psysonic](https://github.com/Psychotoxical/psysonic) - Inspiration for the UI design
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Lucide](https://lucide.dev/) - Beautiful icon library

## Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

Built with ❤️ for audiobook lovers everywhere.
