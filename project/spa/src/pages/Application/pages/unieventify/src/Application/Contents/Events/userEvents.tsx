import React, { useEffect, useState } from "react";
import http from "../../../../../../../../http";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { EventInput } from "@fullcalendar/core"; 
import Cookies from "js-cookie";
import { SelectChangeEvent } from "@mui/material";
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
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { RRule, Weekday } from "rrule";
import rrulePlugin from "@fullcalendar/rrule";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { DeleteConfirmModal } from "../../../Components/DeleteConfirmModal";
import colors from "../../../Components/colors";
import { EventClickArg } from "@fullcalendar/core";
import { Event, EventCategory, Department } from "../../../Components/models";
import { start } from "repl";

const palette = {
  primary: "#FAB417",
  secondary: "#191750",
};

const eventcolors = {
  personal: "#FAB417",
  nonpersonal: "#191750",
};

interface Role {
  id: number;
  designation: string;
  rank: number;
}

interface Category{
  id: any;
  eventCategoryName: string;
}



interface UserEvents {
  id: string;
  eventName: string;
  start: string;
  end: string;
  duration: { hours: number; minutes: number };
  rrule: string | null;
  allDay: boolean;
  category: number | null;
  color: string;
  departments: Department[];
  participants: any[];
  created_by: User | null;
  eventCategory: EventCategory | null;
  eventType: string | string[] | null;  // Change eventType to an array of strings or null
  startDateTime: string;
  endDateTime: string;
}
interface User {
  id: number;
  idNumber: number;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  department: number;
  created_events?: UserEvents[];
}

