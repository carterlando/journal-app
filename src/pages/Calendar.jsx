import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, Play, Trash2 } from 'lucide-react';
import { Calendar as CalendarIcon } from 'lucide-react';
import useEntriesStore from '../stores/entries';
import ReelViewer from '../components/ReelViewer';
import { formatTime } from '../utils/dateHelpers';
import { useVideoLoop } from '../hooks/useVideoLoop';

/**
 * Calendar Page - Redesigned
 * 
 * Features:
 * - Week selector with entry indicators
 * - Month picker overlay for date navigation
 * - Video entry previews with loop playback
 * - Reel viewer for full-screen playback
 * - Frosted glass header
 */
function Calendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [monthPickerDate, setMonthPickerDate] = useState(new Date());
  const [showReel, setShowReel] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { entries, deleteEntry } = useEntriesStore();

  // Constants
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  /**
   * Get array of dates for the current week (Mon-Sun)
   * Based on the currently selected date
   */
  const getWeekDays = () => {
    const curr = new Date(selectedDate);
    const week = [];
    
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(curr.setDate(diff));
    
    for (let i = 0; i < 7; i++) {
      const weekDay = new Date(monday);
      weekDay.setDate(monday.getDate() + i);
      week.push(weekDay);
    }
    
    return week;
  };

  const weekDays = getWeekDays();

  /**
   * Filter entries for a specific date
   */
  const getEntriesForDate = (date) => {
    return entries.filter(entry => {
      const entryDate = new Date(entry.recordedAt);
      return entryDate.getFullYear() === date.getFullYear() &&
             entryDate.getMonth() === date.getMonth() &&
             entryDate.getDate() === date.getDate();
    });
  };

  const selectedEntries = getEntriesForDate(selectedDate);

  /**
   * Check if a date matches the selected date
   */
  const isSelected = (date) => {
    return date.getFullYear() === selectedDate.getFullYear() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getDate() === selectedDate.getDate();
  };

  /**
   * Check if a date is today
   */
  const isToday = (date) => {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           today.getMonth() === date.getMonth() &&
           today.getDate() === date.getDate();
  };

  /**
   * Open reel viewer at specific entry index
   */
  const handleEntryClick = (index) => {
    setSelectedIndex(index);
    setShowReel(true);
  };

  /**
   * Delete entry with confirmation
   */
  const handleDeleteEntry = async (e, entryId) => {
    e.stopPropagation();
    if (window.confirm('Delete this entry?')) {
      await deleteEntry(entryId);
    }
  };

  /**
   * Generate calendar grid days for month picker
   * Includes empty cells for proper alignment
   */
  const getMonthCalendarDays = () => {
    const year = monthPickerDate.getFullYear();
    const month = monthPickerDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) days.push(day);
    
    return days;
  };

  /**
   * Handle day selection from month picker
   */
  const handleMonthDayClick = (day) => {
    if (!day) return;
    const newDate = new Date(
      monthPickerDate.getFullYear(),
      monthPickerDate.getMonth(),
      day
    );
    setSelectedDate(newDate);
    setShowMonthPicker(false);
  };

  const previousMonth = () => {
    setMonthPickerDate(new Date(monthPickerDate.getFullYear(), monthPickerDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setMonthPickerDate(new Date(monthPickerDate.getFullYear(), monthPickerDate.getMonth() + 1));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header - z-50, frosted glass background */}
      <div className="sticky top-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/30">
        <div className="px-3 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            {monthNames[selectedDate.getMonth()]} {selectedDate.getDate()}, {selectedDate.getFullYear()}
          </h2>
          <button 
            onClick={() => setShowMonthPicker(!showMonthPicker)}
            className="w-10 h-10 rounded-xl bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors mr-0.5"
          >
            <CalendarIcon className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>

      {/* Month Picker */}
      {showMonthPicker && (
        <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
          <div className="sticky top-0 bg-background/60 backdrop-blur-xl border-b border-border/30">
            <div className="px-3 py-4 flex items-center justify-between">
              {/* Month/Year on the left with navigation arrows - fixed width container */}
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-foreground min-w-[150px]">
                  {monthNames[monthPickerDate.getMonth()]} {monthPickerDate.getFullYear()}
                </h2>
                <div className="flex items-center gap-1">
                  <button onClick={previousMonth} className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={nextMonth} className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <button onClick={() => setShowMonthPicker(false)} className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="px-3 py-6">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day.slice(0, 1)}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {getMonthCalendarDays().map((day, index) => {
                if (!day) return <div key={index} className="aspect-square" />;

                const date = new Date(monthPickerDate.getFullYear(), monthPickerDate.getMonth(), day);
                const selected = isSelected(date);
                const today = isToday(date);
                const hasEntries = getEntriesForDate(date).length > 0;

                return (
                  <button
                    key={index}
                    onClick={() => handleMonthDayClick(day)}
                    className={`
                      aspect-square rounded-2xl text-sm font-medium transition-all relative
                      ${selected ? 'bg-foreground text-background' : 'text-foreground hover:bg-muted'}
                      ${today && !selected ? 'ring-2 ring-violet-400' : ''}
                    `}
                  >
                    {day}
                    {hasEntries && !selected && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-violet-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="px-3 pb-32">
        {/* Week Selector */}
        <div className="mt-4 flex gap-1">
          {weekDays.map((day, index) => {
            const dayEntries = getEntriesForDate(day);
            const hasEntries = dayEntries.length > 0;
            const selected = isSelected(day);
            const today = isToday(day);

            return (
              <button
                key={index}
                onClick={() => setSelectedDate(day)}
                className={`
                  flex-1 flex flex-col items-center justify-center h-14 rounded-2xl transition-all
                  ${selected ? 'bg-foreground text-background' : 'bg-card text-foreground hover:bg-muted'}
                  ${today && !selected ? 'ring-2 ring-violet-400' : ''}
                `}
              >
                <span className="text-[10px] font-medium mb-0.5">{dayNames[index].slice(0, 3)}</span>
                <span className="text-base font-bold">{day.getDate()}</span>
                {hasEntries && (
                  <div className={`w-1 h-1 rounded-full mt-0.5 ${selected ? 'bg-background' : 'bg-violet-400'}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Entries - z-10 so buttons stay below header (z-50) */}
        <div className="mt-6">
          {selectedEntries.length > 0 ? (
            <div className={selectedEntries.length === 1 ? 'flex flex-col' : 'grid grid-cols-2 gap-2'}>
              {selectedEntries.map((entry, index) => (
                <div
                  key={entry.id}
                  className="rounded-3xl overflow-hidden bg-muted relative aspect-[9/16]"
                >
                  {/* Video Loop - clickable to open reel */}
                  <button
                    onClick={() => handleEntryClick(index)}
                    className="w-full h-full absolute inset-0 z-0"
                  >
                    <VideoLoopPreview entry={entry} />
                  </button>

                  {/* Play button - z-10 */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-xl">
                      <Play className="w-6 h-6 text-black ml-0.5" fill="black" />
                    </div>
                  </div>

                  {/* Duration badge - top left, z-10 */}
                  {entry.duration && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/80 backdrop-blur-sm rounded-md z-10 pointer-events-none">
                      <span className="text-white text-xs font-semibold">{formatTime(entry.duration)}</span>
                    </div>
                  )}

                  {/* Delete button - top right, z-10 */}
                  <button
                    onClick={(e) => handleDeleteEntry(e, entry.id)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/80 backdrop-blur-sm hover:bg-red-600 flex items-center justify-center transition-colors z-10"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                <CalendarIcon className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">No entries for this day</p>
            </div>
          )}
        </div>
      </div>

      {/* Reel Viewer */}
      {showReel && selectedEntries.length > 0 && (
        <ReelViewer entries={selectedEntries} initialIndex={selectedIndex} onClose={() => setShowReel(false)} />
      )}
    </div>
  );
}

/**
 * VideoLoopPreview Component
 * 
 * Displays a 5-second looping preview of entry video
 * Falls back to gradient placeholder if no media URL
 */
function VideoLoopPreview({ entry }) {
  const videoRef = useRef(null);
  useVideoLoop(videoRef, entry.mediaUrl, 5);

  if (!entry.mediaUrl) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
        <CalendarIcon className="w-12 h-12 text-muted-foreground/50" />
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      src={entry.mediaUrl}
      muted
      playsInline
      preload="auto"
      className="w-full h-full object-cover"
    />
  );
}

export default Calendar;