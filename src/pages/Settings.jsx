import useSettingsStore from '../stores/settings';
import useAuthStore from '../stores/auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Settings Page
 * 
 * Mobile: Full width cards
 * Desktop: Max-width centered layout
 */
function Settings() {
  const { 
    videoQuality, 
    maxVideoDuration, 
    audioOnly,
    updateSetting 
  } = useSettingsStore();
  
  const { user, isAuthenticated, logout } = useAuthStore();

  return (
    <div className="pb-20 md:pb-0">
      
      {/* Header - Mobile */}
      <div className="md:hidden sticky top-0 bg-white border-b border-gray-200 z-10 px-4 py-3">
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      {/* Header - Desktop */}
      <div className="hidden md:block mb-6">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600">Manage your preferences</p>
      </div>

      <div className="p-4 md:p-0 space-y-4 md:space-y-6">

        {/* Account Section */}
        {isAuthenticated && (
          <Card className="p-4 md:p-6">
            <h2 className="text-sm font-semibold text-gray-600 mb-3 md:text-base">ACCOUNT</h2>
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium">{user?.name || 'User'}</p>
                <p className="text-sm text-gray-600">{user?.email}</p>
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

        {/* Recording Settings */}
        <Card className="p-4 md:p-6">
          <h2 className="text-sm font-semibold text-gray-600 mb-3 md:text-base">RECORDING</h2>
          
          {/* Video Quality */}
          <div className="mb-4 md:mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium md:text-base">Video Quality</span>
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

          {/* Max Duration */}
          <div className="mb-4 md:mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium md:text-base">Max Duration</span>
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

          {/* Audio Only Toggle */}
          <button
            onClick={() => updateSetting('audioOnly', !audioOnly)}
            className="w-full flex items-center justify-between py-3 border-t border-gray-200"
          >
            <span className="text-sm font-medium md:text-base">Audio Only Mode</span>
            <div className={`w-12 h-6 rounded-full transition-colors ${
              audioOnly ? 'bg-violet-600' : 'bg-gray-300'
            }`}>
              <div className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-transform ${
                audioOnly ? 'ml-6' : 'ml-0.5'
              }`} />
            </div>
          </button>
        </Card>

        {/* App Info */}
        <Card className="p-4 md:p-6">
          <h2 className="text-sm font-semibold text-gray-600 mb-3 md:text-base">ABOUT</h2>
          <div className="space-y-2 text-sm">
            <p className="text-gray-600">Version 1.0.0</p>
            <p className="text-gray-600">Made with ❤️</p>
          </div>
        </Card>

      </div>
    </div>
  );
}

export default Settings;