export default function UserEvents() {
  const [events, setEvents] = useState<UserEvents[]>([{          
    id: "",
    eventName: "",
    start: "", // Use toISOString() to ensure correct formatting
    end: "", // Ensure end time is included
    duration: { hours: 0, minutes: 0 },
    rrule: "",
    allDay: false,
    category: 0,
    color: "",
    departments: [],
    participants: [],
    created_by: {
      id: 0,
      idNumber: 0,
      email: '',
      first_name: '',
      last_name: '',
      role: {
          id: 0,
          designation: '',
          rank: 0,
      },
      department: 0,
    },  // Replace with actual created_by data if available
    eventCategory: null,
    eventType: "",
    startDateTime: "",
    endDateTime: "",
    }]);
  const [listEvents, setListEvents] = useState<UserEvents[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<UserEvents | null>(null);
  const token = Cookies.get("auth_token");
  const navigate = useNavigate();
  const [openModal, setOpenModal] = useState(false);
  const [created, setCreated] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchEvents();
    fetchListEvents();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await http.get("eventcategories/");
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const formControlStyles = {
    mb: 2,
    width: { xs: 100, sm: 250, lg: 250 },
  };

  const fetchEvents = async () => {
    try {
      const response = await http.get("participatedevents/", {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      const formattedEvents = (response.data as Event[]).map((event: Event) => {
        const eventStart = new Date(event.startDateTime);
        const eventEnd = new Date(event.endDateTime);
      
        // Ensure that eventEnd is correctly parsed
        if (isNaN(eventEnd.getTime())) {
          console.error("Invalid event end date:", event.endDateTime);
        }
      
        const startOnlyTime = new Date(eventStart);
        const endOnlyTime = new Date(eventEnd);
        startOnlyTime.setFullYear(2000, 0, 1);
        endOnlyTime.setFullYear(2000, 0, 1);
      
        const durationMs = endOnlyTime.getTime() - startOnlyTime.getTime();
        const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
        const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      
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
                  ?.split(',').map((day: string) => {
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
                  .filter((day): day is Weekday => day !== null),
                until: eventEnd,
              }).toString()
            : null;
      
        return {
          id: event.id.toString(),
          eventName: event.eventName,
          start: eventStart.toISOString(),
          end: eventEnd.toISOString(),
          duration: { hours: durationHours, minutes: durationMinutes },
          rrule: recurrenceRule,
          allDay: false,
          category: event.eventCategory?.id || null,
          color: eventcolors.nonpersonal,
          departments: event.department || [],
          // Add missing fields with default values or null
          participants: [],  // Or actual participants data if available
          created_by: event.created_by || null,  // Replace with actual created_by data if available
          eventCategory: event.eventCategory || null,
          eventType: event.eventType || null,  // Include other required fields with default values
          startDateTime: event.startDateTime,
          endDateTime: event.endDateTime,
        };
      });
      
      setEvents(formattedEvents);
      
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchListEvents = async () => {
    try {
      const response = await http.get("userevents/", {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      // Assuming events are under `created_events` inside the response
      const events = response.data.map((user: User) => user.created_events).flat();

      const formattedListEvents = events.map((event: Event) => {
        // Parse start and end date-time
        const eventStart = new Date(event.startDateTime);
        const eventEnd = new Date(event.endDateTime);

        // Ensure that eventEnd is actually passed correctly (don't forget to check that it has been parsed)
        if (isNaN(eventEnd.getTime())) {
          console.error("Invalid event end date:", event.endDateTime);
        }

        // Set both dates to the same day to calculate time difference only
        const startOnlyTime = new Date(eventStart);
        const endOnlyTime = new Date(eventEnd);
        startOnlyTime.setFullYear(2000, 0, 1); // Set to a fixed date
        endOnlyTime.setFullYear(2000, 0, 1); // Same date for accurate time difference

        // Calculate the duration in hours and minutes between start time and end time
        const durationMs = endOnlyTime.getTime() - startOnlyTime.getTime();
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
                  ?.split(',').map((day: string) =>{
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
                  .filter((day): day is Weekday => day !== null),
                until: eventEnd,
              }).toString()
            : null;

        return {
          id: event.id,
          eventName: event.eventName,
          startDateTime: eventStart.toISOString(), // Use toISOString() to ensure correct formatting
          endDateTime: eventEnd.toISOString(), // Ensure end time is included
          duration: { hours: durationHours, minutes: durationMinutes },
          rrule: recurrenceRule,
          allDay: false,
          category: event.eventCategory?.id || null,
          color: eventcolors.personal,
          departments: event.department || [],
        };
      });

      setListEvents(formattedListEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const handleEventClick = (clickInfo: EventClickArg, created: boolean) => {
    setSelectedEvent({
      id: clickInfo.event.id,
      eventName: clickInfo.event.title,
      start: clickInfo.event.start?.toISOString() || "",
      end: clickInfo.event.end?.toISOString() || "",
      duration: { hours: 0, minutes: 0 }, // You may need to calculate this based on start and end
      rrule: clickInfo.event.extendedProps.rrule || null,
      allDay: clickInfo.event.allDay,
      category: clickInfo.event.extendedProps.category || null,
      color: clickInfo.event.backgroundColor,
      departments: clickInfo.event.extendedProps.departments || [],
      participants: clickInfo.event.extendedProps.participants || [],
      created_by: clickInfo.event.extendedProps.created_by || null,
      eventCategory: clickInfo.event.extendedProps.eventCategory || null,
      eventType: clickInfo.event.extendedProps.eventType || null,
      startDateTime: clickInfo.event.start?.toISOString() || "",
      endDateTime: clickInfo.event.end?.toISOString() || "",
    });
    setCreated(created);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedEvent(null);
  };

  const handleCategoryChange = (event: SelectChangeEvent<number[]>) => {
    setSelectedCategories(event.target.value as number[]);
  };

  const handleViewDetails = () => {
    if (!selectedEvent) return;
    navigate(`/auth/app/eventdetails/${selectedEvent.id}`);
    handleClose();
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;
    try {
      await http.delete(`events/${selectedEvent.id}/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      setListEvents(
        listEvents.filter((event) => event.id !== selectedEvent.id)
      );
      toast.success("Deleted successfully", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      setOpenModal(false);
      fetchEvents();
      fetchListEvents();
      handleClose();
    } catch (error) {
      toast.error("Something Wrong in Deleting. Please try again later.", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    }
  };

  // Filter events based on selected categories
  const filteredEvents = events.filter((event) =>
    selectedCategories.length
      ? event.eventCategory && selectedCategories.includes(event.eventCategory.id) // Check if event.eventCategory is not null and compare its id
      : true
  );
  
  const filteredListEvents = listEvents.filter((event) =>
    selectedCategories.length
      ? event.eventCategory && selectedCategories.includes(event.eventCategory.id) // Check if event.eventCategory is not null and compare its id
      : true
  );

  const combinedEvents = [...filteredEvents, ...filteredListEvents];

  const formatDateTime = (date: string | Date | undefined) => {
    if (!date) return "";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(new Date(date));
  };

  if (!(events && categories && listEvents))
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
      <Typography variant="h4" gutterBottom sx={{ mb: 2 }}>
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
              .filter((category: any) => selected.includes(category.id))
              .map((category: any) => category.eventCategoryName)
              .join(", ")
          }
          sx={{ bgcolor: "background.paper" }}
        >
          {categories.map((category: any) => (
            <MenuItem key={category.id} value={category.id}>
              <Checkbox checked={selectedCategories.includes(category.id)} />
              <ListItemText primary={category.eventCategoryName} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Box sx={{ mb: 2 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <Box
              sx={{
                width: 20,
                height: 20,
                backgroundColor: eventcolors.personal,
                mr: 1,
              }}
            />
            <Typography>Created Events</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <Box
              sx={{
                width: 20,
                height: 20,
                backgroundColor: eventcolors.nonpersonal,
                mr: 1,
              }}
            />
            <Typography>Participant Events</Typography>
          </Box>
        </Box>
        <Typography variant="h5" className="pt-5">
          Participated and Created Events
        </Typography>
      </Box>
      <FullCalendar
        plugins={[
          dayGridPlugin,
          timeGridPlugin,
          interactionPlugin,
          listPlugin,
          rrulePlugin,
          
        ]}
        initialView="dayGridMonth"
        // events={combinedEvents}
        eventClick={(e) => handleEventClick(e, true)}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay,listMonth",
        }}
      />

      {/* <Box>
        <Typography variant="h5" className="pt-5">
          Created Events
        </Typography>
      </Box>
      <FullCalendar
        plugins={[listPlugin]}
        initialView="listMonth"
        events={combinedEvents}
        eventClick={(e) => handleEventClick(e, true)}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "listMonth",
        }}
      /> */}

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle sx={{ bgcolor: palette.primary, color: "#fff" }}>
          {selectedEvent?.eventName}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="textSecondary">
            Start: {formatDateTime(selectedEvent?.startDateTime)}
          </Typography>
          <Typography variant="body1" color="textSecondary">
            End: {formatDateTime(selectedEvent?.endDateTime)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleViewDetails} color="primary">
            View Details
          </Button>
          {created && (
            <Button
              onClick={() => {
                setOpenModal(true);
                setOpen(false);
              }}
              color="secondary"
            >
              Delete
            </Button>
          )}
          <Button onClick={handleClose} color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
      <DeleteConfirmModal
        name="event"
        openModal={openModal}
        setOpenModal={setOpenModal}
        handleDelete={handleDelete} // Pass handleDelete as a prop
        type=""
        setRemark={() => {}}
        remark={null}
      />
      <ToastContainer />
    </Box>
  );
}
