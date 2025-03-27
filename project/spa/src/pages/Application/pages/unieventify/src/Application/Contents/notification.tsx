import { Event, User } from "../../Components/models"; 
import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Box,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import colors from "../../Components/colors";
import http from "../../../../../../../http";
import { useNavigate } from "react-router-dom";
import { Editor, EditorState, convertFromRaw, ContentState } from "draft-js";
import { useAppDispatch, useAppSelector } from "../../../../../../../hooks";

const deanAndChairperson = ['Dean', 'Chairperson']




interface NotificationProps {
  id: number;
  is_read: boolean;
  event: {
    id: number;
    eventName: string;
    eventDescription: string;
    startDateTime: string;
    endDateTime: string;
    status: string;
  };
}

interface EventProps {
  id: number;
  eventName: string;
  eventDescription: string;
  startDateTime: string;
  endDateTime: string;
  status: string;
  event: {
    id: number;
    eventName: string;
    eventDescription: string;
    startDateTime: string;
    endDateTime: string;
    status: string;
  };
}

interface UserRole {
  designation: string;
  role: string;
}

// interface User {
//   role: UserRole;
// }


const Notification = () => {
  const [approvalEvents, setApprovalEvents] = useState<Event[]>([]);
  // const [notifications, setNotifications] = useState<NotificationProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const [userRole, setUserRole] = useState<Role | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const token = useAppSelector((state) => state.auth.token);
  const navigate = useNavigate();

  const dispatch = useAppDispatch()

  const notificationss = useAppSelector((state) => state.unieventify.notifications)

  const approvaleventss = useAppSelector((state) => state.unieventify.approvalEvents)

  const users = useAppSelector((state) => state.unieventify.user)

  const filteredNotifications = notificationss.filter((noti) => noti.event.status !== "draft" && noti.event.status !== "disapproved");



  // useEffect(() => {
  //   dispatch(fetchCurrentUser());
  //   dispatch(fetchNotifications())
  // }, [dispatch])

  useEffect(() => {
    const fetchUserAndEvents = async () => {
      try {
        if (!token) {
          throw new Error("Authentication token is missing.");
        }

        // Fetch user role
        const userResponse = await http.get("auth/users/me/", {
          headers: { Authorization: `Token ${token}` },
        });
        // setUserRole(userResponse.data.role?.designation);
        setUser(userResponse.data);

        // Fetch approval events
        const approvalEventsResponse = await http.get("unieventify/approvalevents/", {
          headers: { Authorization: `Token ${token}` },
        });
        setApprovalEvents(approvalEventsResponse.data);

        // Fetch notifications
        const notificationsResponse = await http.get("unieventify/notifications/", {
          headers: { Authorization: `Token ${token}` },
        });
        // Filter notifications based on event status
        const filteredNotifications = notificationsResponse.data.filter(
          (noti: NotificationProps) =>
            noti.event.status !== "draft" && noti.event.status !== "disapproved"
        );

        // Update state with the filtered notifications
        // setNotifications(filteredNotifications);
      } catch (err: any) {
        setError(err.message);
        console.error("An error occurred while fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndEvents();
  }, [token]);

  const handleOnClickNotification = (id:any, read: boolean, eventId: number) => {
    if (read === false || read === null) {
      http.patch(
        `unieventify/notifications/${id}/`,
        {
          is_read: true,
        },
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );
    }
    navigate(`/unieventify/app/eventdetails/${eventId}`);
  };


  const handleOnDeleteNotification = (id: number) => {
    http
      .delete(`unieventify/notifications/${id}/`, {
        headers: { Authorization: `Token ${token}` },
      })
      // .then(() => {
      //   setNotifications((prevNotifications) =>
      //     prevNotifications.filter((notification) => notification.id !== id)
      //   );
      // })
      .catch((error) => {
        console.error("Error deleting the notification:", error);
      });
  };

  const handleOnClickApprovalEvent = (eventId: number) => {
    navigate(`/auth/app/eventdetails/${eventId}`);
  };

  const handleOnDeleteApprovalEvent = (id: number) => {
    http
      .delete(`approvalevents/${id}/`, {
        headers: { Authorization: `Token ${token}` },
      })
      .then(() => {
        setApprovalEvents((prevApprovalEvents) =>
          prevApprovalEvents.filter((approvalEvent) => approvalEvent.id !== id)
        );
      })
      .catch((error) => {
        console.error("Error deleting the approval event:", error);
      });
  };

  if (loading) {
    return (
      <Container
        maxWidth="sm"
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="error">Error: {error}</Alert>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 1200,
        mx: "auto",
        p: 3,
        bgcolor: "background.paper",
        borderRadius: 2,
        boxShadow: 3,
      }}
    >
      <Typography variant="h4" gutterBottom>
        Notifications
      </Typography>
      {deanAndChairperson.includes(user?.role?.name || '') && (
        <Box>
          <Typography variant="body1" color="textSecondary">
            Events that need approval:
          </Typography>

          {/* Approval Events */}
          {approvalEvents.length > 0 ? (
            approvalEvents.map((event) => {
              let contentState;
              try {
                contentState = event.eventDescription
                  ? convertFromRaw(JSON.parse(event.eventDescription))
                  : null;
              } catch (error) {
                contentState = event.eventDescription
                  ? ContentState.createFromText(event.eventDescription)
                  : null;
              }

              return (
                <Box key={event.id} sx={{ position: "relative" }}>
                  <Card
                    sx={{
                      mb: 2,
                      bgcolor: colors.darkergray,
                      position: "relative",
                    }}
                    onClick={() =>
                      handleOnClickApprovalEvent(
                        event.id
                      )
                    }
                  >
                    <CardContent>
                      {/* Dean-specific draft notification */}
                      <Typography variant="h6">{event?.eventName}</Typography>
                      <Typography variant="body1">
                        {contentState ? (
                          <Editor
                            editorState={EditorState.createWithContent(contentState)}
                            readOnly={true}
                            placeholder="No description provided."
                            onChange={() => {}}
                          />
                        ) : (
                          <Typography variant="body1" color="textSecondary">
                            No description provided.
                          </Typography>
                        )}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {new Date(event?.startDateTime).toLocaleString()} -{" "}
                        {new Date(event?.endDateTime).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              );
            })
          ) : (
            <Typography variant="body1" color="textSecondary">
              No approval events available.
            </Typography>
          )}

        </Box>
      )}
      <Typography variant="body1" color="textSecondary" sx={{ mt: 4 }}>
        You are Participants in this Following:
      </Typography>

      {/* Notifications */}
      {filteredNotifications.length > 0 ? (
        filteredNotifications.map((notification) => {
          let contentState;
          try {
            contentState = notification.event.eventDescription
              ? convertFromRaw(JSON.parse(notification.event.eventDescription))
              : null;
          } catch (error) {
            contentState = notification.event.eventDescription
              ? ContentState.createFromText(notification.event.eventDescription)
              : null;
          }

          return (
            <Box key={notification.id} sx={{ position: "relative" }}>
              <IconButton
                aria-label="dismiss"
                onClick={() => handleOnDeleteNotification(notification.id)}
                sx={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  zIndex: 1,
                }}
              >
                <CloseIcon />
              </IconButton>
              <Card
                sx={{
                  mb: 2,
                  bgcolor: notification.is_read
                    ? "background.paper"
                    : colors.darkergray,
                  position: "relative",
                }}
                onClick={() =>
                  handleOnClickNotification(
                    notification.id,
                    notification.is_read,
                    notification.event.id
                  )
                }
              >
                <CardContent>
                  <Typography variant="h6">
                    {notification.event?.eventName}
                  </Typography>
                  <div>
                    {contentState ? (
                      <Editor
                        editorState={EditorState.createWithContent(
                          contentState
                        )}
                        readOnly={true}
                        placeholder="No description provided."
                        onChange={() => {}}
                      />
                    ) : (
                      <Typography variant="body1" color="textSecondary">
                        No description provided.
                      </Typography>
                    )}
                  </div>
                  <Typography variant="body2" color="textSecondary">
                    {new Date(
                      notification.event?.startDateTime
                    ).toLocaleString()}{" "}
                    -{" "}
                    {new Date(notification.event?.endDateTime).toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          );
        })
      ) : (
        <Typography variant="body1" color="textSecondary">
          No notifications available.
        </Typography>
      )}
    </Box>
  );
};

export default Notification;
