import { useState } from 'react';
import useEntriesStore from '../stores/entries';
import VideoRecorder from './VideoRecorder';
import { ChevronLeft, ChevronRight, Plus, Check, X, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Calendar Component
 * 
 * Colorful calendar with consistent cell heights
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
      {/* Calendar Header */}
      <div className="bg-violet-500/15 rounded-xl p-6 border-2 border-violet-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-violet-600 dark:text-violet-400">
              {monthNames[month]}
            </h2>
            <p className="text-lg text-muted-foreground mt-1">{year}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={previousMonth}
              className="hover:bg-violet-500/20 hover:border-violet-500/50 hover:text-violet-600"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextMonth}
              className="hover:bg-violet-500/20 hover:border-violet-500/50 hover:text-violet-600"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-card rounded-xl border-2 border-border overflow-hidden shadow-lg">
        {/* Day Names Header */}
        <div className="grid grid-cols-7 bg-violet-500/10 border-b-2 border-border">
          {dayNames.map(day => (
            <div
              key={day}
              className="text-center py-4 text-sm font-bold text-violet-600 dark:text-violet-400"
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
                  h-24 md:h-28 lg:h-32 border-r border-b border-border/50 p-3 flex flex-col items-center justify-center transition-all
                  ${day ? 'cursor-pointer hover:bg-violet-500/15 hover:scale-105 hover:shadow-md hover:z-10' : 'bg-muted/40'}
                  ${isTodayDate ? 'bg-violet-500/20 ring-2 ring-violet-500 relative' : ''}
                  ${isPastDate && hasEntriesDate ? 'bg-emerald-500/15' : ''}
                `}
              >
                {day && (
                  <>
                    {/* Today badge */}
                    {isTodayDate && (
                      <div className="absolute top-1 right-1">
                        <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></div>
                      </div>
                    )}

                    {/* Day Number */}
                    <div className={`
                      text-sm font-bold mb-2
                      ${isTodayDate ? 'text-violet-600 dark:text-violet-400 text-lg' : ''}
                      ${isPastDate && hasEntriesDate ? 'text-emerald-600 dark:text-emerald-400' : ''}
                      ${isPastDate && !hasEntriesDate ? 'text-foreground' : ''}
                      ${isFutureDate ? 'text-foreground' : ''}
                    `}>
                      {day}
                    </div>

                    {/* Day Indicator */}
                    <div>
                      {isTodayDate && (
                        <div className="w-12 h-12 rounded-full bg-violet-500 hover:bg-violet-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all">
                          <Plus className="w-6 h-6" />
                        </div>
                      )}
                      {isPastDate && hasEntriesDate && (
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-md transition-colors">
                            <Check className="w-5 h-5" />
                          </div>
                          {entryCount > 1 && (
                            <div className="flex gap-0.5">
                              {Array.from({ length: Math.min(entryCount, 3) }).map((_, i) => (
                                <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {isPastDate && !hasEntriesDate && (
                        <div className="w-10 h-10 rounded-full text-red-600 dark:text-red-400 flex items-center justify-center border-2 border-dashed border-red-600 dark:border-red-400">
                          <X className="w-5 h-5" />
                        </div>
                      )}
                      {isFutureDate && (
                        <div className="w-10 h-10 opacity-0">
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
          <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center shadow-sm">
            <Plus className="w-4 h-4 text-white" />
          </div>
          <span className="text-muted-foreground">Today - Tap to record</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
            <Check className="w-4 h-4 text-white" />
          </div>
          <span className="text-muted-foreground">Has entries</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-dashed border-red-600">
            <X className="w-4 h-4 text-red-600" />
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