import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, HardDrive } from 'lucide-react';
import { getUserStorageUsage, formatBytes } from '../services/r2Storage';
import useAuthStore from '../stores/auth';

/**
 * Storage Panel Component
 * 
 * Shows R2 storage usage vs 10GB free plan limit
 * Why: Help users track their storage and avoid hitting limits
 */
function StoragePanel() {
  const { user } = useAuthStore();
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const FREE_PLAN_LIMIT = 10 * 1024 * 1024 * 1024; // 10 GB in bytes

  useEffect(() => {
    const fetchUsage = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await getUserStorageUsage(user.id);
        setUsage(data);
      } catch (err) {
        console.error('Failed to fetch storage usage:', err);
        setError('Unable to load storage info');
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, [user]);

  if (!user) return null;

  const usedBytes = usage?.bytes || 0;
  const usedPercent = (usedBytes / FREE_PLAN_LIMIT) * 100;
  const remainingBytes = FREE_PLAN_LIMIT - usedBytes;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="w-5 h-5" />
          R2 Storage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-sm text-destructive">{error}</div>
        ) : (
          <>
            {/* Usage stats */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Used</p>
                <p className="text-lg font-semibold">{formatBytes(usedBytes)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-lg font-semibold">{formatBytes(remainingBytes)}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {usage?.count || 0} files
                </span>
                <span className="text-muted-foreground">
                  {usedPercent.toFixed(1)}% of 10 GB
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    usedPercent > 90 ? 'bg-destructive' : 
                    usedPercent > 75 ? 'bg-yellow-500' : 
                    'bg-primary'
                  }`}
                  style={{ width: `${Math.min(usedPercent, 100)}%` }}
                />
              </div>
            </div>

            {/* Warning if nearing limit */}
            {usedPercent > 80 && (
              <div className={`text-sm p-3 rounded-lg ${
                usedPercent > 90 ? 'bg-destructive/10 text-destructive' : 
                'bg-yellow-500/10 text-yellow-700 dark:text-yellow-500'
              }`}>
                {usedPercent > 90 ? (
                  <>⚠️ Storage almost full. Consider deleting old entries.</>
                ) : (
                  <>📊 Storage getting full. Monitor your usage.</>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default StoragePanel;