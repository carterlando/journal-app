import useSettingsStore from '../stores/settings';
import useAuthStore from '../stores/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Moon, Sun, LogOut, User } from 'lucide-react';
import { useTheme } from 'next-themes';

/**
 * Settings Page
 */
function Settings() {
  const { 
    videoQuality, 
    maxVideoDuration, 
    audioOnly,
    updateSetting 
  } = useSettingsStore();

  const { theme, setTheme } = useTheme();
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 bg-card border-b border-border z-10 px-4 py-3">
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your preferences</p>
      </div>

      {/* Account Section - Only show on mobile when authenticated */}
      {isAuthenticated && (
        <Card className="md:hidden">
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
              <User className="w-5 h-5 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Signed in as</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={logout}
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Theme</label>
            <div className="flex gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                onClick={() => setTheme('light')}
                className="flex-1"
              >
                <Sun className="mr-2 h-4 w-4" />
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                onClick={() => setTheme('dark')}
                className="flex-1"
              >
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                onClick={() => setTheme('system')}
                className="flex-1"
              >
                System
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recording Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Recording</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Video Quality */}
          <div>
            <label className="text-sm font-medium mb-2 block">Video Quality</label>
            <div className="flex gap-2">
              {['low', 'medium', 'high'].map((quality) => (
                <Button
                  key={quality}
                  variant={videoQuality === quality ? 'default' : 'outline'}
                  onClick={() => updateSetting('videoQuality', quality)}
                  className="flex-1 capitalize"
                >
                  {quality}
                </Button>
              ))}
            </div>
          </div>

          {/* Max Duration */}
          <div>
            <label className="text-sm font-medium mb-2 block">Maximum Duration</label>
            <div className="flex gap-2">
              {[60, 180, 300, 600].map((seconds) => (
                <Button
                  key={seconds}
                  variant={maxVideoDuration === seconds ? 'default' : 'outline'}
                  onClick={() => updateSetting('maxVideoDuration', seconds)}
                  className="flex-1"
                >
                  {seconds / 60} min
                </Button>
              ))}
            </div>
          </div>

          {/* Audio Only */}
          <div>
            <label className="text-sm font-medium mb-2 block">Recording Mode</label>
            <Button
              variant={audioOnly ? 'default' : 'outline'}
              onClick={() => updateSetting('audioOnly', !audioOnly)}
              className="w-full"
            >
              {audioOnly ? '🎤 Audio Only' : '📹 Video + Audio'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Settings;