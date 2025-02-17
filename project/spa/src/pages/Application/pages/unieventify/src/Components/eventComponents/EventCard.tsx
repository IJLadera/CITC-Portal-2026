import React from 'react';
import { BsCircleFill } from 'react-icons/bs';
import { format } from 'date-fns';
import AccessTimeFilledIcon from "@mui/icons-material/AccessTimeFilled";
import DateRangeIcon from "@mui/icons-material/DateRange";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import colors from "../colors";
import { useNavigate, useParams } from 'react-router-dom';

interface eventProps {
    event: {
        id: number,
        eventName: string,
        startDateTime: string,
        endDateTime: string,
        venue: {
            location: string
        },
        status: {
            statusName: string
        }
    }
}

const EventCard: React.FC<eventProps> = ({ event }) => {
    const navigate = useNavigate();
    const startDate = new Date(event.startDateTime);
    const endDate = new Date(event.endDateTime);

    const formattedDate = `${format(startDate, 'MMMM d, yyyy')} | ${format(endDate, 'MMMM d, yyyy')}`;
    const formattedTime = `${format(startDate, 'h:mm a')} | ${format(endDate, 'h:mm a')}`;

    // Determine the color based on the event status
    const getStatusColor = (statusName: string) => {
        switch (statusName.toLowerCase()) {
            case 'ongoing':
                return 'text-green-600';
            case 'upcoming':
                return 'text-blue-600';
            case 'cancelled':
                return 'text-red-600';
            case 'postponed':
                return 'text-orange-600';
            default:
                return 'text-gray-600';
        }
    };

    const handleclick = () => {
        navigate(`/events/${event.id}`)
    }


    return (
        <div className="bg-gray-200 p-4 rounded-lg shadow-lg px-10 py-5 group transition-transform cursor-pointer duration-300 transform hover:scale-105"
            onClick={handleclick}
        >
            <h3 className="text-xl font-semibold text-blue-800 mb-2 ">{event.eventName}</h3>
            <p className="text-gray-600">
                <DateRangeIcon
                    sx={{
                        color: colors.yellow,
                        fontSize: "25px",
                        marginRight: "5px",
                        marginBottom: "5px",
                    }}
                /> {formattedDate}
            </p>
            <p className="text-gray-600">
                <AccessTimeFilledIcon
                    sx={{
                        color: colors.yellow,
                        fontSize: "25px",
                        marginRight: "5px",
                        marginBottom: "4px",
                    }}
                /> {formattedTime}
            </p>
            <p className="text-gray-700">
                <LocationOnIcon
                    sx={{
                        color: colors.yellow,
                        fontSize: "25px",
                        marginRight: "5px",
                        marginBottom: "4px",
                    }}
                />{" "}
                {event.venue?.location || 'NO Venue ATM'}</p>
            <div className={`flex items-center ${getStatusColor(event.status.statusName)} ml-2`}>
                <BsCircleFill size={8} className="mr-2" />
                <span>{event.status.statusName.charAt(0).toUpperCase() + event.status.statusName.slice(1)}</span>
            </div>
        </div>
    );
};

export default EventCard;
