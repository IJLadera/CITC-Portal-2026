import React, { useEffect, useState } from "react";
import http from "../../../../../../../../http";
import FullCalendar from "@fullcalendar/react";
import { EventClickArg, EventApi } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import rrulePlugin from "@fullcalendar/rrule";
import Cookies from "js-cookie";
import "./fullcalendar.css";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Typography,
  TextField,
  CircularProgress,
  SelectChangeEvent
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { RRule, Weekday } from "rrule";
import colors from "../../../Components/colors";
import { toast, ToastContainer } from "react-toastify";
import { Department } from "../../../../../lms/models";
import { useAppSelector } from "../../../../../../../../hooks";

interface User {
  role: {
    designation: string;
  };
}

interface EventCategory {
  id: string;
  eventCategoryName: string;
}

interface EventType {
  id: number;
  eventTypeName: string;
}

interface Event {
  id: number;
  eventName: string;
  startDateTime: string;
  endDateTime: string;
  created_by: {
    role: {
      designation: string;
    };
  };
  isAnnouncement?: boolean;
  status?: {
    statusName: string;
  };
  eventCategory?: EventCategory;
  eventType?: EventType;
  recurrence_type?: string;
  recurrence_days?: string[];
  department?: string[];
}

interface FormattedEvent {
  id: number;
  title: string;
  start: string;
  end: string;
  // duration: {
  //   hours: number;
  //   minutes: number;
  // };
  rrule: string | null;
  // allDay: boolean;
  category: number | null;
  color: string;
  departments: string[];
  eventDescription: string;
  participants: Faculty[];
}

interface FormattedEventTwo{
  id: number;
  title: string;
  start: string;
  end: string;
  duration: {
    hours: number;
    minutes: number;
  };
  rrule: string | null;
  allDay: boolean;
  category: number | null;
  color: string;
  departments: string[];
  eventDescription: string;
  participants: Faculty[];
}

interface Faculty {
  id: number;
  first_name: string;
  last_name: string;
}


interface College {
  id: number;
  collegeName: string;
}


interface DepartmentTwo {
  id: number;
  departmentName: string;
  collegeName: string;
}

