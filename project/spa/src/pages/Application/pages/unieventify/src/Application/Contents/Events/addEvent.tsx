import React, { useEffect, useState } from "react";
import EditEvent from "../../../Components/eventComponents/editevent";
import http from "../../../../../../../../http";
import Cookies from "js-cookie";
import { CircularProgress, Box } from "@mui/material";
import { useAppSelector } from "../../../../../../../../hooks";
import { fetchCurrentUser } from "../../slice";
import { AppDispatch, RootState } from "../../../../../../../../store";
import { useDispatch } from "react-redux";


const EventForm: React.FC = () => {
  // const [currentUser, setCurrentUser] = useState("");
  const dispatch = useDispatch<AppDispatch>();
  const token = useAppSelector(state => state.auth.token);
  const currentUser = useAppSelector((state: RootState) => state.unieventify.user);

  useEffect(() => {
    if (token) {
      dispatch(fetchCurrentUser());  // Dispatch the action to fetch the user
    }
  }, [token, dispatch]);

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
