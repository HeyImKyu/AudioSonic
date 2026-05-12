import { useState, useEffect } from 'react';
import { useStore } from './store';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Library from './components/Library';
import Player from './components/Player';
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
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Collections</h2>
            <p className="text-gray-400">Collections feature coming soon</p>
          </div>
        );
      case 'playlists':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Playlists</h2>
            <p className="text-gray-400">Playlists feature coming soon</p>
          </div>
        );
      case 'search':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Search</h2>
            <p className="text-gray-400">Search feature coming soon</p>
          </div>
        );
      default:
        return <Library />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <DebugLog />
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 overflow-y-auto pb-24">
          {renderContent()}
        </div>
      </div>
      <Player />
    </div>
  );
}

function DebugLog() {
  const [logs, setLogs] = useState<string[]>([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const addLog = (type: string, ...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      setLogs((prev: string[]) => [...prev, `[${type}] ${message}`].slice(-50));
    };

    console.log = (...args) => {
      originalLog(...args);
      addLog('LOG', ...args);
    };
    console.error = (...args) => {
      originalError(...args);
      addLog('ERROR', ...args);
    };
    console.warn = (...args) => {
      originalWarn(...args);
      addLog('WARN', ...args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  return (
    <>
      <button
        onClick={() => setShow(!show)}
        className="fixed top-4 right-4 z-50 bg-gray-800 text-white px-3 py-1 rounded text-xs opacity-50 hover:opacity-100"
      >
        Debug
      </button>
      {show && (
        <div className="fixed top-12 right-4 z-50 w-96 h-64 bg-gray-900 border border-gray-700 rounded-lg p-2 overflow-hidden">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white text-xs font-bold">Debug Logs</span>
            <button onClick={() => setLogs([])} className="text-gray-400 text-xs">Clear</button>
          </div>
          <div className="h-48 overflow-y-auto text-xs font-mono">
            {logs.map((log: string, i: number) => (
              <div key={i} className={`mb-1 ${log.startsWith('[ERROR]') ? 'text-red-400' : log.startsWith('[WARN]') ? 'text-yellow-400' : 'text-green-400'}`}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default App;
