import { useState } from 'react';
import CalendarComponent from '../components/Calendar';
import DayView from '../components/DayView';

/**
 * Calendar Page
 * 
 * Shows calendar with all entries
 * Allows clicking on days to view entries
 */
function Calendar() {
  const [selectedDay, setSelectedDay] = useState(null);

  const handleDayClick = (date, entries) => {
    setSelectedDay({ date, entries });
  };

  const handleCloseDayView = () => {
    setSelectedDay(null);
  };

  return (
    <div className="space-y-6">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 bg-card border-b border-border z-10 px-4 py-3">
        <h1 className="text-xl font-bold text-foreground">Calendar</h1>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block">
        <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
        <p className="text-muted-foreground">View your journal entries by date</p>
      </div>

      {/* Calendar */}
      <CalendarComponent onDayClick={handleDayClick} />

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

export default Calendar;