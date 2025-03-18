import React from 'react';
import EventCard from './EventCard';
import { format } from 'date-fns';

import {Event} from '../models'

type GroupedEvents = {
    [key: string]: Event[];
};

const groupEventsByMonth = (events: Event[]): GroupedEvents => {
    const months = [
        'January', 'February', 'March', 'April',
        'May', 'June', 'July', 'August',
        'September', 'October', 'November', 'December'
    ];

    const groupedEvents = events.reduce((grouped: GroupedEvents, event: Event) => {
        const month = format(new Date(event.startDateTime), 'MMMM yyyy');
        if (!grouped[month]) {
            grouped[month] = [];
        }
        grouped[month].push(event);
        return grouped;
    }, {} as GroupedEvents);

    const sortedGroupedEvents: GroupedEvents = {};
    months.forEach((month) => {
        const monthYear = Object.keys(groupedEvents).find((key) => key.startsWith(month));
        if (monthYear) {
            sortedGroupedEvents[monthYear] = groupedEvents[monthYear];
        }
    });

    return sortedGroupedEvents;
};

interface MonthlyEventListProps {
    events: Event[];
}

const MonthlyEventList: React.FC<MonthlyEventListProps> = ({ events }) => {
    const eventsByMonth = groupEventsByMonth(events);

    return (
        <div className="space-y-8">
            {Object.keys(eventsByMonth).map((month) => (
                <div key={month}>
                    <h2 className="text-2xl font-bold text-blue-900 mb-3 ml-3">{month}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {eventsByMonth[month].map((event) => (
                            <EventCard key={event.id} event={event} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MonthlyEventList;
