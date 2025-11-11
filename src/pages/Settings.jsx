import useSettingsStore from '../stores/settings';
import useAuthStore from '../stores/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Settings Page
 * 
 * User preferences and account settings.
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
    <div className="space-y-6">
      
      <h1 className="text-3xl font-bold">Settings</h1>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            {isAuthenticated ? 'Manage your account' : 'Not logged in'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isAuthenticated ? (
            <div>
              <p className="mb-4">
                <strong>Email:</strong> {user?.email}
              </p>
              <Button variant="destructive" onClick={logout}>
                Logout
              </Button>
            </div>
          ) : (
            <p className="text-gray-500">Please log in to access account settings</p>
          )}
        </CardContent>
      </Card>

      {/* Recording Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Recording Settings</CardTitle>
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
                  className="capitalize"
                >
                  {quality}
                </Button>
              ))}
            </div>
          </div>

          {/* Max Duration */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Max Duration: <Badge>{maxVideoDuration / 60} minutes</Badge>
            </label>
            <div className="flex gap-2">
              {[180, 300, 600].map((seconds) => (
                <Button
                  key={seconds}
                  variant={maxVideoDuration === seconds ? 'default' : 'outline'}
                  onClick={() => updateSetting('maxVideoDuration', seconds)}
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