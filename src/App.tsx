import { useStore } from './store';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Library from './components/Library';
import Collections from './components/Collections';
import Player from './components/Player';
import QueuePanel from './components/QueuePanel';
import ThemeSelector from './components/ThemeSelector';
import './App.css';

function App() {
  const { isAuthenticated, sidebarView } = useStore();

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderContent = () => {
    switch (sidebarView) {
      case 'library':
        return <Library />;
      case 'collections':
        return <Collections />;
      case 'playlists':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-text mb-4">Playlists</h2>
            <p className="text-text-secondary">Playlists feature coming soon</p>
          </div>
        );
      case 'search':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-text mb-4">Search</h2>
            <p className="text-text-secondary">Search feature coming soon</p>
          </div>
        );
      default:
        return <Library />;
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-text" style={{ backdropFilter: 'var(--glass-blur)' }}>
        <div className="flex h-screen">
          <Sidebar />
          <div className="flex-1 flex">
            <div className="flex-1 overflow-y-auto pb-24">
              <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-4">
                    <h1 className="text-2xl font-bold text-text">
                      {sidebarView === 'library' ? 'Library' : 
                       sidebarView === 'collections' ? 'Collections' :
                       sidebarView === 'playlists' ? 'Playlists' :
                       sidebarView === 'search' ? 'Search' : 'Library'}
                    </h1>
                  </div>
                  <ThemeSelector />
                </div>
              </div>
              <div className="p-6">
                {renderContent()}
              </div>
            </div>
            <QueuePanel />
          </div>
        </div>
        <Player />
      </div>
    </ThemeProvider>
  );
}


export default App;
