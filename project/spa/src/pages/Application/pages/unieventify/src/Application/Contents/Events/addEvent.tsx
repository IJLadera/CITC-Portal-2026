import React from "react";
import EditEvent from "../../../Components/eventComponents/editevent";
import { CircularProgress, Box } from "@mui/material";
import { useAppSelector } from "../../../../../../../../hooks";
import { RootState } from "../../../../../../../../store";


const EventForm: React.FC = () => {
  // const [currentUser, setCurrentUser] = useState("");
  const currentUser = useAppSelector((state: RootState) => state.unieventify.user);

  // useEffect(() => {
  //   if (token) {
  //     dispatch(fetchCurrentUser());  // Dispatch the action to fetch the user
  //   }
  // }, [token, dispatch]);

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