export default function Events() {
  const [events, setEvents] = useState<any[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<DepartmentTwo[]>([]);
  const [collegess, setCollegess] = useState([]);
  const [user, setUser] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]); 
  const [selectedCollege, setSelectedCollege] = useState<number[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentTwo[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<number | null>(null);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [types, setTypes] = useState<EventType[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventApi  | null>(null);
  const token = useAppSelector((state) => state.auth.token);
  // const token = {tokens};
  const navigate = useNavigate();

  console.log("auth:", token);

  const employeeRole = ["Mother Org", "Unit Org", "Admin"];

  const eventTypesColors = {
    1: "#FF5733",
    2: "#33FF57",
    3: "#3357FF",
    4: "#FF33A1",
  };

  useEffect(() => {
    fetchCategories();
    fetchColleges();
    fetchDepartments();
    fetchCollegess(); // Fetch college-department relationships
    fetchFaculties();
    fetchEvents();
    fetchTypes();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await http.get("unieventify/eventcategories/");
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchTypes = async () => {
    try {
      const response = await http.get("unieventify/eventtypes/");
      setTypes(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchColleges = async () => {
    try {
      const response = await http.get("unieventify/colleges/");
      setColleges(response.data);
    } catch (error) {
      console.error("Error fetching colleges:", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await http.get("unieventify/departments/");
      setDepartments(response.data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchCollegess = async () => {
    try {
      const response = await http.get("unieventify/departmentsbycollege/");
      setCollegess(response.data || []);
    } catch (error) {
      console.error("Error fetching collegess:", error);
      setCollegess([]); // Ensure collegess is always an array
    }
  };

  const fetchFaculties = async () => {
    try {
      const response = await http.get("unieventify/faculty/events", {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      setFaculties(response.data || []);
    } catch (error) {
      console.error("Error fetching faculties:", error);
    }
  };

  const fetchFacultyEvents = async (facultyId: number) => {
    try {
      const response = await http.get(`unieventify/faculty/events/${facultyId}`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      const userResponse = await http.get("auth/users/me/", {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      const currentUser = userResponse.data;

      setUser(currentUser);

      const eventData = [
        ...(response.data?.participated_events || []),
        ...(response.data?.created_events || []),
      ];

      const formattedEvents: FormattedEvent[] = eventData
        .filter((event) => {
          // If the user is a Dean or Chairperson, only show Faculty-created events
          if (
            (currentUser.roles.name === "Dean" ||
              currentUser.roles.name === "Chairperson") &&
            event?.created_by?.role?.name === "Faculty" &&
            event?.isAnnouncement !== true &&
            event?.status?.statusName !== "draft"
          ) {
            return true; // Show events created by Faculty for Dean/Chairperson
          }

          if (
            event?.created_by?.role?.name === "Student" ||
            (!employeeRole.includes(event?.created_by?.role?.name)
              ? event?.eventCategory?.eventCategoryName?.toLowerCase() ===
              "personal" && event?.eventType?.eventTypeName !== "Academic"
              : event?.eventCategory?.eventCategoryName?.toLowerCase() ===
              "personal") ||
            event?.isAnnouncement === true ||
            event?.status?.statusName === "draft"
          ) {
            return false; // Exclude these events
          }
          return true; // Include all other events
        })
        .map((event) => {
          const recurrenceRule = event.recurrence_days
            ? new RRule({
              freq: RRule.WEEKLY,
              interval: 1,
              byweekday: event.recurrence_days
                .map((day: string) => {
                  switch (day) {
                    case "monday":
                      return RRule.MO;
                    case "tuesday":
                      return RRule.TU;
                    case "wednesday":
                      return RRule.WE;
                    case "thursday":
                      return RRule.TH;
                    case "friday":
                      return RRule.FR;
                    case "saturday":
                      return RRule.SA;
                    case "sunday":
                      return RRule.SU;
                    default:
                      return null;
                  }
                })
                .filter((day: string) => day !== null),
              until: new Date(event.endDateTime),
            }).toString()
            : null;

          return {
            id: event.id.toString(),
            title: event.eventName, // Hide event name for Dean/Chairperson,
            start: event.startDateTime,
            end: event.endDateTime,
            rrule: recurrenceRule,
            color: event.color || "#000000",
            //dili apil ni
            category: event.eventCategory?.id || null,
            eventDescription: event.eventDescription || "",
            participants: event.participants || [],
            departments: Array.isArray(event.department)
              ? event.department
              : [],

          };
        });

      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error fetching faculty events:", error);
      setEvents([]); // Reset events on error
    }
  };

  const fetchEvents = async () => {
    try {
      const userResponse = await http.get("auth/users/me/", {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      const currentUser = userResponse.data;
  
      const response = await http.get("unieventify/public-events/", {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
  
      const eventData: any[] = response.data || []; // Explicitly typing as array of any
  
      const formattedEvents: FormattedEventTwo[] = eventData
        .filter((event: any) => {
          if (
            (currentUser.roles.name === "Dean" ||
              currentUser.roles.name === "Chairperson") &&
            event?.created_by?.role?.name === "Faculty" &&
            event?.isAnnouncement !== true &&
            event?.status?.statusName !== "draft"
          ) {
            return true; 
          }
  
          if (
            event?.created_by?.role?.name === "Student" ||
            (!employeeRole.includes(event?.created_by?.role?.name)
              ? event?.eventCategory?.eventCategoryName?.toLowerCase() ===
                  "personal" && event?.eventType?.eventTypeName !== "Academic"
              : event?.eventCategory?.eventCategoryName?.toLowerCase() ===
                  "personal") ||
            event?.isAnnouncement === true ||
            event?.status?.statusName === "draft" ||
            event?.status?.statusName === "disapproved"
          ) {
            return false; 
          }
          return true;
        })
        .map((event: any) => {
          const eventStart = new Date(event.startDateTime);
          const eventEnd = new Date(event.endDateTime);
  
          if (isNaN(eventEnd.getTime())) {
            console.error("Invalid event end date:", event.endDateTime);
            return null; 
          }
  
          const durationMs = eventEnd.getTime() - eventStart.getTime();
          const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
          const durationMinutes = Math.floor(
            (durationMs % (1000 * 60 * 60)) / (1000 * 60)
          );
  
          const recurrenceRule =
            event.recurrence_type === "daily"
              ? new RRule({
                  freq: RRule.DAILY,
                  dtstart: eventStart,
                  until: eventEnd,
                }).toString()
              : event.recurrence_type === "weekly" && event.recurrence_days
              ? new RRule({
                  freq: RRule.WEEKLY,
                  dtstart: eventStart,
                  byweekday: event.recurrence_days
                    .map((day: string): Weekday | null => {
                      switch (day.toLowerCase()) {
                        case "monday":
                          return RRule.MO;
                        case "tuesday":
                          return RRule.TU;
                        case "wednesday":
                          return RRule.WE;
                        case "thursday":
                          return RRule.TH;
                        case "friday":
                          return RRule.FR;
                        case "saturday":
                          return RRule.SA;
                        case "sunday":
                          return RRule.SU;
                        default:
                          return null;
                      }
                    })
                    .filter((weekday: Weekday | null): weekday is Weekday => weekday !== null), 
                  until: eventEnd,
                }).toString()
              : null;
  
          return {
            id: event.id.toString(),
            title: event.eventName,
            start: eventStart.toISOString(),
            end: eventEnd.toISOString(),
            duration: { hours: durationHours, minutes: durationMinutes },
            rrule: recurrenceRule,
            allDay: false,
            category: event.eventCategory?.id || null,
            //dili ni apil
            color: eventTypesColors[event.eventType?.id as keyof typeof eventTypesColors] || "#000000",
            // color: "#000000",
            eventDescription: event.eventDescription || "",
            participants: event.participants || [],
            departments: event.department || [],
          };
        })
        .filter((event): event is FormattedEventTwo => event !== null);
  
      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents([]);
    }
  };  

  const formControlStyles = {
    mb: 2,
    width: { xs: 100, sm: 250, lg: 250 },
  };

  const selectStyles = { height: 50 };

  const handleEventClick = (clickInfo: EventClickArg) => {
    // Check if event name is empty, meaning it's a Faculty-created event viewed by Dean/Chairperson
    // if (clickInfo.event.title === "") {
    //   // Prevent navigating to event details page

    //   return;
    // }

    setSelectedEvent(clickInfo.event);
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    setSelectedEvent(null);
  };

  const handleCategoryChange = (event: SelectChangeEvent<string[]>) => {
    setSelectedCategories(event.target.value as string[]); // Assuming multiple selection
  };

  const handleCollegeChange = (event: SelectChangeEvent<number[]>) => {
    setSelectedCollege(event.target.value as number[]);
  };

  const handleDepartmentChange = (event: SelectChangeEvent<number[]>) => {
    const selectedIds = event.target.value as number[];
    const selectedDepartments = departments.filter((dept) => selectedIds.includes(dept.id));
    setSelectedDepartment(selectedDepartments); 
  };

  const handleMonthChange = (event: SelectChangeEvent<string[]>) => {
    setSelectedMonth(event.target.value as string[]);
  };
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSearchTerm(event.target.value as string);
  };

  const handleViewDetails = () => {
    if (!selectedEvent) return;

    navigate(`/citc/portal/unieventify/app/eventdetails/${selectedEvent.id}`);
    handleClose();
  };

  const handleFacultyChange = (facultyId: number) => {
    setSelectedFaculty(facultyId); // Update the selected faculty ID
    fetchFacultyEvents(facultyId); // Fetch events for the selected faculty
  };

  // Filter logic
  const filteredEvents = events.filter((event: any) => {
    const categoryMatches =
      !selectedCategories.length || selectedCategories.includes(event.category);

    const departmentMatches =
      !selectedDepartment.length ||
      event.departments.some((dept: any) => selectedDepartment.includes(dept.id));

    const collegeMatches =
      !selectedCollege.length ||
      event.departments.some((dept: any) =>
        selectedCollege.includes(dept.collegeName)
      );

    const monthMatches =
      !selectedMonth.length ||
      selectedMonth.some(
        (month) =>
          new Date(event.start).getMonth() === new Date(month).getMonth()
      );

    const searchMatches =
      !searchTerm ||
      (event.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.eventDescription || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const facultyMatches =
        !selectedFaculty || 
        (Array.isArray(selectedFaculty) && event.participants &&
          event.participants.some((participant: any) => selectedFaculty.includes(participant.id))
        );

    return (
      categoryMatches &&
      departmentMatches &&
      collegeMatches &&
      monthMatches &&
      searchMatches &&
      facultyMatches
    );
  });

  const formatDateTime = (date: any) => {
    if (!date) return "";
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    };
    return new Intl.DateTimeFormat("en-US", options).format(new Date(date));
  };

  if (!(events && categories && colleges && departments && faculties && types))
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
    <Box
      sx={{
        width: "100%",
        maxWidth: 1200,
        mx: "auto",
        p: 3,
        borderRadius: 2,
        boxShadow: 3,
      }}
    >
      <Typography
        variant="h4"
        gutterBottom
        sx={{ mb: 2, color: colors.darkblue }}
      >
        Event Calendar
      </Typography>

      <FormControl sx={formControlStyles}>
        <InputLabel id="category-select-label">Event Categories</InputLabel>
        <Select
          labelId="category-select-label"
          id="category-select"
          multiple
          value={selectedCategories}
          onChange={handleCategoryChange}
          renderValue={(selected) =>
            categories
              .filter((category) => selected.includes(category.id))
              .map((category) => category.eventCategoryName)
              .join(", ")
          }
          sx={selectStyles}
        >
          {categories
            .filter((category) => category.eventCategoryName !== "personal")
            .map((category) => (
              <MenuItem key={category.id} value={category.id}>
                <Checkbox checked={selectedCategories.includes(category.id)} />
                <ListItemText primary={category.eventCategoryName} />
              </MenuItem>
            ))}
        </Select>
      </FormControl>

      <FormControl sx={formControlStyles}>
        <InputLabel id="college-select-label">College</InputLabel>
        <Select
          labelId="college-select-label"
          id="college-select"
          multiple
          value={selectedCollege}
          onChange={handleCollegeChange}
          renderValue={(selected) =>
            colleges
              .filter((college) => selected.includes(college.id))
              .map((college) => college.collegeName)
              .join(", ")
          }
          sx={selectStyles}
        >
          {colleges.map((college) => (
            <MenuItem key={college.id} value={college.id}>
              <Checkbox checked={selectedCollege.includes(college.id)} />
              <ListItemText primary={college.collegeName} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl sx={formControlStyles}>
        <InputLabel id="department-select-label">Department</InputLabel>
        <Select
          labelId="department-select-label"
          id="department-select"
          multiple
          value={selectedDepartment.map((dept) => dept.id)}
          onChange={handleDepartmentChange}
          renderValue={(selected) =>
            departments
              .filter((department) => selected.includes(department.id))
              .map((department) => department.departmentName)
              .join(", ")
          }
          sx={selectStyles}
        >
          {departments.map((department) => (
            <MenuItem key={department.id} value={department.id}>
              <Checkbox
                checked={selectedDepartment.some((dept) => dept.id === department.id)}
              />
              <ListItemText primary={department.departmentName} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>


      <FormControl sx={formControlStyles}>
        <InputLabel id="month-select-label">Month</InputLabel>
        <Select
          labelId="month-select-label"
          id="month-select"
          multiple
          value={selectedMonth}
          onChange={handleMonthChange}
          renderValue={(selected) =>
            selected
              .map((month) =>
                new Date(month).toLocaleString("default", { month: "long" })
              )
              .join(", ")
          }
          sx={selectStyles}
        >
          {Array.from({ length: 12 }).map((_, index) => {
            const monthDate = new Date(0, index).toISOString();
            return (
              <MenuItem key={index} value={monthDate}>
                <Checkbox checked={selectedMonth.includes(monthDate)} />
                <ListItemText
                  primary={new Date(0, index).toLocaleString("default", {
                    month: "long",
                  })}
                />
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      <FormControl sx={formControlStyles}>
        <InputLabel id="faculty-select-label">Faculty</InputLabel>
        <Select
          labelId="faculty-select-label"
          id="faculty-select"
          value={selectedFaculty}
          onChange={(e: any) => handleFacultyChange(e.target.value)} // Pass the selected faculty ID
          sx={selectStyles}
        >
          {faculties.map((faculty) => (
            <MenuItem key={faculty.id} value={faculty.id}>
              {faculty.first_name} {faculty.last_name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        label="Search"
        variant="outlined"
        fullWidth
        sx={{ mb: 2 }}
        value={searchTerm}
        onChange={handleSearchChange}
      />

      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">Event Type</Typography>
        {Object.entries(eventTypesColors).map(([eventTypeID, color]) => (
          <Box key={eventTypeID} sx={{ display: "flex", alignItems: "center" }}>
            <Box
              sx={{ width: 20, height: 20, backgroundColor: color, mr: 1 }}
            />
            <Typography variant="body1">
              {types.find((cat) => cat.id === parseInt(eventTypeID))
                ?.eventTypeName || "Unknown"}
            </Typography>
          </Box>
        ))}
      </Box>

      <FullCalendar
        plugins={[
          dayGridPlugin,
          timeGridPlugin,
          interactionPlugin,
          rrulePlugin,
        ]}
        events={filteredEvents.map((event) => ({
          ...event,
          backgroundColor: event.color,
        }))}
        eventClick={handleEventClick}
        editable={false}
      />

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Event Details</DialogTitle>
        <DialogContent>
          {selectedEvent && (
            <Box>
              <Typography variant="h6">{selectedEvent.title}</Typography>
              <Typography variant="subtitle1">
                {formatDateTime(selectedEvent.start)} -{" "}
                {formatDateTime(selectedEvent.end)}
              </Typography>
              <Typography variant="body1">
                {selectedEvent.extendedProps.eventDescription}
              </Typography>
              {selectedEvent.extendedProps.rrule && (
                <Typography variant="body2">
                  Recurrence Rule: {selectedEvent.extendedProps.rrule}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          {selectedEvent && (
            <Button onClick={handleViewDetails} color="primary">
              View Details
            </Button>
          )}
        </DialogActions>
      </Dialog>
      <ToastContainer position="top-center" />
    </Box>
  );
}
