import React, { useEffect, useState } from "react";
import axios from "../../axios";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Box,
  CircularProgress
} from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import Cookies from "js-cookie";
import { Editor, EditorState, convertFromRaw, ContentState } from "draft-js";
import { useNavigate, useParams } from 'react-router-dom';

import { User, Event } from "../../Components/models";

// interface User  {
//   id: number,
//   email: string,
//   first_name: string,
//   last_name: string,
//   middle_name: string,
//   idNumber: number,
//   role: {
//       id: number,
//       designation: string,
//       rank: number
//   },
//   department: {
//       id: number,
//       departmentName: string,
//       collegeName: number
//   },
//   section: [],
//   organization: [],
//   image: string,
//   is_staff: boolean,
//   is_active: boolean
// }

// interface Event {
//   id: number;
//   eventName: string;
//   eventDescription: string;
//   startDateTime: string;
//   endDateTime: string;
//   department: {
//     id: number;
//     departmentName: string;
//     collegeName: string;
//   }[];
//   meetinglink: string;
// }

const AnnouncementsPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [announcements, setAnnouncements] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const token = Cookies.get("auth_token");
  const navigate = useNavigate();

  const fetchUserDepartment = async () => {
    try {
      const response = await axios.get("auth/users/me/", {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      setUser(response.data);
    } catch (error) {
      toast.error("Error fetching user information.");
      console.error(error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get("events/", {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      const announcements = response.data.filter((event:any) => event.isAnnouncement === true);

      // Role-based filtering
      let filteredAnnouncements;
      if (user?.role?.designation?.toLowerCase() === "admin") {
        // Admin: Show all announcements
        filteredAnnouncements = announcements;
      } else if (user?.role?.designation?.toLowerCase() === "dean") {
        // Dean: Filter based on the college of the dean's department
        filteredAnnouncements = announcements.filter((event:any) =>
          event.department &&
          event.department.some((dep:any) => dep.collegeName === user.department?.collegeName)
        );
      } else {
        // Other users: Filter based on the user's specific department
        filteredAnnouncements = announcements.filter((event: any) =>
          event.department &&
          event.department.some((dep:any) => dep.id === user?.department?.id)
        );
      }

      setAnnouncements(filteredAnnouncements);
    } catch (error) {
      toast.error("Error fetching announcements.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDepartment();
  }, []);

  useEffect(() => {
    if (user) {
      fetchAnnouncements();
    }
  }, [user]);

  const handleClick = (id: number) => {
    navigate(`/auth/app/eventdetails/${id}`);
  };

  if (loading && !(announcements && user))
    return (<Box
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
    <Container>
      <Typography variant="h4" gutterBottom align="center">
        Announcements
      </Typography>
      <Grid container spacing={2}>
        {announcements.length > 0 ? (
          announcements.map((event) => (
            <Grid item xs={12} sm={6} md={4} key={event.id}>
              <Card variant="outlined" style={{ marginBottom: "16px" }}>
                <CardContent>
                  <Box className="cursor-pointer" onClick={() => handleClick(event.id)}>
                    <Typography variant="h5">{event.eventName}</Typography>
                  </Box>
                  <Typography variant="body2">
                    {event.eventDescription ? (
                      (() => {
                        try {
                          const contentState = convertFromRaw(
                            JSON.parse(event.eventDescription)
                          );
                          const editorState =
                            EditorState.createWithContent(contentState);
                          return (
                            <Editor
                              editorState={editorState}
                              readOnly={true}
                              placeholder="No description provided."
                              onChange={() => {}}
                            />
                          );
                        } catch (error) {
                          return <span>{event.eventDescription}</span>;
                        }
                      })()
                    ) : (
                      <span>No description provided.</span>
                    )}
                  </Typography>
                  <Typography variant="caption">
                    {new Date(event.startDateTime).toLocaleString()} -{" "}
                    {new Date(event.endDateTime).toLocaleString()}
                  </Typography>

                  <Box>
                    <Typography variant="caption">For: </Typography>
                    {event.department && event.department.length > 0 ? (
                      event.department.map((dep, index) => (
                        <Typography variant="caption" key={index}>
                          {dep.departmentName},
                        </Typography>
                      ))
                    ) : (
                      <Typography variant="caption">No department assigned</Typography>
                    )}
                  </Box>

                  {event.meetinglink && (
                    <Button
                      variant="contained"
                      color="primary"
                      style={{ marginTop: "8px" }}
                      href={event.meetinglink}
                      target="_blank"
                      fullWidth
                    >
                      Join Meeting
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Typography>
              No announcements available for your department.
            </Typography>
          </Grid>
        )}
      </Grid>
      <ToastContainer />
    </Container>
  );
};

export default AnnouncementsPage;
