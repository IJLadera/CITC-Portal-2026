import React, { useState, useEffect } from "react";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import colors from "../../Components/colors";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import Divider from "@mui/material/Divider";
import AccessTimeFilledIcon from "@mui/icons-material/AccessTimeFilled";
import DateRangeIcon from "@mui/icons-material/DateRange";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { Navbar } from "flowbite-react";
import http from "../../../../../../../http";
import FooterComponent from "../../Components/Footer";
import FiberManualRecordTwoToneIcon from "@mui/icons-material/FiberManualRecordTwoTone";
import { useNavigate } from "react-router-dom";
import { Editor, EditorState, convertFromRaw, ContentState } from "draft-js";
import getImageForCategory from "../../Components/defaultImageComponents";
import logo from "../../images/logo.png";
import { Carousel } from "flowbite-react"; // You can use MUI or Tailwind equivalent
import Announcement from "../../Components/announcement";
import { CircularProgress } from "@mui/material";

const defaultTheme = createTheme();

const firstsemester: any[] = [];

interface Event {
  id: number;
  eventName: string;
  eventDescription: string;
  startDateTime: string;
  endDateTime: string;
  venue?: { location: string };
  status: { statusName: string };
  images?: string;
  isAnnouncement?: boolean;
  eventCategory: any;
}

interface Category {
  eventCategoryName: string;
}

