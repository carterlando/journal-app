import { useState, useEffect } from 'react';
import { Moon, Sun, LogOut, User, HardDrive } from 'lucide-react';
import { useTheme } from 'next-themes';
import useAuthStore from '../stores/auth';
import { getUserStorageUsage } from '../services/r2Storage';

/**
 * Settings Page
 * 
 * Clean, minimal settings matching app design
 * - Account details with sign out
 * - Storage usage display
 * - Light/dark theme toggle
 */
function Settings() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();
  
  // Storage state
  const [usage, setUsage] = useState(null);
  const [storageLoading, setStorageLoading] = useState(true);
  const [storageError, setStorageError] = useState(null);

  const FREE_PLAN_LIMIT = 10 * 1024 * 1024 * 1024; // 10 GB

  /**
   * Format bytes to GB with 2 decimal places
   * Always displays in GB for consistency
   */
  const formatToGB = (bytes) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  /**
   * Fetch storage usage on mount
   */
  useEffect(() => {
    const fetchUsage = async () => {
      if (!user) {
        setStorageLoading(false);
        return;
      }

      try {
        setStorageLoading(true);
        setStorageError(null);
        const data = await getUserStorageUsage(user.id);
        setUsage(data);
      } catch (err) {
        console.error('Failed to fetch storage usage:', err);
        setStorageError('Unable to load storage info');
      } finally {
        setStorageLoading(false);
      }
    };

    fetchUsage();
  }, [user]);

  const usedBytes = usage?.bytes || 0;
  const usedPercent = (usedBytes / FREE_PLAN_LIMIT) * 100;
  const remainingBytes = FREE_PLAN_LIMIT - usedBytes;

  /**
   * Handle sign out
   */
  const handleLogout = async () => {
    if (window.confirm('Sign out of your account?')) {
      await logout();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 pb-32 pt-6">
        {/* Header */}
        <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>

        {/* Account Section */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">ACCOUNT</h2>
          <div className="bg-card rounded-2xl overflow-hidden">
            {/* User Info */}
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <div className="w-12 h-12 rounded-full bg-violet-500 flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Signed in as</p>
                <p className="text-base font-medium text-foreground truncate">{user?.email}</p>
              </div>
            </div>
            
            {/* Sign Out */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-4 text-red-500 hover:bg-muted/50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Storage Section */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">STORAGE</h2>
          <div className="bg-card rounded-2xl p-4">
            {storageLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : storageError ? (
              <p className="text-sm text-red-500 text-center py-4">{storageError}</p>
            ) : (
              <>
                {/* Storage Icon and Stats */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center">
                    <HardDrive className="w-6 h-6 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{formatToGB(usedBytes)}</p>
                    <p className="text-sm text-muted-foreground">of {formatToGB(FREE_PLAN_LIMIT)} used</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        usedPercent > 90 ? 'bg-red-500' : 
                        usedPercent > 75 ? 'bg-yellow-500' : 
                        'bg-violet-500'
                      }`}
                      style={{ width: `${Math.min(usedPercent, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{usage?.count || 0} videos</span>
                  <span className="text-muted-foreground">{formatToGB(remainingBytes)} available</span>
                </div>

                {/* Warning */}
                {usedPercent > 80 && (
                  <div className={`mt-4 text-sm p-3 rounded-xl ${
                    usedPercent > 90 
                      ? 'bg-red-500/10 text-red-500' 
                      : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500'
                  }`}>
                    {usedPercent > 90 
                      ? '⚠️ Storage almost full. Delete old entries to free space.'
                      : '📊 Storage getting full. Monitor your usage.'}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Appearance Section */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">APPEARANCE</h2>
          <div className="bg-card rounded-2xl p-4">
            <p className="text-sm text-muted-foreground mb-3">Theme</p>
            <div className="flex gap-2">
              <button
                onClick={() => setTheme('light')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                  theme === 'light'
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                <Sun className="w-5 h-5" />
                Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                  theme === 'dark'
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                <Moon className="w-5 h-5" />
                Dark
              </button>
            </div>
          </div>
        </div>

        {/* App Version */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Story Time v1.0.0</p>
        </div>
      </div>
    </div>
  );
}

export default Settings;