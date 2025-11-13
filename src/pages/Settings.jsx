import { useTheme } from 'next-themes';
import useSettingsStore from '../stores/settings';
import useAuthStore from '../stores/auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Moon, Sun } from 'lucide-react';

function Settings() {
  const { theme, setTheme } = useTheme();
  const { 
    videoQuality, 
    maxVideoDuration, 
    audioOnly,
    updateSetting 
  } = useSettingsStore();
  
  const { user, isAuthenticated, logout } = useAuthStore();

  return (
    <div className="pb-20 md:pb-0">
      
      <div className="md:hidden top-0 bg-card border-b border-border z-10 px-4 py-3">
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
      </div>

      <div className="hidden md:block mb-6">
        <h1 className="text-3xl font-bold mb-2 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your preferences</p>
      </div>

      <div className="p-4 md:p-0 space-y-4 md:space-y-6">

        {/* Account */}
        {isAuthenticated && (
          <Card className="p-4 md:p-6">
            <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 md:text-base">ACCOUNT</h2>
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium dark:text-white">{user?.name || 'User'}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</p>
              </div>
            </div>

            <Button 
              variant="destructive" 
              onClick={logout}
              className="w-full md:w-auto"
            >
              Logout
            </Button>
          </Card>
        )}

        {/* Theme */}
        <Card className="p-4 md:p-6 dark:bg-gray-900 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 md:text-base">APPEARANCE</h2>
          
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center justify-between py-3"
          >
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 dark:text-gray-300" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
              <span className="text-sm font-medium md:text-base dark:text-gray-200">
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </span>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors ${
              theme === 'dark' ? 'bg-violet-600' : 'bg-gray-300'
            }`}>
              <div className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-transform ${
                theme === 'dark' ? 'ml-6' : 'ml-0.5'
              }`} />
            </div>
          </button>
        </Card>

        {/* Recording Settings */}
        <Card className="p-4 md:p-6 dark:bg-gray-900 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 md:text-base">RECORDING</h2>
          
          <div className="mb-4 md:mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium md:text-base dark:text-gray-200">Video Quality</span>
              <Badge variant="secondary" className="capitalize">{videoQuality}</Badge>
            </div>
            <div className="flex gap-2">
              {['low', 'medium', 'high'].map((quality) => (
                <Button
                  key={quality}
                  variant={videoQuality === quality ? 'default' : 'outline'}
                  onClick={() => updateSetting('videoQuality', quality)}
                  className="flex-1 capitalize text-xs md:text-sm"
                  size="sm"
                >
                  {quality}
                </Button>
              ))}
            </div>
          </div>

          <div className="mb-4 md:mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium md:text-base dark:text-gray-200">Max Duration</span>
              <Badge variant="secondary">{maxVideoDuration / 60} min</Badge>
            </div>
            <div className="flex gap-2">
              {[180, 300, 600].map((seconds) => (
                <Button
                  key={seconds}
                  variant={maxVideoDuration === seconds ? 'default' : 'outline'}
                  onClick={() => updateSetting('maxVideoDuration', seconds)}
                  className="flex-1 text-xs md:text-sm"
                  size="sm"
                >
                  {seconds / 60}m
                </Button>
              ))}
            </div>
          </div>

          <button
            onClick={() => updateSetting('audioOnly', !audioOnly)}
            className="w-full flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700"
          >
            <span className="text-sm font-medium md:text-base dark:text-gray-200">Audio Only Mode</span>
            <div className={`w-12 h-6 rounded-full transition-colors ${
              audioOnly ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-700'
            }`}>
              <div className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-transform ${
                audioOnly ? 'ml-6' : 'ml-0.5'
              }`} />
            </div>
          </button>
        </Card>

        {/* About */}
        <Card className="p-4 md:p-6 dark:bg-gray-900 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 md:text-base">ABOUT</h2>
          <div className="space-y-2 text-sm">
            <p className="text-gray-600 dark:text-gray-400">Version 1.0.0</p>
            <p className="text-gray-600 dark:text-gray-400">Made with ❤️</p>
          </div>
        </Card>

      </div>
    </div>
  );
}

export default Settings;