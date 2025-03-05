import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react'; 
import dayGridPlugin from '@fullcalendar/daygrid'; 
import interactionPlugin from '@fullcalendar/interaction'; 
import { RRule } from 'rrule';

// Define the types for events with explicit start and end times
interface CalendarEvent {
  id: string;
  title: string;
  start: string; // Start date/time
  end: string; // End date/time
  rrule?: string; // Adding rrule to event
}

const MyCalendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([
    { 
      id: '1', 
      title: 'Event 1', 
      start: '2025-02-20T09:00:00', // Start date/time
      end: '2025-02-20T10:00:00', // End date/time
      rrule: 'FREQ=DAILY;COUNT=5' // Daily recurrence for 5 days
    },
    { 
      id: '2', 
      title: 'Event 2', 
      start: '2025-02-22T14:00:00', // Start date/time
      end: '2025-02-22T15:00:00', // End date/time
      rrule: 'FREQ=WEEKLY;COUNT=10' // Weekly recurrence for 10 occurrences
    },
  ]);

  // Event click handler
  const handleEventClick = (info: any) => {
    alert('Event clicked: ' + info.event.title);
    console.log('Event ID:', info.event.id); // Use event ID here
  };

  // Convert rrule to FullCalendar-compatible events (handling start and end times)
  const generateEventData = (event: CalendarEvent) => {
    if (event.rrule) {
      const rule = RRule.fromString(event.rrule);
      const dates = rule.all(); // Get all dates from the rule
      return dates.map((date) => ({
        id: event.id,
        title: event.title,
        start: date.toISOString(), // Start date/time in ISO format
        end: new Date(date.getTime() + (new Date(event.end).getTime() - new Date(event.start).getTime())).toISOString(), // Calculate end time
      }));
    } else {
      return [{
        id: event.id,
        title: event.title,
        start: event.start, // Use the provided start time
        end: event.end, // Use the provided end time
      }];
    }
  };

  const allEvents = events.flatMap(generateEventData);

  return (
    <div>
      <h2>My Calendar</h2>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={allEvents} // Use all generated events, including recurring ones
        eventClick={handleEventClick}
      />
    </div>
  );
};

export default MyCalendar;
