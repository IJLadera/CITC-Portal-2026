import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom';
import http from '../../../../../../../http';
import Eventskeleton from '../../Components/eventComponents/eventskeleton'
import EventDetailsPublic from '../../Components/eventComponents/eventDetails';


export default function EventDetails() {
    const { id } = useParams();
    const [event, setEvent] = useState(null);

    useEffect(() => {
        const fetchEventDetails = async () => {
            try {
                const response = await http.get(
                    `unieventify/public-events/${id}/`
                );
                setEvent(response.data);
            } catch (error) {
                console.error("Error fetching event details:", error);
            }
        };
        fetchEventDetails();
    }, [id])


    if (!event) {
        return <Eventskeleton />
    }

    return <EventDetailsPublic event={event} admin={false} currentUser={false}/>;
}