export default function Landingpage() {
  const navigate = useNavigate();
  const [latestEvent, setLatestEvent] = useState<Event[] | null>(null);
  const [eventCategory, setEventCategory] = useState<Category[] | null>(null);
  const [publicEvents, setPublicEvents] = useState<Event[] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState<Event[]>([]);

  const publicEventsCategory = ["university", "college"];
  const upcoming = "upcoming";
  const ongoing = "ongoing";
  const done = "done";
  const draft = "draft";

  let latestEventState: ContentState | null = null;

  try {
    latestEventState =
      latestEvent && latestEvent[0]?.eventDescription
        ? convertFromRaw(JSON.parse(latestEvent[0].eventDescription))
        : null;
  } catch (error) {
    latestEventState =
      latestEvent && latestEvent[0]?.eventDescription
        ? ContentState.createFromText(latestEvent[0].eventDescription)
        : null;
  }

  useEffect(() => {
    // Fetch events from the API
    const fetchEvents = async () => {
      try {
        const response = await http.get("public-events/");
        const allEvents = response.data
          .filter((event: Event) => event.status?.statusName !== "draft")
          .filter((event: Event) => !event.isAnnouncement);

        const currentDate = new Date();
        const currentWeekStart = getWeekStart(currentDate);
        const currentWeekEnd = getWeekEnd(currentDate);

        let weeklyEvents = filterEventsByDateRange(
          allEvents,
          currentWeekStart,
          currentWeekEnd
        );

        // If no events in the current week, go back week-by-week to find up to 5 past events
        if (weeklyEvents.length === 0) {
          const previousEvents: Event[] = [];
          let weekStart = currentWeekStart;
          let weekEnd = currentWeekEnd;

          while (previousEvents.length < 5) {
            // Go back one week
            weekEnd = new Date(weekStart);
            weekStart = new Date(weekEnd);
            weekStart.setDate(weekStart.getDate() - 7);

            // Fetch events from the previous week
            const events = filterEventsByDateRange(
              allEvents,
              weekStart,
              weekEnd
            );
            previousEvents.push(...events);

            if (
              previousEvents.length >= 5 ||
              weekStart.getTime() <
                new Date().setFullYear(new Date().getFullYear() - 1)
            ) {
              // Break if we found enough events or reached a year back
              break;
            }
          }

          setLatestEvent(previousEvents.slice(0, 5));
        } else {
          setLatestEvent(weeklyEvents);
        }
      } catch (error) {
        console.error("Error fetching events", error);
      }
    };

    fetchEvents();
    // Fetch event categories from the API
    http
      .get("eventcategories/")
      .then((response) => setEventCategory(response.data))
      .catch((error) => console.log(error));

    // Fetch public events from the API and filter out those with status 'draft'
    http
      .get("public-events/")
      .then((response) => {
        const publicEvents = response.data
          .filter((event: Event) => event.status?.statusName !== draft)
          .filter((event: Event) => !event.isAnnouncement);
        setPublicEvents(publicEvents);
      })
      .catch((error) => console.log(error));
    http
      .get("announcement/")
      .then((response) => {
        setAnnouncement(response.data);
      })
      .catch((error) => console.log(error));
  }, []);

  const getWeekStart = (date: Date) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    return start;
  };

  const getWeekEnd = (date: Date) => {
    const end = new Date(date);
    end.setDate(date.getDate() - date.getDay() + 6);
    return end;
  };

  const filterEventsByDateRange = (events: Event[], startDate: Date, endDate: Date) => {
    return events.filter(
      (event) =>
        new Date(event.startDateTime) >= startDate &&
        new Date(event.startDateTime) <= endDate
    );
  };

  const filterEventCategories = eventCategory
    ? eventCategory.filter((category) =>
        publicEventsCategory.includes(category.eventCategoryName.toLowerCase())
      )
    : [];

  const handleCategoryClick = (categoryName: string | null) => {
    setSelectedCategory(categoryName);
  };

  const filteredEvents = selectedCategory
    ? publicEvents?.filter(
        (event) =>
          event.eventCategory.eventCategoryName === selectedCategory &&
          event.status.statusName !== done
      )
    : publicEvents?.filter((event) => event.status.statusName !== done);

  const archivedFilteredEvents = publicEvents?.filter(
    (event) => event.status.statusName === done
  );

  // Function to determine event status order
  const getEventStatusOrder = (status: string) => {
    switch (status) {
      case ongoing:
        return 1; // Highest priority
      case upcoming:
        return 2; // Medium priority
      default:
        return 3; // For any other status
    }
  };

  // Sort events: ongoing first, then upcoming, then done
  const sortedFilteredEvents = filteredEvents
    ? filteredEvents.sort((a, b) => {
        const statusComparison =
          getEventStatusOrder(a.status.statusName) -
          getEventStatusOrder(b.status.statusName);
        if (statusComparison !== 0) return statusComparison;

        // If statuses are equal, sort by startDateTime
        return new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime();
      })
    : [];

  const capitalize = (str: string) => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const handleclick = (id: number) => {
    navigate(`/events/${id}`);
  };

  const handleButtonClick = () => {
    // Navigate to another route
    navigate("events");
  };

  if (!(latestEvent && publicEvents && announcement))
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
    <ThemeProvider theme={defaultTheme}>
      <Box
        style={{
          backgroundImage: `url(${require("../../images/bgimage.jpg")})`,
          height: "80vh",
          backgroundSize: "cover",
        }}
      >
        <Box className="flex justify-center h-3/5 pt-20 flex-col text-white font-bold sm:text-3xl">
          <Box className="self-center flex flex-row text-3xl md:text-5xl lg:6xl">
            <Box className="lg:mb-10 mb-3 mr-1">Welcome To</Box>
            <Box style={{ color: colors.yellow }}>UniEventify</Box>
          </Box>
          <Box className="self-center flex flex-row md:text-lg lg:text-xl">
            <Box className="mb-10 mr-3" style={{ color: colors.yellow }}>
              Creating Connections,
            </Box>
            <Box>on detail at a time</Box>
          </Box>
        </Box>
        <Box className="flex justify-center pt-10">
          <Button
            size="large"
            variant="outlined"
            onClick={handleButtonClick}
            sx={{
              paddingLeft: 3,
              paddingRight: 3,
              paddingBottom: 1,
              paddingTop: 1,
              color: "white",
              borderColor: colors.yellow,
              fontWeight: "bold",
            }}
          >
            See Events
          </Button>
        </Box>
      </Box>
      <Box className="mt-16 flex justify-center">
        {latestEvent?.length > 0 ? (
          <Box
            sx={{ display: "flex", flexDirection: "column", width: "900px" }}
          >
            <Box className="flex flex-col">
              <Box
                className="sm:ml-5 text-5xl self-center sm:self-start"
                style={{ color: "#FFD700" }} // Yellow color
              >
                ―
              </Box>
              <Box className="sm:ml-9 self-center sm:self-start">
                <Box className="text-neutral-400 mb-2 tracking-widest ml-6 sm:ml-0">
                  Our Latest Events
                </Box>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  Featured Events
                </Typography>
              </Box>
            </Box>
            <Carousel
              slideInterval={3000}
              className="h-full"
              style={{ minHeight: "400px" }}
            >
              {latestEvent.length > 0 ? (
                latestEvent.map((event) => {
                  let latestEventState;

                  try {
                    // Try to parse the event description as JSON
                    latestEventState = event.eventDescription
                      ? convertFromRaw(JSON.parse(event.eventDescription))
                      : null;
                  } catch (error) {
                    // If parsing fails, treat it as plain text
                    latestEventState = event.eventDescription
                      ? ContentState.createFromText(event.eventDescription)
                      : null;
                  }

                  return (
                    <Box key={event.id} className="flex flex-col sm:flex-row ">
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          marginRight: "30px",
                        }}
                        className="w-full"
                      >
                        <CardContent
                          sx={{ flex: "1 0 auto", marginLeft: "20px" }}
                        >
                          <Typography variant="h5">
                            {event.eventName}
                          </Typography>
                          <Divider
                            sx={{ marginBottom: "10px", marginTop: "10px" }}
                          />
                          <Typography
                            variant="subtitle1"
                            color="text.secondary"
                            className="line-clamp-3"
                          >
                            {latestEventState ? (
                              <Editor
                                editorState={EditorState.createWithContent(
                                  latestEventState
                                )}
                                readOnly={true}
                                placeholder="No description provided."
                                onChange={() => {}}
                              />
                            ) : (
                              <Typography
                                variant="subtitle1"
                                color="text.secondary"
                              >
                                No description provided.
                              </Typography>
                            )}
                          </Typography>
                          <Box className="mt-5">
                            <Box className="mb-2">
                              <DateRangeIcon
                                sx={{
                                  color: "#FFD700",
                                  fontSize: "30px",
                                  marginRight: "5px",
                                  marginBottom: "5px",
                                }}
                              />{" "}
                              {new Date(event.startDateTime).toLocaleDateString(
                                "en-US",
                                {
                                  month: "long",
                                  day: "numeric",
                                }
                              )}{" "}
                              -{" "}
                              {new Date(event.endDateTime).toLocaleDateString(
                                "en-US",
                                {
                                  month: "long",
                                  day: "numeric",
                                }
                              )}
                            </Box>
                            <Box className="mb-2">
                              <AccessTimeFilledIcon
                                sx={{
                                  color: "#FFD700",
                                  fontSize: "30px",
                                  marginRight: "5px",
                                  marginBottom: "4px",
                                }}
                              />{" "}
                              {new Date(event.startDateTime).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}{" "}
                              -{" "}
                              {new Date(event.endDateTime).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </Box>
                            <Box>
                              <LocationOnIcon
                                sx={{
                                  color: "#FFD700",
                                  fontSize: "30px",
                                  marginRight: "5px",
                                  marginBottom: "4px",
                                }}
                              />{" "}
                              {event.venue?.location || "Location TBD"}
                            </Box>
                            <Box>
                              <FiberManualRecordTwoToneIcon
                                sx={{
                                  color:
                                    event.status.statusName === "ongoing"
                                      ? "green"
                                      : event.status.statusName === "upcoming"
                                      ? "blue"
                                      : event.status.statusName === "cancelled"
                                      ? "red"
                                      : event.status.statusName === "postponed"
                                      ? "orange"
                                      : "yellow",
                                  fontSize: "30px",
                                  marginRight: "5px",
                                  marginBottom: "4px",
                                }}
                              />{" "}
                              {event.status.statusName || "No Status"}
                            </Box>
                          </Box>
                          <Box className="mt-5">
                            <Button
                              variant="outlined"
                              sx={{
                                paddingLeft: 3,
                                paddingRight: 3,
                                paddingBottom: 1,
                                paddingTop: 1,
                                color: "#1C3D72", // Dark blue
                                borderColor: "#FFD700",
                                fontWeight: "bold",
                              }}
                              onClick={() => handleclick(event.id)}
                            >
                              Event Details
                            </Button>
                          </Box>
                        </CardContent>
                      </Box>
                      <CardMedia
                        component="img"
                        sx={{
                          width: 450,
                          height: 400,
                          objectFit: "cover",
                        }}
                        image={event.images || logo}
                        alt="Event Image"
                      />
                    </Box>
                  );
                })
              ) : (
                <Typography variant="h6" color="text.secondary" align="center">
                  No events available.
                </Typography>
              )}
            </Carousel>
          </Box>
        ) : (
          <Box
            sx={{ display: "flex", flexDirection: "column", width: "900px" }}
          >
            <Box className="flex flex-col">
              <Box
                className="sm:ml-5 text-5xl self-center sm:self-start"
                style={{ color: "#FFD700" }} // Yellow color
              >
                ―
              </Box>
              <Box className="sm:ml-9 self-center sm:self-start">
                <Box className="text-neutral-400 mb-2 tracking-widest ml-6 sm:ml-0">
                  Our Latest Events
                </Box>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  Featured Events
                </Typography>
              </Box>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              No Latest Events Available
            </Typography>
          </Box>
        )}
      </Box>
      <Box
        className="mt-10 flex justify-center"
        style={{ backgroundColor: colors.lightgray }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: { xs: "100%", md: "900px" },
            marginBottom: 8,
          }}
        >
          <Box className="flex flex-col">
            <Box className="ml-5 text-5xl" style={{ color: colors.yellow }}>
              ―
            </Box>
            <Box className="ml-9">
              <Box className="text-neutral-400 mb-2 tracking-widest">
                Announcement
              </Box>
            </Box>
          </Box>
          {announcement?.length > 0 ? (
            <Box className="flex ml-5 sm:mr-5 overflow-x-scroll whitespace-nowrap">
              {announcement.map((events, index) => (
                <Box key={index} className="ml-5 mb-5">
                  <Announcement event={events} />
                </Box>
              ))}
            </Box>
          ) : (
            <Box></Box>
          )}
        </Box>
      </Box>
      <Box className="flex justify-center">
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: { xs: "100%", md: "900px" },
            marginBottom: 8,
          }}
        >
          <Box className="flex flex-col">
            <Box className="ml-5 text-5xl" style={{ color: colors.yellow }}>
              ―
            </Box>
            <Box className="ml-9">
              <Box className="text-neutral-400 mb-2 tracking-widest">
                All Events
              </Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: "bold", marginRight: "15px" }}
              >
                <Navbar fluid rounded className="px-2 py-2 sm:px-4">
                  <Navbar.Brand>
                    <span className="self-center whitespace-nowrap text-2xl dark:text-white flex items-center">
                      Event Listing
                    </span>
                  </Navbar.Brand>
                  <Navbar.Toggle />
                  <Navbar.Collapse>
                    <Box
                      className={`text-md cursor-pointer ${
                        selectedCategory === null ? "font-bold" : ""
                      }`}
                      onClick={() => handleCategoryClick(null)} // Category click handler
                      style={{
                        textDecoration: "none",
                      }}
                    >
                      <span className="hover:underline">All Events</span>
                    </Box>
                    {filterEventCategories.map((category, index) => (
                      <Box
                        className={`text-md cursor-pointer ${
                          selectedCategory === category.eventCategoryName
                            ? "font-bold"
                            : ""
                        }`}
                        key={index}
                        onClick={() =>
                          handleCategoryClick(category.eventCategoryName)
                        } // Category click handler
                        style={{
                          textDecoration: "none",
                        }}
                      >
                        <span className="hover:underline">
                          {capitalize(category.eventCategoryName)}
                        </span>
                      </Box>
                    ))}
                  </Navbar.Collapse>
                </Navbar>
              </Typography>
            </Box>
          </Box>
          <Box className="flex ml-5 mt-10 overflow-x-scroll whitespace-nowrap sm:mr-5 ">
            {sortedFilteredEvents?.length > 0 ? (
              sortedFilteredEvents.map((events, index) => (
                <Box className="inline-block mb-5" key={index}>
                  <Card
                    sx={{
                      marginX: "10px",
                      width: { xs: "330px", sm: "345px", md: "270px" },
                    }}
                    className="hover:bg-zinc-100 hover:ring-zinc-100 overflow-hidden"
                  >
                    <CardMedia
                      sx={{ height: 250 }}
                      image={events.images || logo}
                      title="Event Image"
                      className="transition-transform duration-300 transform hover:scale-110"
                    />
                    <CardContent sx={{ whiteSpace: "normal" }}>
                      <Typography gutterBottom variant="h5">
                        {events.eventName}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        className="line-clamp-4"
                      >
                        {events.eventDescription ? (
                          (() => {
                            try {
                              const contentState = convertFromRaw(
                                JSON.parse(events.eventDescription)
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
                              return <span>{events.eventDescription}</span>;
                            }
                          })()
                        ) : (
                          <span>No description provided.</span>
                        )}
                      </Typography>
                      <Box className="mt-5">
                        <Box className="mb-2">
                          <DateRangeIcon
                            sx={{
                              color: colors.yellow,
                              fontSize: "25px",
                              marginRight: "5px",
                              marginBottom: "5px",
                            }}
                          />{" "}
                          {new Date(events.startDateTime).toLocaleDateString(
                            "en-US",
                            { month: "long", day: "numeric" }
                          )}{" "}
                          -{" "}
                          {new Date(events.endDateTime).toLocaleDateString(
                            "en-US",
                            { month: "long", day: "numeric" }
                          )}
                        </Box>
                        <Box className="mb-2">
                          <AccessTimeFilledIcon
                            sx={{
                              color: colors.yellow,
                              fontSize: "25px",
                              marginRight: "5px",
                              marginBottom: "4px",
                            }}
                          />{" "}
                          {new Date(events.startDateTime).toLocaleTimeString(
                            "en-US",
                            { hour: "2-digit", minute: "2-digit" }
                          )}{" "}
                          -{" "}
                          {new Date(events.endDateTime).toLocaleTimeString(
                            "en-US",
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </Box>
                        <Box>
                          <LocationOnIcon
                            sx={{
                              color: colors.yellow,
                              fontSize: "25px",
                              marginRight: "5px",
                              marginBottom: "4px",
                            }}
                          />{" "}
                          {events.venue?.location || "TBA"}
                        </Box>
                        <Box>
                          <FiberManualRecordTwoToneIcon
                            sx={{
                              color:
                                events.status.statusName === "ongoing"
                                  ? "green"
                                  : events.status.statusName === "upcoming"
                                  ? "blue"
                                  : events.status.statusName === "cancelled"
                                  ? "red"
                                  : events.status.statusName === "postponed"
                                  ? "orange"
                                  : "yellow", // default color if none of the statuses match
                              fontSize: "25px",
                              marginRight: "5px",
                              marginBottom: "4px",
                            }}
                          />{" "}
                          {events.status.statusName || "No Status"}
                        </Box>
                      </Box>
                      <Box className="mt-5">
                        <Button
                          variant="outlined"
                          sx={{
                            padding: "6px 16px",
                            fontSize: "12px",
                            color: colors.darkblue,
                            borderColor: colors.yellow,
                            fontWeight: "bold",
                          }}
                          onClick={() => handleclick(events.id)}
                        >
                          Event Details
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              ))
            ) : (
              <div>No Events Available.</div>
            )}
          </Box>
        </Box>
      </Box>
      <Box
        className="flex justify-center"
        style={{ backgroundColor: colors.lightgray }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: { xs: "100%", md: "900px" },
            marginBottom: 8,
          }}
        >
          <Box className="flex flex-col">
            <Box className="ml-5 text-5xl" style={{ color: colors.yellow }}>
              ―
            </Box>
            <Box className="ml-9">
              <Box className="text-neutral-400 mb-2 tracking-widest">
                Archived Events
              </Box>
            </Box>
          </Box>
          <Box className="flex ml-5 mt-5 overflow-x-scroll whitespace-nowrap sm:mr-5 ">
            {archivedFilteredEvents && archivedFilteredEvents.length > 0 ? (
              archivedFilteredEvents.map((events, index) => (
                <Box className="inline-block mb-5" key={index}>
                  <Card
                    sx={{
                      marginX: "10px",
                      width: { xs: "330px", sm: "345px", md: "270px" },
                    }}
                    className="hover:bg-zinc-100 hover:ring-zinc-100 overflow-hidden"
                  >
                    <CardMedia
                      sx={{ height: 250 }}
                      image={events.images || logo}
                      title="Event Image"
                      className="transition-transform duration-300 transform hover:scale-110"
                    />
                    <CardContent sx={{ whiteSpace: "normal" }}>
                      <Typography gutterBottom variant="h5">
                        {events.eventName}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        className="line-clamp-4"
                      >
                        {events.eventDescription ? (
                          (() => {
                            try {
                              const contentState = convertFromRaw(
                                JSON.parse(events.eventDescription)
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
                              return <span>{events.eventDescription}</span>;
                            }
                          })()
                        ) : (
                          <span>No description provided.</span>
                        )}
                      </Typography>
                      <Box className="mt-5">
                        <Box className="mb-2">
                          <DateRangeIcon
                            sx={{
                              color: colors.yellow,
                              fontSize: "25px",
                              marginRight: "5px",
                              marginBottom: "5px",
                            }}
                          />{" "}
                          {new Date(events.startDateTime).toLocaleDateString(
                            "en-US",
                            { month: "long", day: "numeric" }
                          )}{" "}
                          -{" "}
                          {new Date(events.endDateTime).toLocaleDateString(
                            "en-US",
                            { month: "long", day: "numeric" }
                          )}
                        </Box>
                        <Box className="mb-2">
                          <AccessTimeFilledIcon
                            sx={{
                              color: colors.yellow,
                              fontSize: "25px",
                              marginRight: "5px",
                              marginBottom: "4px",
                            }}
                          />{" "}
                          {new Date(events.startDateTime).toLocaleTimeString(
                            "en-US",
                            { hour: "2-digit", minute: "2-digit" }
                          )}{" "}
                          -{" "}
                          {new Date(events.endDateTime).toLocaleTimeString(
                            "en-US",
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </Box>
                        <Box>
                          <LocationOnIcon
                            sx={{
                              color: colors.yellow,
                              fontSize: "25px",
                              marginRight: "5px",
                              marginBottom: "4px",
                            }}
                          />{" "}
                          {events.venue?.location || "TBA"}
                        </Box>
                        <Box>
                          <FiberManualRecordTwoToneIcon
                            sx={{
                              color:
                                events.status.statusName === "ongoing"
                                  ? "green"
                                  : events.status.statusName === "upcoming"
                                  ? "blue"
                                  : events.status.statusName === "cancelled"
                                  ? "red"
                                  : events.status.statusName === "postponed"
                                  ? "orange"
                                  : "yellow", // default color if none of the statuses match
                              fontSize: "25px",
                              marginRight: "5px",
                              marginBottom: "4px",
                            }}
                          />{" "}
                          {events.status.statusName || "No Status"}
                        </Box>
                      </Box>
                      <Box className="mt-5">
                        <Button
                          variant="outlined"
                          sx={{
                            padding: "6px 16px",
                            fontSize: "12px",
                            color: colors.darkblue,
                            borderColor: colors.yellow,
                            fontWeight: "bold",
                          }}
                          onClick={() => handleclick(events.id)}
                        >
                          Event Details
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              ))
            ) : (
              <div>No Events Available.</div>
            )}
          </Box>
        </Box>
      </Box>

      <FooterComponent />
    </ThemeProvider>
  );
}
