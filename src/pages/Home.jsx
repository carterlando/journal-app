import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Video, Calendar as CalendarIcon, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import useEntriesStore from '../stores/entries';
import useAuthStore from '../stores/auth';
import AuthModal from '../components/AuthModal';
import ReelViewer from '../components/ReelViewer';
import VideoRecorder from '../components/VideoRecorder';

/**
 * Home Page Component
 * 
 * For authenticated users: Shows "Remember this day" feature + Record button
 * For non-authenticated users: Shows welcome screen with auth prompt
 */
function Home() {
  const { isAuthenticated } = useAuthStore();
  const { entries, loading } = useEntriesStore();
  const [memoryEntry, setMemoryEntry] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showReel, setShowReel] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const [memoryCalculated, setMemoryCalculated] = useState(false);

  /**
   * Find a memory entry using cascading search logic
   * This runs ONLY ONCE when user is authenticated and entries are loaded
   * The memory entry stays static until page refresh
   */
  useEffect(() => {
    // Only calculate once
    if (!isAuthenticated || loading || entries.length === 0 || memoryCalculated) {
      return;
    }

    const today = new Date();
    const foundEntry = findMemoryEntry(entries, today);
    setMemoryEntry(foundEntry);
    setMemoryCalculated(true); // Mark as calculated so it doesn't change
  }, [isAuthenticated, entries, loading, memoryCalculated]);

  /**
   * Finds a memory entry using cascading search logic:
   * 1. Check previous years for exact same day
   * 2. If none, check +/- 7 days in previous years
   * 3. If none, check same month in previous years
   * 4. If none, check same year (any month) in previous years
   * 5. Repeat logic going back month by month (1 month ago, 2 months ago, etc.)
   * 6. If still nothing, return any random entry
   * 
   * IMPORTANT: Filters out today's entries - only shows past memories
   */
  const findMemoryEntry = (entries, referenceDate) => {
    if (entries.length === 0) return null;

    // Get today at midnight for comparison
    const todayMidnight = new Date(referenceDate);
    todayMidnight.setHours(0, 0, 0, 0);

    // Filter out entries from today and future
    // We want ONLY past entries, not today's
    const pastEntries = entries.filter(entry => {
      const entryDate = new Date(entry.recordedAt);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate < todayMidnight;
    });

    if (pastEntries.length === 0) return null;

    // Try progressively going back in time (today, 1 month ago, 2 months ago, etc.)
    for (let monthsBack = 0; monthsBack < 120; monthsBack++) {
      const targetDate = new Date(referenceDate);
      targetDate.setMonth(targetDate.getMonth() - monthsBack);

      const targetYear = targetDate.getFullYear();
      const targetMonth = targetDate.getMonth() + 1;
      const targetDay = targetDate.getDate();

      // 1. Try exact day match in previous years
      const exactDayMatches = pastEntries.filter(entry => {
        const entryDate = new Date(entry.recordedAt);
        const entryYear = entryDate.getFullYear();
        const entryMonth = entryDate.getMonth() + 1;
        const entryDay = entryDate.getDate();

        return entryYear < targetYear &&
               entryMonth === targetMonth &&
               entryDay === targetDay;
      });

      if (exactDayMatches.length > 0) {
        return getRandomEntry(exactDayMatches);
      }

      // 2. Try +/- 7 days in previous years
      const weekRangeMatches = pastEntries.filter(entry => {
        const entryDate = new Date(entry.recordedAt);
        const entryYear = entryDate.getFullYear();
        
        if (entryYear >= targetYear) return false;

        // Calculate day difference
        const targetDateInEntryYear = new Date(entryYear, targetMonth - 1, targetDay);
        const dayDiff = Math.abs(
          Math.floor((entryDate.getTime() - targetDateInEntryYear.getTime()) / (1000 * 60 * 60 * 24))
        );

        return dayDiff <= 7;
      });

      if (weekRangeMatches.length > 0) {
        return getClosestEntry(weekRangeMatches, new Date(targetYear - 1, targetMonth - 1, targetDay));
      }

      // 3. Try same month in previous years
      const sameMonthMatches = pastEntries.filter(entry => {
        const entryDate = new Date(entry.recordedAt);
        const entryYear = entryDate.getFullYear();
        const entryMonth = entryDate.getMonth() + 1;

        return entryYear < targetYear &&
               entryMonth === targetMonth;
      });

      if (sameMonthMatches.length > 0) {
        return getClosestEntry(sameMonthMatches, new Date(targetYear - 1, targetMonth - 1, targetDay));
      }

      // 4. Try same year (any month) in previous years
      const sameYearMatches = pastEntries.filter(entry => {
        const entryDate = new Date(entry.recordedAt);
        const entryYear = entryDate.getFullYear();

        return entryYear < targetYear;
      });

      if (sameYearMatches.length > 0) {
        return getClosestEntry(sameYearMatches, new Date(targetYear - 1, targetMonth - 1, targetDay));
      }
    }

    // 6. If nothing found after all searches, return any random entry
    return getRandomEntry(pastEntries);
  };

  /**
   * Gets a random entry from an array of entries
   */
  const getRandomEntry = (entries) => {
    const randomIndex = Math.floor(Math.random() * entries.length);
    return entries[randomIndex];
  };

  /**
   * Gets the entry closest to the target date
   */
  const getClosestEntry = (entries, targetDate) => {
    return entries.reduce((closest, entry) => {
      const entryDate = new Date(entry.recordedAt);
      const closestDate = new Date(closest.recordedAt);
      
      const entryDiff = Math.abs(entryDate.getTime() - targetDate.getTime());
      const closestDiff = Math.abs(closestDate.getTime() - targetDate.getTime());
      
      return entryDiff < closestDiff ? entry : closest;
    });
  };

  /**
   * Open the reel viewer for the memory entry
   */
  const handleMemoryClick = () => {
    if (memoryEntry) {
      // Find the index of the memory entry in the full entries list
      const entryIndex = entries.findIndex(e => e.id === memoryEntry.id);
      setShowReel(true);
    }
  };

  // Show welcome screen for non-authenticated users
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Card className="w-full max-w-2xl bg-[hsl(var(--card))]">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Video className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-3xl mb-2">Welcome to Video Journal</CardTitle>
            <CardDescription className="text-base">
              Record your daily thoughts and moments with video or audio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Video className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Record Daily Entries</h3>
                  <p className="text-sm text-muted-foreground">
                    Capture your thoughts with video or audio journals
                  </p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Track Your Journey</h3>
                  <p className="text-sm text-muted-foreground">
                    View your entries on a beautiful calendar interface
                  </p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Private & Secure</h3>
                  <p className="text-sm text-muted-foreground">
                    Your memories are encrypted and stored securely
                  </p>
                </div>
              </div>
            </div>
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => setShowAuthModal(true)}
            >
              Get Started
            </Button>
          </CardContent>
        </Card>

        {showAuthModal && (
          <AuthModal
            onClose={() => setShowAuthModal(false)}
            onSuccess={() => setShowAuthModal(false)}
          />
        )}
      </div>
    );
  }

  // Authenticated user view
  return (
    <>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Remember this day section */}
        {memoryEntry && (
          <div className="mb-8">
            <h2 className="text-lg font-medium text-muted-foreground mb-4">
              Remember this day
            </h2>
            <div onClick={handleMemoryClick}>
              <Card className="overflow-hidden hover:ring-2 hover:ring-primary transition-all cursor-pointer">
                {/* Video thumbnail */}
                <div className="relative aspect-video bg-muted">
                  {memoryEntry.thumbnailUrl ? (
                    <img 
                      src={memoryEntry.thumbnailUrl} 
                      alt="Memory"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                {/* Entry date */}
                <div className="p-4">
                  <p className="text-sm text-muted-foreground">
                    {new Date(memoryEntry.recordedAt).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Empty state if no entries exist */}
        {!loading && !memoryEntry && entries.length === 0 && (
          <div className="mb-8">
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                No memories yet. Start recording to create your first memory!
              </p>
            </Card>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="mb-8">
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Loading memories...</p>
            </Card>
          </div>
        )}

        {/* Record button - centered and prominent */}
        <div className="flex justify-center">
          <Button 
            size="lg" 
            className="w-full max-w-sm h-14 text-lg"
            onClick={() => setShowRecorder(true)}
          >
            <Camera className="mr-2 h-5 w-5" />
            Record
          </Button>
        </div>
      </div>

      {/* Reel Viewer Modal - Opens when clicking Remember this day */}
      {showReel && memoryEntry && (
        <ReelViewer
          entries={entries}
          initialIndex={entries.findIndex(e => e.id === memoryEntry.id)}
          onClose={() => setShowReel(false)}
        />
      )}

      {/* Video Recorder Modal - Opens when clicking Record button */}
      {showRecorder && (
        <VideoRecorder onClose={() => setShowRecorder(false)} />
      )}
    </>
  );
}

export default Home;