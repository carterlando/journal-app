import { useState } from 'react';
import useEntriesStore from '../stores/entries';
import VideoRecorder from './VideoRecorder';
import { ChevronLeft, ChevronRight, Plus, Check, X, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Calendar Component
 * 
 * Colorful, professional calendar with entry indicators
 */
function Calendar({ onDayClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showRecorder, setShowRecorder] = useState(false);
  const { entries } = useEntriesStore();

  // Get entries by date map for quick lookup
  const getEntriesByDate = () => {
    const dateMap = {};
    entries.forEach(entry => {
      const date = new Date(entry.recordedAt);
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = [];
      }
      dateMap[dateKey].push(entry);
    });
    return dateMap;
  };

  const entriesByDate = getEntriesByDate();

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Generate calendar days
  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Navigate months
  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1));
  };

  // Check if date is today
  const isToday = (day) => {
    return day === today.getDate() && 
           month === today.getMonth() && 
           year === today.getFullYear();
  };

  // Check if date is in the past
  const isPast = (day) => {
    const date = new Date(year, month, day);
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return date < todayMidnight;
  };

  // Check if date is in the future
  const isFuture = (day) => {
    const date = new Date(year, month, day);
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return date > todayMidnight;
  };

  // Check if date has entries
  const hasEntries = (day) => {
    const dateKey = `${year}-${month}-${day}`;
    return entriesByDate[dateKey] && entriesByDate[dateKey].length > 0;
  };

  // Get entry count for a day
  const getEntryCount = (day) => {
    const dateKey = `${year}-${month}-${day}`;
    return entriesByDate[dateKey]?.length || 0;
  };

  // Handle day click
  const handleDayClick = (day) => {
    if (!day) return;
    
    if (isToday(day)) {
      setShowRecorder(true);
    } else if (isPast(day)) {
      const dateKey = `${year}-${month}-${day}`;
      const dayEntries = entriesByDate[dateKey] || [];
      onDayClick(new Date(year, month, day), dayEntries);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Calendar Header with gradient */}
      <div className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              {monthNames[month]}
            </h2>
            <p className="text-lg text-muted-foreground mt-1">{year}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={previousMonth}
              className="hover:bg-primary/10 hover:border-primary/50"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextMonth}
              className="hover:bg-primary/10 hover:border-primary/50"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        {/* Day Names Header with gradient */}
        <div className="grid grid-cols-7 bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5 border-b border-border">
          {dayNames.map(day => (
            <div
              key={day}
              className="text-center py-4 text-sm font-bold text-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const isTodayDate = day && isToday(day);
            const isPastDate = day && isPast(day);
            const isFutureDate = day && isFuture(day);
            const hasEntriesDate = day && hasEntries(day);
            const entryCount = day && getEntryCount(day);

            return (
              <div
                key={index}
                onClick={() => handleDayClick(day)}
                className={`
                  aspect-square border-r border-b border-border/50 p-3 flex flex-col items-center justify-center transition-all
                  ${day ? 'cursor-pointer hover:bg-gradient-to-br hover:from-primary/10 hover:to-purple-500/10 hover:scale-105 hover:shadow-md hover:z-10' : 'bg-muted/30'}
                  ${isTodayDate ? 'bg-gradient-to-br from-primary/20 to-purple-500/20 ring-2 ring-primary/50 relative' : ''}
                  ${isPastDate && hasEntriesDate ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10' : ''}
                  ${isPastDate && !hasEntriesDate ? 'bg-muted/50' : ''}
                `}
              >
                {day && (
                  <>
                    {/* Today badge */}
                    {isTodayDate && (
                      <div className="absolute top-1 right-1">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-purple-500 animate-pulse"></div>
                      </div>
                    )}

                    {/* Day Number */}
                    <div className={`
                      text-sm font-bold mb-2
                      ${isTodayDate ? 'text-primary text-lg' : ''}
                      ${isPastDate ? 'text-foreground' : ''}
                      ${isFutureDate ? 'text-muted-foreground' : ''}
                    `}>
                      {day}
                    </div>

                    {/* Day Indicator */}
                    <div>
                      {isTodayDate && (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary via-purple-500 to-pink-500 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow animate-pulse-subtle">
                          <Plus className="w-6 h-6" />
                        </div>
                      )}
                      {isPastDate && hasEntriesDate && (
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center shadow-md">
                            <Check className="w-5 h-5" />
                          </div>
                          {entryCount > 1 && (
                            <div className="flex gap-0.5">
                              {Array.from({ length: Math.min(entryCount, 3) }).map((_, i) => (
                                <div key={i} className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {isPastDate && !hasEntriesDate && (
                        <div className="w-10 h-10 rounded-full bg-muted/80 text-muted-foreground flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                          <X className="w-5 h-5" />
                        </div>
                      )}
                      {isFutureDate && (
                        <div className="w-10 h-10 rounded-full bg-muted/50 text-muted-foreground/50 flex items-center justify-center border border-dashed border-muted-foreground/20">
                          <Video className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
            <Plus className="w-4 h-4 text-white" />
          </div>
          <span className="text-muted-foreground">Today - Tap to record</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
          <span className="text-muted-foreground">Has entries</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-muted/80 flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
            <X className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="text-muted-foreground">No entries</span>
        </div>
      </div>

      {/* Video Recorder Modal */}
      {showRecorder && (
        <VideoRecorder onClose={() => setShowRecorder(false)} />
      )}
    </div>
  );
}

export default Calendar;