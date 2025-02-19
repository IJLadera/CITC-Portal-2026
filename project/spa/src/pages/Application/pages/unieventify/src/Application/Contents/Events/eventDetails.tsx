import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import http from "../../../../../../../../http";
import Cookies from "js-cookie";
import EventDetails from "../../../Components/eventComponents/eventDetails";
import Eventskeleton from "../../../Components/eventComponents/eventskeleton";
import { useAppSelector } from "../../../../../../../../hooks";

export default function DifEventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  // const token = Cookies.get("auth_token");
  const token = useAppSelector(state => state.auth.token)
  const [admin, setAdmin] = useState("");
  const [currentUser, setCurrentUser] = useState("");

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await http.get(`unieventify/events/${id}`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });
        const userResponse = await http.get(`auth/users/me/`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });
        setEvent(response.data);

        setAdmin(userResponse.data.is_staff);
        setCurrentUser(userResponse.data);
      } catch (error) {
        console.error("Error fetching event details:", error);
      }
    };

    fetchEventDetails();
  }, [id, token]);

  // Loading state
  if (!event && !currentUser) {
    return <Eventskeleton />;
  }

  return <EventDetails event={event} admin={admin} currentUser={currentUser} />;
}
