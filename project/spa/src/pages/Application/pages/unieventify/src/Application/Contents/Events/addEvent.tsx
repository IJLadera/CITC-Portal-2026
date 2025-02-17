import React, { useEffect, useState } from "react";
import EditEvent from "../../../Components/eventComponents/editevent";
import http from "../../../axios";
import Cookies from "js-cookie";
import { CircularProgress, Box } from "@mui/material";


const EventForm: React.FC = () => {
  const [currentUser, setCurrentUser] = useState("");
  const token = Cookies.get("auth_token");

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const userResponse = await http.get(`auth/users/me/`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });
        setCurrentUser(userResponse.data);
      } catch (error) {
        console.error("Error fetching event details:", error);
      }
    };

    fetchEventDetails();
  }, [token]);

  if (!currentUser)
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <CircularProgress />
      </Box>
    );

  return (
    <EditEvent isEdit={false} isResched={false} currentUser={currentUser} event={undefined} eventID={undefined} setEditing={undefined} setResched={undefined} />
  );
};

export default EventForm;
