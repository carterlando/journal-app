import { useState } from 'react';
import Calendar from '../components/Calendar';
import DayView from '../components/DayView';
import useAuthStore from '../stores/auth';
import AuthModal from '../components/AuthModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Video, Calendar as CalendarIcon, Lock } from 'lucide-react';

/**
 * Home Page
 * 
 * Shows auth prompt for logged-out users
 * Shows calendar for logged-in users
 */
function Home() {
  const { isAuthenticated } = useAuthStore();
  const [selectedDay, setSelectedDay] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleDayClick = (date, entries) => {
    setSelectedDay({ date, entries });
  };

  const handleCloseDayView = () => {
    setSelectedDay(null);
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
                    Your journals are encrypted and only accessible by you
                  </p>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => setShowAuthModal(true)}
              className="w-full"
              size="lg"
            >
              Get Started
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Sign up to start journaling today
            </p>
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

  // Show calendar for authenticated users
  return (
    <div className="space-y-6">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 bg-card border-b border-border z-10 px-4 py-3">
        <h1 className="text-xl font-bold text-foreground">My Journal</h1>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block">
        <h1 className="text-3xl font-bold text-foreground">My Journal</h1>
        <p className="text-muted-foreground">Record and track your daily moments</p>
      </div>

      {/* Calendar */}
      <Calendar onDayClick={handleDayClick} />

      {/* Day View Modal */}
      {selectedDay && (
        <DayView
          date={selectedDay.date}
          entries={selectedDay.entries}
          onClose={handleCloseDayView}
        />
      )}
    </div>
  );
}

export default Home;