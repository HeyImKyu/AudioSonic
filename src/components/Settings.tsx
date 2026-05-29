import { useEffect } from 'react';
import { useStore } from '../store';
import { X, LogOut, Headphones, Sun, Moon } from 'lucide-react';

export default function Settings({ onClose }: { onClose: () => void }) {
  const { user, setAuthenticated, setToken, setUser } = useStore();

  useEffect(() => {
    // Load saved preferences
  }, []);

  const handleLogout = () => {
    setAuthenticated(false);
    setToken(null);
    setUser(null);
    localStorage.removeItem('serverUrl');
    localStorage.removeItem('token');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-text">Settings</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* User Info */}
          <div className="flex items-center space-x-3 p-4 bg-surface-hover rounded-lg">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <span className="text-primary font-semibold text-lg">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <p className="font-medium text-text">{user?.username || 'User'}</p>
              <p className="text-sm text-text-secondary">Logged in</p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
