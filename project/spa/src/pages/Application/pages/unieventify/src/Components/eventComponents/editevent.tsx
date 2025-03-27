import { useState, useEffect } from "react";
import {
  Container,
  Grid,
  TextField,
  MenuItem,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  FormGroup,
  Dialog,
  Chip,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import http from "../../../../../../../http";
import colors from "../colors";
import { DateTime } from "luxon";
import { FileInput, Label, Alert } from "flowbite-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "draft-js/dist/Draft.css";
import DraftEditor from "./draft components/DraftEditor"; // Adjust the import path as necessary
import PlaceIcon from "@mui/icons-material/Place";
import DateRangeIcon from "@mui/icons-material/DateRange";
import Brightness1Icon from "@mui/icons-material/Brightness1";
import CustomDeleteButton from "../customdeletebutton";
import InfoIcon from "@mui/icons-material/Info";
import CustomButton from "../button";
import Tooltip from "@mui/material/Tooltip";
import { EventCategory, User, Setup, Venue, EventType, College, Status, Role, Department } from "../models";
import { useAppSelector } from "../../../../../../../hooks";

// Define API endpoints
const API_VENUES = "unieventify/venues/";
const API_SETUPS = "unieventify/setups/";
const API_STATUS = "unieventify/status/";
const API_EVENTTYPES = "unieventify/eventtypes/";
const API_EVENT_CATEGORIES = "unieventify/eventcategories/";
const API_USERS = "unieventify/users/";
const API_DEPARTMENTS = "unieventify/departments/";
const API_USER_ROLES = "unieventify/userroles/";
const API_COLLEGES = "unieventify/departmentsbycollege/";
const API_EVENTS = "unieventify/events/";
const API_UNAVAILABLE_PERSONAL = "unieventify/unavail-slots/personal/";
const API_UNAVAILABLE_NONPERSONAL = "unieventify/unavail-slots/nonpersonal/";
const API_PARTICIPANTS = "unieventify/roles/events/";

//selected category
const ftf = "in_person";
const online = "virtual";
const bothSetup = "hybrid";

//newwwww

//status
const ongoing = "ongoing";
const done = "done";
const upcoming = "upcoming";
const draft = "draft";
const postponed = "postponed";

//designation
const OrgType = ["mother org", "unit org"];
const student = "student";
const deanAndChairperson = ["Dean", "Chairperson"];

// new event category
const departmentCategory = ["department", "student organization", "exam"];

const personalCategory = "personal";
const personalCat = "Personal";
const examCategory = "exam";
const restrictCategory = ["exam", "university"];

// college
const CITC = "CITC";

// college and university entity
const collegeCategory = ["college", "university"];
// setup
const inperson = "in_person";

interface EditEventProps {
  event: any;
  eventID: number | undefined;
  isEdit: boolean;
  setEditing: any;
  isResched: boolean;
  setResched: any;
  currentUser: any;
}

interface Slot {
  slot: any
}

interface ConflictingEvent {
  start: number,
  end: number,
  proceedable: [],
  nonProceedable: [],
}

const EditEvent = ({
  event,
  eventID,
  isEdit,
  setEditing,
  isResched,
  setResched,
  currentUser,
}: EditEventProps) => {
  const token = useAppSelector(state => state.auth.token)
  const [loading, setLoading] = useState(false);
  const [eventName, setEventName] = useState(event?.eventName || "");
  const [eventDescription, setEventDescription] = useState(
    event?.eventDescription || ""
  );
  const [startDateTime, setStartDateTime] = useState(
    event?.startDateTime ? event?.startDateTime.slice(0, 16) : ""
  );
  const [endDateTime, setEndDateTime] = useState(
    event?.endDateTime ? event?.endDateTime.slice(0, 16) : ""
  );
  const [venue, setVenue] = useState(event?.venue?.id || "");
  const [setup, setSetup] = useState(event?.setup?.id || "");
  const [meetingLink, setMeetingLink] = useState(event?.meetinglink || "");
  const [sameStatus, setSameStatus] = useState(event?.status?.id || "");
  const [eventType, setEventType] = useState<EventType[]>([]);
  const [selectedEventType, setSelectedEventType] = useState(
    event?.eventType?.id || ""
  );
  const [category, setCategory] = useState(event?.eventCategory?.id || "");
  const [approveDocuments, setApproveDocuments] = useState<File | null>(null);
  const [images, setImages] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState(
    event?.participants
      ? event?.participants.map((participant: any) => participant.uuid)
      : []
  );
  const [filteredParticipants, setFilteredParticipants] = useState<User[]>([]);
  const [checkedParticipants, setCheckedParticipants] = useState<string[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [setups, setSetups] = useState<Setup[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedColleges, setSelectedColleges] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState(
    event?.department
      ? event?.department.map((department: any) => department.id)
      : []
  );
  const [roles, setRoles] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isAnnouncement, setIsAnnouncement] = useState(
    event?.isAnnouncement ? event?.isAnnouncement : false
  );
  const [isInPerson, setIsInPerson] = useState(false);
  const [conflictingEvent, setConflictingEvent] = useState<{
    proceedable: Slot[];
    nonProceedable: Slot[];
  }>({ proceedable: [], nonProceedable: [] });
  const [dateError, setDateError] = useState("");
  const [unavailableSlotsPersonal, setUnavailableSlotsPersonal] = useState<Slot[]>([]);
  const [unavailableSlotsNonPersonal, setUnavailableSlotsNonPersonal] = useState<Slot[]>([]);

  const [openModal, setOpenModal] = useState(false); // State to control modal visibility
  const [searchTerm, setSearchTerm] = useState("");

  const [recurrenceType, setRecurrenceType] = useState(
    event?.recurrence_type ? event?.recurrence_type : "none"
  ); // "none", "daily", "weekly"
  const [recurrenceDays, setRecurrenceDays] = useState(
    event?.recurrence_days
      ? event?.recurrence_days
      : {
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
      }
  );
  const [checkedEvents, setCheckedEvents] = useState<string[]>([]);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const MAX_FILE_SIZE_MB = 5; // Maximum file size in MB
  const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024; // Convert to bytes

  // Find the selected category name
  const findcategory = categories.find((cat: any) => cat.id === category);
  const findsetup = setups.find((set: any) => set.id === setup);
  const currentUserEmail = currentUser.email;

  const personal = event?.eventCategory?.eventCategoryName === personalCat;

  const handleRecurrenceTypeChange = (event: any) => {
    setRecurrenceType(event.target.value);
  };

  const handleRecurrenceDayChange = (event: any) => {
    setRecurrenceDays({
      ...recurrenceDays,
      [event.target.name]: event.target.checked,
    });
  };

  const textFieldStyle = {
    "& .MuiInputLabel-asterisk": {
      color: "red", // Custom asterisk color
    },
  };

  useEffect(() => {
    http
      .get(API_VENUES, { headers: { Authorization: `Token ${token}` } })
      .then((response) => setVenues(response.data))
      .catch((error) => console.error("Error fetching venues:", error));

    http
      .get(API_SETUPS, { headers: { Authorization: `Token ${token}` } })
      .then((response) => setSetups(response.data))
      .catch((error) => console.error("Error fetching setups:", error));

    http
      .get(API_STATUS, { headers: { Authorization: `Token ${token}` } })
      .then((response) => setStatuses(response.data))
      .catch((error) => console.error("Error fetching status:", error));

    http
      .get(API_EVENTTYPES, { headers: { Authorization: `Token ${token}` } })
      .then((response) => {
        setEventType(response.data);
      })
      .catch((error) => {
        console.error("Error fetching event types:", error);
      });

    http
      .get(API_EVENT_CATEGORIES, {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => setCategories(response.data))
      .catch((error) => console.error("Error fetching categories:", error));

    http
      .get(API_USERS, { headers: { Authorization: `Token ${token}` } })
      .then((response) => {
        const filteredUsers = response.data.filter(
          (users: any) => users.is_active === true
        );
        setUsers(filteredUsers);
      })
      .catch((error) => console.error("Error fetching users:", error));

    http
      .get(API_DEPARTMENTS, { headers: { Authorization: `Token ${token}` } })
      .then((response) => setDepartments(response.data))
      .catch((error) => console.error("Error fetching departments:", error));

    http
      .get(API_USER_ROLES, { headers: { Authorization: `Token ${token}` } })
      .then((response) => setRoles(response.data))
      .catch((error) => console.error("Error fetching roles:", error));

    http
      .get(API_COLLEGES, { headers: { Authorization: `Token ${token}` } })
      .then((response) => setColleges(response.data))
      .catch((error) => console.error("Error fetching colleges:", error));

    http
      .get(API_UNAVAILABLE_PERSONAL, {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => setUnavailableSlotsPersonal(response.data))
      .catch((error) =>
        console.error("Error fetching personal unavailable slots:", error)
      );

    http
      .get(API_UNAVAILABLE_NONPERSONAL, {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => setUnavailableSlotsNonPersonal(response.data))
      .catch((error) =>
        console.error("Error fetching nonpersonal unavailable slots:", error)
      );

    http
      .get(API_PARTICIPANTS, { headers: { Authorization: `Token ${token}` } })
      .then((response) => setParticipants(response.data))
      .catch((error) => console.error("Error fetching participants:", error));
    http
      .get(API_COLLEGES, { headers: { Authorization: `Token ${token}` } })
      .then((response) => setColleges(response.data))
      .catch((error) => console.error("Error fetching participants:", error));
    http
      .get(API_DEPARTMENTS, { headers: { Authorization: `Token ${token}` } })
      .then((response) => setDepartments(response.data))
      .catch((error) => console.error("Error fetching participants:", error));
  }, [token]);

  useEffect(() => {
    if (isEdit && !currentUser.is_staff && !personal) {
      setShowAdditionalFields(true);
    }
    if (
      collegeCategory.includes(findcategory?.eventCategoryName.toLowerCase() || "")
    ) {
      const allDepartmentIds = departments
        .filter(
          (department) =>
            !department.name.toLowerCase().startsWith("all")
        ) // Exclude departments starting with "All"
        .map((department) => department.id);

      setSelectedDepartments(allDepartmentIds);
    } else if (
      findcategory?.eventCategoryName.toLowerCase() === personalCategory
    ) {
      setSelectedDepartments([]);
    }
  }, [token, findcategory, departments, collegeCategory, personalCategory]);

  const generateAvailableSlots = (
    start: any,
    end: any,
    unavailableSlots: any,
    participantsData: any,
    selectedVenue: any
  ) => {
    const availableSlots = [];
    const durationInMillis = end.diff(start).as("milliseconds");
    const today = DateTime.now();
    let currentAfter = start;
    let currentBefore = start.minus({ days: 1 });
    let slotsCount = 0;
    const dayStartTime = 8;
    const dayEndTime = 21;
    const venuefind = venues.find((ven) => ven.id === selectedVenue);

    const hasConflict = (slotStart: any, slotEnd: any) => {
      return unavailableSlots.some((slot: any) => {
        const slotStartUnavailable = DateTime.fromISO(slot.start);
        const slotEndUnavailable = DateTime.fromISO(slot.end);
        const conflictWithVenue =
          venuefind && slot.venueName && slot.venueName !== venuefind.venueName;
        return (
          !conflictWithVenue &&
          slotStart < slotEndUnavailable &&
          slotEnd > slotStartUnavailable
        );
      });
    };

    const isWithinAvailableHours = (slotStart: any, slotEnd: any) => {
      const startHour = slotStart.hour;
      const endHour = slotEnd.hour;
      return startHour >= dayStartTime && endHour <= dayEndTime;
    };

    // Generate slots without conflicts
    while (slotsCount < 10 && currentBefore >= today.startOf("day")) {
      for (let hour = dayStartTime; hour <= dayEndTime; hour++) {
        const suggestedStartTime = currentBefore.set({ hour, minute: 0 });
        const nextSlotEnd = suggestedStartTime.plus({
          milliseconds: durationInMillis,
        });

        if (
          suggestedStartTime.day !== currentBefore.day ||
          !isWithinAvailableHours(suggestedStartTime, nextSlotEnd) ||
          hasConflict(suggestedStartTime, nextSlotEnd)
        ) {
          continue;
        }

        // Count available participants for the slot
        const availableParticipantsCount = countAvailableParticipants(
          suggestedStartTime,
          nextSlotEnd,
          participantsData
        );

        availableSlots.push({
          start: suggestedStartTime.toISO(),
          end: nextSlotEnd.toISO(),
          availableCount: availableParticipantsCount, // Add participant count
        });
        slotsCount += 1;
        if (slotsCount >= 5) break;
      }

      currentBefore = currentBefore.minus({ days: 1 });
      if (
        currentBefore < today.startOf("day") ||
        currentBefore.month !== start.month
      )
        break;
    }

    while (slotsCount < 10) {
      for (let hour = dayStartTime; hour <= dayEndTime; hour++) {
        const suggestedStartTime = currentAfter.set({ hour, minute: 0 });
        const nextSlotEnd = suggestedStartTime.plus({
          milliseconds: durationInMillis,
        });

        if (
          suggestedStartTime.day !== currentAfter.day ||
          !isWithinAvailableHours(suggestedStartTime, nextSlotEnd) ||
          hasConflict(suggestedStartTime, nextSlotEnd)
        ) {
          continue;
        }

        // Count available participants for the slot
        const availableParticipantsCount = countAvailableParticipants(
          suggestedStartTime,
          nextSlotEnd,
          participantsData
        );

        availableSlots.push({
          start: suggestedStartTime.toISO(),
          end: nextSlotEnd.toISO(),
          availableCount: availableParticipantsCount, // Add participant count
        });
        slotsCount += 1;
        if (slotsCount >= 5) break;
      }

      currentAfter = currentAfter.plus({ days: 1 });
      if (currentAfter.month !== start.month) break;
    }

    return availableSlots;
  };

  // Function to count available participants for a time slot
  const countAvailableParticipants = (slotStart: any, slotEnd: any, participantsData: any) => {
    let count = 0;
    participantsData?.forEach((participant: any) => {
      // Combine participated and created events
      const allEvents = [
        ...participant.participated_events,
        ...participant.created_events,
      ];

      // Filter out events with category 'tasks' or 'personal'
      const filteredEvents = allEvents.filter((event) => {
        return (
          event.eventCategory &&
          event?.eventCategory?.eventCategoryName &&
          event?.eventCategory?.eventCategoryName !== personalCat
        );
      });

      // Check if the participant is available
      const isAvailable = filteredEvents.every((event) => {
        const eventStart = DateTime.fromISO(event.startDateTime);
        const eventEnd = DateTime.fromISO(event.endDateTime);
        return slotEnd <= eventStart || slotStart >= eventEnd; // No overlap
      });

      if (isAvailable) count++;
    });
    return count;
  };

  const TimeSlotPicker = ({
    startDateTime,
    endDateTime,
    unavailableSlotsPersonal,
    unavailableSlotsNonPersonal,
    handleTimeSelect,
    findcategory,
    participantsData,
    selectedVenue, // Added selected venue
  }: {
    startDateTime: string;
    endDateTime: string;
    unavailableSlotsPersonal: any[];
    unavailableSlotsNonPersonal: any[];
    handleTimeSelect: (suggestion: any) => void;
    findcategory: any;
    participantsData: any[];
    selectedVenue: string;
  }) => {
    let relevantSlots = null;

    // Determine which unavailable slots to consider based on the category
    if (
      findcategory &&
      findcategory?.eventCategoryName.toLowerCase() === personalCategory
    ) {
      relevantSlots = unavailableSlotsPersonal;
    } else {
      relevantSlots = unavailableSlotsNonPersonal;
    }

    // Generate suggestions based on the selected category and venue
    const suggestions = generateAvailableSlots(
      DateTime.fromISO(startDateTime),
      DateTime.fromISO(endDateTime),
      relevantSlots,
      participantsData,
      selectedVenue // Pass the selected venue to filter slots
    );

    return (
      <div>
        {/* Display if no slots are available */}
        {suggestions.length === 0 ? (
          <Typography>
            No available time slots in the selected range.
          </Typography>
        ) : (
          <ul>
            {/* Map through and display available slots */}
            {suggestions.map((slot, index) => (
              <li
                key={index}
                onClick={() => handleTimeSelect(slot)}
                style={{
                  cursor: "pointer",
                  padding: "10px",
                  borderBottom: "1px solid #ccc",
                }}
              >
                <Box sx={{ display: "flex", flexDirection: "row", gap: 5 }}>
                  <Typography>
                    {DateTime.fromISO(slot.start).toLocaleString(
                      DateTime.DATETIME_SHORT
                    )}{" "}
                    -{" "}
                    {DateTime.fromISO(slot.end).toLocaleString(
                      DateTime.DATETIME_SHORT
                    )}
                  </Typography>
                  <Typography sx={{ ml: 5 }}>{slot.availableCount}</Typography>
                </Box>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  const checkForConflicts = () => {
    const inputStart = new Date(startDateTime);
    const inputEnd = new Date(endDateTime);
    let conflicts = [];
    let proceedableEvents: Slot[] = [];
    let nonProceedableEvents: Slot[] = [];

    // Define a helper function to check if the current user is part of the event
    const userInEvent = (event: any) => {
      const isCreator = event.created_by.email === currentUserEmail;
      const isParticipant = event.participants.some(
        (participant: any) => participant.email === currentUserEmail
      );
      return isCreator || isParticipant;
    };

    // Helper function to check if an event belongs to the selected departments
    const eventInSelectedDepartments = (event: any) => {
      // Iterate through event's departments to check if any ID matches selectedDepartments
      return event.departments.some((department: any) =>
        selectedDepartments.includes(department.id)
      );
    };
    if (findcategory?.eventCategoryName?.toLowerCase() === personalCategory) {
      // Personal category, check against personal unavailable slots
      conflicts = unavailableSlotsPersonal.filter((slot: any) => {
        const slotStart = new Date(slot.start);
        const slotEnd = new Date(slot.end);
        const timeConflict =
          (slotStart >= inputStart && slotStart < inputEnd) ||
          (slotEnd > inputStart && slotEnd <= inputEnd) ||
          (slotStart <= inputStart && slotEnd >= inputEnd);
        return timeConflict && userInEvent(slot); // Check both time and user conflicts
      });
    } else {
      // Nonpersonal category, check against nonpersonal unavailable slots
      conflicts = unavailableSlotsNonPersonal.filter((slot: any) => {
        const slotStart = new Date(slot.start);
        const slotEnd = new Date(slot.end);
        const timeConflict =
          (slotStart >= inputStart && slotStart < inputEnd) ||
          (slotEnd > inputStart && slotEnd <= inputEnd) ||
          (slotStart <= inputStart && slotEnd >= inputEnd);
        return departmentCategory.includes(
          findcategory?.eventCategoryName?.toLowerCase() ?? ''
        )
          ? timeConflict &&
          (eventInSelectedDepartments(slot) ||
            slot.category.toLowerCase() === examCategory)
          : timeConflict;
      });
    }

    // Handle conflicts
    if (
      conflicts.length > 0 &&
      findcategory?.eventCategoryName.toLowerCase() === personalCategory
    ) {
      setConflictingEvent({
        proceedable: conflicts,
        nonProceedable: nonProceedableEvents,
      });
      setOpenModal(true);
    } else if (conflicts.length === 0) {
      setShowAdditionalFields(true);
    } else {
      conflicts?.forEach((event: any) => {
        if (event.category.toLowerCase() === examCategory) {
          nonProceedableEvents.push(event);
        } else {
          proceedableEvents.push(event);
        }
      });
      setConflictingEvent({
        proceedable: proceedableEvents,
        nonProceedable: nonProceedableEvents,
      });
      setOpenModal(true);
    }
  };

  // Handler when a suggested time slot is selected
  const handleTimeSelect = (suggestion: any) => {
    setStartDateTime(suggestion.start.slice(0, 16));
    setEndDateTime(suggestion.end.slice(0, 16));
    setOpenModal(false);
  };
  const handleSubmit = (e: any) => {
    e.preventDefault();
    const isPersonalCategory =
      findcategory?.eventCategoryName.toLowerCase() === personalCategory;

    // Check if the selected category requires docu ments
    if (
      !(approveDocuments ? approveDocuments : event?.approveDocuments) &&
      !isPersonalCategory &&
      !isAnnouncement
    ) {
      toast.error("You need to upload documents for this category.", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      return; // Stop form submission
    }

    if (
      !(images ? images : event?.images) &&
      !isPersonalCategory &&
      !isAnnouncement
    ) {
      toast.error("You need to upload Image.", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      return; // Stop form submission
    }

    if (
      !setup &&
      !isAnnouncement &&
      findcategory?.eventCategoryName !== personalCat
    ) {
      toast.error("Please Select a Setup.", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      return; // Stop form submission
    }

    setLoading(true);

    // Parsing start and end dates
    const start = DateTime.fromISO(startDateTime);
    const end = DateTime.fromISO(endDateTime);
    const now = DateTime.now();

    // Determine the event status based on current date
    let status: any;

    if (
      findcategory?.eventCategoryName.toLowerCase() !== personalCategory &&
      !(currentUser?.is_staff
        ? currentUser?.is_staff
        : deanAndChairperson.includes(currentUser?.roles?.name))
    ) {
      // Automatically set status to draft
      status = draft;
    } else {
      // Determine the event status based on current date for other roles
      if (now < start) {
        status = upcoming; // Before the start
      } else if (now >= start && now <= end) {
        status = ongoing; // Between start and end
      } else {
        status = done; // After the end
      }
    }

    const findstatus = statuses.find((stat) => stat.name === status);

    if (isEdit || isResched) {
      const formData = new FormData();
      formData.append("eventName", eventName);
      formData.append("eventDescription", eventDescription);
      formData.append("startDateTime", startDateTime);
      formData.append("endDateTime", endDateTime);
      formData.append("recurrence_type", recurrenceType);
      if (isResched) {
        if (findstatus) {
          formData.append("status", findstatus.id.toString());
        }
      } else {
        formData.append("status", sameStatus);
      }

      formData.append("isAnnouncement", isAnnouncement);
      formData.append("eventType", selectedEventType);
      if (venue) formData.append("venue", venue);
      if (setup) formData.append("setup", setup);
      if (meetingLink) formData.append("meetinglink", meetingLink);
      if (category) formData.append("eventCategory", category);
      if (approveDocuments)
        formData.append("approveDocuments", approveDocuments);
      if (images) formData.append("images", images);
      if (selectedParticipants.length > 0) {
        selectedParticipants?.forEach((participant: any) =>
          formData.append("participants", participant)
        );
      }
      // Append selected departments
      if (selectedDepartments.length > 0) {
        selectedDepartments?.forEach((departments: any) => {
          formData.append("department", departments); // Append department ID
        });
      }
      if (recurrenceType === "weekly") {
        const selectedDays = Object.keys(recurrenceDays).filter(
          (day) => recurrenceDays[day]
        );
        formData.append("recurrence_days", JSON.stringify(selectedDays));
      }
      http
        .patch(`unieventify/events/${eventID}/`, formData, {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "multipart/form-data",
          },
        })
        .then((response) => {
          toast.success(`Successfull: ${response.data.eventName}`, {
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
          });

          // Reset form fields after success
          setEventName("");
          setEventDescription("");
          setStartDateTime("");
          setEndDateTime("");
          setRecurrenceType("");
          setVenue("");
          setSetup("");
          setMeetingLink("");
          setCategory("");
          setApproveDocuments(null);
          setImages(null);
          setSelectedParticipants([]);
          setRecurrenceDays({});
          setSelectedDepartments([]);
          setSelectAll(false);
          setShowAdditionalFields(false);
          setSelectedEventType("");
          // Reload the window after 5 seconds
          setTimeout(() => {
            window.location.reload();
          }, 3000); // 5000 milliseconds = 5 seconds
        })
        .catch((error) => {
          toast.error(`Error: ${error.data}`, {
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
          });
          setLoading(false);
        });
    } else {
      const formData = new FormData();
      formData.append("eventName", eventName);
      formData.append("eventDescription", eventDescription);
      formData.append("startDateTime", startDateTime);
      formData.append("endDateTime", endDateTime);
      formData.append("recurrence_type", recurrenceType);
      if (findstatus) {
        formData.append("status", findstatus.id.toString());
      }
      formData.append("isAnnouncement", isAnnouncement);
      formData.append("eventType", selectedEventType);
      if (venue) formData.append("venue", venue);
      if (setup) formData.append("setup", setup);
      if (meetingLink) formData.append("meetinglink", meetingLink);
      if (category) formData.append("eventCategory", category);
      if (approveDocuments)
        formData.append("approveDocuments", approveDocuments);
      if (images) formData.append("images", images);
      if (selectedParticipants.length > 0) {
        selectedParticipants?.forEach((participant: any) =>
          formData.append("participants", participant)
        );
      }
      // Append selected departments
      if (selectedDepartments.length > 0) {
        selectedDepartments?.forEach((departments: any) => {
          formData.append("department", departments); // Append department ID
        });
      }
      if (recurrenceType === "weekly") {
        const selectedDays = Object.keys(recurrenceDays).filter(
          (day) => recurrenceDays[day]
        );
        formData.append("recurrence_days", JSON.stringify(selectedDays));
      }
      http
        .post(API_EVENTS, formData, {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "multipart/form-data",
          },
        })
        .then((response) => {
          toast.success(
            `Event Posted Successfully: ${response.data.eventName}`,
            {
              position: "top-center",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "light",
            }
          );

          // Reset form fields after success
          setEventName("");
          setEventDescription("");
          setStartDateTime("");
          setEndDateTime("");
          setRecurrenceType("");
          setVenue("");
          setSetup("");
          setMeetingLink("");
          setCategory("");
          setApproveDocuments(null);
          setImages(null);
          setSelectedParticipants([]);
          setRecurrenceDays({});
          setSelectedDepartments([]);
          setSelectAll(false);
          setShowAdditionalFields(false);
          setSelectedEventType("");
          setLoading(false);
          // Reload the window after 5 seconds
          setTimeout(() => {
            window.location.reload();
          }, 3000); // 5000 milliseconds = 5 seconds
        })
        .catch((error) => {
          // Check if the error has a response object
          if (error.response) {
            // Log the response details
            console.error("Error Response:", error.response);
            toast.error(`Error Posting Event: ${error.response.data}`, {
              position: "top-center",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "light",
            });
          } else if (error.request) {
            // If there is no response, log the request details
            console.error("Error Request:", error.request);
            toast.error("Error Posting Event: No response received", {
              position: "top-center",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "light",
            });
          } else {
            // General error message if the issue is not related to response or request
            console.error("Error Message:", error.message);
            toast.error(`Error Posting Event: ${error.message}`, {
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
          setLoading(false);
        });
    }
  };
  const isPersonalCategory =
    findcategory?.eventCategoryName?.toLowerCase() ===
    personalCategory.toLowerCase();
  const handleProceed = () => {
    if (
      !eventName ||
      !eventDescription ||
      !startDateTime ||
      !endDateTime ||
      !category ||
      !eventType ||
      (!isPersonalCategory && selectedDepartments.length === 0)
    ) {
      toast.error("Please check the missing input", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } else {
      const start = new Date(startDateTime);
      const end = new Date(endDateTime);

      if (start > end) {
        setDateError("Start date cannot be later than the end date.");
        return;
      } else {
        checkForConflicts(); // Check for conflicts before proceeding
      }
      setDateError(""); // Clear error if validation passes
    }
  };
  // Function to close the modal
  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleProceedAnyway = () => {
    // User chooses to proceed despite conflicts for personal events
    setOpenModal(false);
    setShowAdditionalFields(true);
  };

  useEffect(() => {
    const collegesSet = new Set<string>();  // Explicitly define the type as string
    selectedDepartments?.forEach((departmentId: any) => {
      const department = departments.find((dep) => dep.id === departmentId);
      if (department) {
        collegesSet.add(department?.college?.toString());
      }
    });
    setSelectedColleges(Array.from(collegesSet) as string[]);  // Type cast to string[]
  }, [selectedDepartments, departments]);

  const handleCategoryChanges = (event: any) => {
    const selectedCategory = event.target.value;
    setCategory(selectedCategory);
    setShowAdditionalFields(false);
  };


  // Handle department change and automatically set colleges
  const handleDepartmentChange = (event: any) => {
    setShowAdditionalFields(false);
    const selectedDeps = event.target.value;

    // Check if "All CITC Department" is selected
    const isAllCITCSelected = selectedDeps.includes(CITC); // We use a unique identifier for the selection

    if (isAllCITCSelected) {
      // Get the "CITC" college
      const citcCollege = colleges.find(
        (college) => college.name === CITC
      );

      // Select all departments that belong to the CITC college
      const allCITCDepartmentIds = departments
        .filter(
          (department) =>
            department.college === citcCollege?.id &&
            !department.name.toLowerCase().startsWith("all")
        ) // Exclude departments starting with "All"
        .map((department) => department.id);

      setSelectedDepartments(allCITCDepartmentIds);

      // Automatically set selectedColleges based on selected departments
      const collegesSet = new Set<string>(); // Explicitly define the type as string
      allCITCDepartmentIds?.forEach((departmentId) => {
        const department = departments.find((dep) => dep.id === departmentId);
        if (department) {
          collegesSet.add(department?.college?.toString());
        }
      });
      setSelectedColleges(Array.from(collegesSet) as string[]); // Type cast to string[]
    } else {
      setSelectedDepartments(selectedDeps);

      // Automatically set selectedColleges based on selected departments
      const collegesSet = new Set<string>(); // Explicitly define the type as string
      selectedDeps?.forEach((departmentId: any) => {
        const department = departments.find((dep) => dep.id === departmentId);
        if (department) {
          collegesSet.add(department?.college?.toString());
        }
      });
      setSelectedColleges(Array.from(collegesSet) as string[]); // Type cast to string[]
    }
  };


  const handleIsRecurring = (event: any) => {
    setIsRecurring(event.target.checked);
  };

  // Handle checkbox changes
  const handleCheckboxChange = (eventId: any, isChecked: any) => {
    const updatedCheckedEvents = isChecked
      ? [...checkedEvents, eventId] // Add event ID if checked
      : checkedEvents.filter((id) => id !== eventId); // Remove event ID if unchecked

    setCheckedEvents(updatedCheckedEvents);
    setShowContinueButton(updatedCheckedEvents.length > 0); // Show "Continue" button if any checkbox is checked
  };

  // Handle "Continue" button click
  const handleContinue = async () => {
    try {
      // Iterate over checked events and perform override action
      for (const eventId of checkedEvents) {
        await handleOverride(eventId);
      }
      toast.success("Selected events have been postponed successfully!");
      setCheckedEvents([]); // Reset checked events after successful override
      setShowContinueButton(false); // Hide "Continue" button
      setOpenModal(false);
      setShowAdditionalFields(true);
    } catch (error) {
      console.error("Failed to override events:", error);
      toast.error("Failed to override events. Please try again.");
    }
  };

  // Function to handle the override for a single event
  const handleOverride = async (eventId: any) => {
    try {
      const findstatus = statuses?.find(
        (stat) => stat.name === postponed
      );
      await http.patch(
        `events/${eventId}/`,
        {
          status: findstatus?.id,
        },
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );
    } catch (error) {
      console.error(`Failed to update the event ${eventId}:`, error);
      throw error; // Rethrow the error to handle it in the handleContinue
    }
  };

  const handleImageChange = (event: any) => {
    const file = event.target.files[0];

    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File size should be less than ${MAX_FILE_SIZE_MB} MB`, {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      } else {
        setImages(file);
      }
    }
  };

  let documents;
  if (OrgType.includes(currentUser?.roles?.name?.toLowerCase())) {
    documents = "SARF";
  } else {
    documents = "Documents";
  }

  const getCurrentDateTime = () => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");
    const hours = String(currentDate.getHours()).padStart(2, "0");
    const minutes = String(currentDate.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const filterParticipants = () => {
    const normalizedStart = new Date(startDateTime);
    const normalizedEnd = new Date(endDateTime);

    const conflictingParticipantIds = participants
      .filter((participant: any) => {
        const allEvents = [
          ...participant.participated_events,
          ...participant.created_events,
        ].filter(
          (event) => event?.eventCategory?.eventCategoryName !== personalCat
        );

        return allEvents.some((event) => {
          const eventStart = new Date(event.startDateTime);
          const eventEnd = new Date(event.endDateTime);

          return (
            (normalizedStart >= eventStart && normalizedStart < eventEnd) ||
            (normalizedEnd > eventStart && normalizedEnd <= eventEnd) ||
            (normalizedStart <= eventStart && normalizedEnd >= eventEnd)
          );
        });
      })
      .map((participant: any) => participant.uuid);

    return users.filter((user) => {
      const matchCollege =
        selectedColleges.length === 0 ||
        selectedColleges.includes(user.department?.college.toString());
      const matchDepartment =
        selectedDepartments.length === 0 ||
        selectedDepartments.includes(user.department?.id);

      const searchFields = [
        `${user.first_name} ${user.middle_name || ""} ${user.last_name
          }`.toLowerCase(),
        user.idNumber?.toString().toLowerCase() || "",
        user.role?.name?.toLowerCase() || "",
        user.department?.name?.toLowerCase() || "",
        user.email?.toLowerCase() || "",
        user.section?.section?.toLowerCase() || "",
        user.organization?.studentOrgName?.toLowerCase() || "",
      ];

      const isConflicting = conflictingParticipantIds.includes(user.uuid);

      return (
        matchCollege &&
        matchDepartment &&
        !isConflicting &&
        searchFields.some((field) => field.includes(searchTerm.toLowerCase()))
      );
    });
  };

  const handleSearchChange = (e: any) => {
    setSearchTerm(e.target.value);
  };

  const handleAddParticipant = (uuid: any) => {
    if (!selectedParticipants.includes(uuid)) {
      setSelectedParticipants((prev: any) => [...prev, uuid]);
    }
  };

  const handleToggleCheckbox = (uuid: any) => {
    if (checkedParticipants.includes(uuid)) {
      setCheckedParticipants((prev) =>
        prev.filter((participant) => participant !== uuid)
      );
    } else {
      setCheckedParticipants((prev) => [...prev, uuid]);
    }
  };

  const handleSelectAllparticipants = (e: any) => {
    if (e.target.checked) {
      setCheckedParticipants(selectedParticipants);
    } else {
      setCheckedParticipants([]);
    }
  };

  const handleRemoveSelected = () => {
    setSelectedParticipants((prev: any) =>
      prev.filter((participant: any) => !checkedParticipants.includes(participant))
    );
    setCheckedParticipants([]);
  };

  // Updated "Select All" logic
  const handleSelectAll = (event: any) => {
    const isChecked = event.target.checked;
    const filteredIds = filteredParticipants.map((user) => user.uuid);

    if (isChecked) {
      // Combine new filtered participants with the existing ones
      const uniqueParticipants = Array.from(
        new Set([...selectedParticipants, ...filteredIds])
      );
      setSelectedParticipants(uniqueParticipants);
    } else {
      // Remove only the filtered participants
      const remainingParticipants = selectedParticipants.filter(
        (uuid: any) => !filteredIds.includes(uuid)
      );
      setSelectedParticipants(remainingParticipants);
    }

    setSelectAll(isChecked); // Set "Select All" checkbox state
  };

  useEffect(() => {
    const newFilteredParticipants = filterParticipants();
    setFilteredParticipants(newFilteredParticipants);
    setSelectAll(false); // Reset the "Select All" checkbox when search changes
  }, [
    searchTerm,
    startDateTime,
    endDateTime,
    selectedColleges,
    selectedDepartments,
    participants,
    users,
  ]);

  return (
    <Container>
      {!event && (
        <Typography variant="h4" gutterBottom>
          Create New Event
        </Typography>
      )}
      <Grid container spacing={2}>
        <Grid item xs={24} sm={12}>
          <TextField
            fullWidth
            label="Event Name"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            required
            disabled={isResched}
            InputLabelProps={{
              sx: {
                "& .MuiInputLabel-asterisk": {
                  color: "red", // Change the color of the asterisk
                },
              },
            }}
          />

          {/* <TextField
  fullWidth
  label="Event Name"
  value={eventName}
  onChange={(e) => setEventName(e.target.value)}
  required
  disabled={isResched}
  InputLabelProps={{
    classes: {
      asterisk: 'custom-asterisk', // Custom class for asterisk
    },
  }}
/> */}
        </Grid>
        <Grid item xs={24} sm={12}>
          <label htmlFor="description">
            Event Description <span style={{ color: "red" }}>*</span>
          </label>
          <DraftEditor
            eventDescription={eventDescription}
            setEventDescription={setEventDescription}
            readOnly={isResched}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="datetime-local"
            label="Start Date & Time (HH:MM AM/PM)"
            value={startDateTime}
            onChange={(e) => {
              setStartDateTime(e.target.value);
              setShowAdditionalFields(false);
            }}
            InputLabelProps={{
              shrink: true,
              sx: {
                "& .MuiInputLabel-asterisk": {
                  color: "red", // Change the color of the asterisk
                },
              },
            }}
            inputProps={{
              min: getCurrentDateTime(), // Set the minimum date to the current date and time
            }}
            required
            error={!!dateError}
            helperText={
              <>
                <span style={{ color: dateError ? "red" : "inherit" }}>
                  {dateError || ""}
                </span>
                <br />
                <span>
                  If repeated events please put the time at the start of every
                  reappearance which is daily or weekly
                </span>
              </>
            }
            disabled={currentUser.is_staff ? false : isEdit}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="datetime-local"
            label="End Date & Time (HH:MM AM/PM)"
            value={endDateTime}
            onChange={(e) => {
              setEndDateTime(e.target.value);
              setShowAdditionalFields(false);
            }}
            InputLabelProps={{
              shrink: true,
              sx: {
                "& .MuiInputLabel-asterisk": {
                  color: "red", // Change the color of the asterisk
                },
              },
            }}
            inputProps={{
              min: getCurrentDateTime(), // Set the minimum date to the current date and time
            }}
            required
            error={!!dateError}
            helperText={
              <>
                <span style={{ color: dateError ? "red" : "inherit" }}>
                  {dateError || ""}
                </span>
                <br />
                <span>
                  If repeated events please put the time at the end of every
                  reappearance which is daily or weekly
                </span>
              </>
            }
            disabled={currentUser.is_staff ? false : isEdit}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            select
            required
            disabled={currentUser.is_staff ? false : isEdit}
            id="event-category"
            label="Event Category"
            value={category}
            onChange={handleCategoryChanges}
            InputLabelProps={{
              sx: {
                "& .MuiInputLabel-asterisk": {
                  color: "red", // Change the color of the asterisk
                },
              },
            }}
            helperText={
              <>
                <span>
                  If you're an employee and want to make your personal event
                  visible to students, set the category to 'personal' and event
                  type to 'academic.
                </span>
                <br />
                <span></span>
              </>
            }
          >
            {categories
              .filter((cat) => {
                // If user is rank 1, show all
                if (currentUser.is_staff) {
                  return true;
                } else if (
                  currentUser.role?.name.toLowerCase() === student
                ) {
                  return (
                    cat?.eventCategoryName.toLowerCase() === personalCategory
                  );
                }
                return !restrictCategory.includes(
                  cat?.eventCategoryName.toLowerCase()
                );
              })
              .map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category?.eventCategoryName}
                </MenuItem>
              ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            select
            required
            disabled={currentUser.is_staff ? false : isEdit}
            id="event-type"
            label="Event Type"
            value={selectedEventType}
            onChange={(e) => {
              setSelectedEventType(e.target.value);
              setShowAdditionalFields(false);
            }}
            InputLabelProps={{
              sx: {
                "& .MuiInputLabel-asterisk": {
                  color: "red", // Change the color of the asterisk
                },
              },
            }}
          >
            {eventType.map((eventType) => (
              <MenuItem key={eventType.id} value={eventType.id}>
                {eventType.eventTypeName}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {departmentCategory.includes(
          findcategory?.eventCategoryName?.toLowerCase() ?? ''
        ) && (
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Select Departments</InputLabel>
                <Select
                  multiple
                  disabled={currentUser.is_staff ? false : isEdit}
                  value={selectedDepartments}
                  onChange={handleDepartmentChange}
                  renderValue={(selected) => (
                    <div>
                      {selected.map((value: any) => {
                        const department = departments.find(
                          (dep) => dep.id === value
                        );
                        return department ? (
                          <Chip key={value} label={department.name} />
                        ) : null;
                      })}
                    </div>
                  )}
                >
                  {/* Add MenuItem for All CITC Department but don't show it in the selected items */}
                  <MenuItem value="CITC" key="CITC">
                    All CITC Department
                  </MenuItem>

                  {/* Render other departments, excluding those starting with 'All' */}
                  {departments.map(
                    (department) =>
                      !department.name.startsWith("All") && ( // Exclude departments starting with "All"
                        <MenuItem key={department.id} value={department.id}>
                          {department.name}
                        </MenuItem>
                      )
                  )}
                </Select>
              </FormControl>
            </Grid>
          )}
        {currentUser.role?.name.toLowerCase() !== student && (
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  disabled={isResched}
                  checked={isAnnouncement}
                  onChange={(e) => {
                    setIsAnnouncement(e.target.checked);
                    setShowAdditionalFields(true);
                    if (!e.target.checked) {
                      setShowAdditionalFields(false); // Clear the venue if in-person is unchecked
                    }
                  }}
                  color="primary"
                />
              }
              label="Announcement"
            />

            <Tooltip
              title={
                <Typography sx={{ fontSize: "16px" }}>
                  Check this box to mark the event as an announcement(example
                  wearing of ID, No Class and such others). Note that this will
                  not be visible to events calendar rather in announcement
                  sidebaror tab
                </Typography>
              }
            >
              <InfoIcon fontSize="small" />
            </Tooltip>
          </Grid>
        )}

        {!showAdditionalFields && (
          <Grid item xs={12}>
            <CustomButton onClick={handleProceed} startIcon="">Proceed</CustomButton>
            {(isEdit || isResched) && (
              <CustomDeleteButton
                onClick={() => {
                  setEditing(false);
                  setResched(false);
                }}
              >
                Back
              </CustomDeleteButton>
            )}
          </Grid>
        )}

        {/* Conflict Modal */}
        <Dialog open={openModal} onClose={handleCloseModal}>
          <DialogTitle>Conflicting Events</DialogTitle>
          <DialogContent>
            <DialogContentText>
              The following events conflict with your selected time:
            </DialogContentText>
            <Typography sx={{ mb: 2 }}>
              <Brightness1Icon sx={{ color: "#7CC0CF" }} /> Acceptable to
              Proceed <Brightness1Icon sx={{ color: "#DB6565" }} /> Not
              Acceptable to Proceed
            </Typography>

            {/* Proceedable Events */}
            {conflictingEvent.proceedable.length > 0 && (
              <div>
                <ul>
                  {conflictingEvent.proceedable.map((event: any, index: number) => {
                    const eventCreatorRank = event.created_by?.rank;
                    const currentUserRank = currentUser.roles.rank;

                    return (
                      <li key={index} className="mb-2">
                        <Alert color="info">
                          <Typography sx={{ color: "darkblue" }}>
                            " {event.event} "
                          </Typography>
                          <Typography
                            className="my-5"
                            sx={{ color: "darkblue" }}
                          >
                            <PlaceIcon /> {event.venueName || "TBA"}
                          </Typography>
                          <Typography sx={{ color: "black" }}>
                            <DateRangeIcon />{" "}
                            {new Date(event.start).toLocaleString()} -{" "}
                            <DateRangeIcon />{" "}
                            {new Date(event.end).toLocaleString()}
                          </Typography>
                          {currentUserRank <= eventCreatorRank && (
                            <FormControlLabel
                              control={
                                <Checkbox
                                  onChange={(e) =>
                                    handleCheckboxChange(
                                      event?.id,
                                      e.target.checked
                                    )
                                  }
                                  name={`override-${event?.id}`}
                                />
                              }
                              label="Override"
                            />
                          )}
                        </Alert>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Non-Proceedable Events */}
            {conflictingEvent.nonProceedable.length > 0 && (
              <div>
                <ul>
                  {conflictingEvent.nonProceedable.map((event: any, index: any) => (
                    <li key={index} className="mb-2">
                      <Alert color="failure">
                        <Typography sx={{ color: colors.darkblue }}>
                          " {event.event} "
                        </Typography>
                        <Typography
                          className="my-5"
                          sx={{ color: colors.darkblue }}
                        >
                          <PlaceIcon /> {event.venueName || "TBA"}
                        </Typography>
                        <Typography sx={{ color: colors.darkblue }}>
                          <DateRangeIcon />{" "}
                          {new Date(event.start).toLocaleString()} -{" "}
                          <DateRangeIcon />{" "}
                          {new Date(event.end).toLocaleString()}
                        </Typography>
                      </Alert>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* In-Person Checkbox and Venue Dropdown */}
            <Typography sx={{ mt: 2 }}>Setup and Venue</Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isInPerson}
                  onChange={(e) => {
                    const setupfind = setups.find(
                      (set) => set.setupName === inperson
                    );

                    // Set `isInPerson` to the checkbox state
                    setIsInPerson(e.target.checked);

                    // If `isInPerson` is false, clear the venue
                    if (!e.target.checked) {
                      setVenue(event?.venue?.id || ""); // Clear the venue if in-person is unchecked
                    }

                    // Set the setup value based on the selected in-person status
                    if (setupfind) {
                      setSetup(setupfind.id);
                    }
                  }}
                />
              }
              label="In-Person"
            />
            {isInPerson && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Venue"
                  value={venue || ""}
                  onChange={(e) => {
                    setVenue(e.target.value);
                  }}
                >
                  {venues.map((venue) => {
                    return (
                      <MenuItem key={venue.id} value={venue.id}>
                        {venue.venueName}
                      </MenuItem>
                    );
                  })}
                </TextField>
              </Grid>
            )}

            {/* Time Slot Picker */}
            <Typography>Please select an available time slot below:</Typography>
            <Box sx={{ display: "flex", flexDirection: "row", gap: 10, mt: 2 }}>
              <Typography>Start Date/Time - End Date/Time</Typography>
              <Typography>Possible Participants</Typography>
            </Box>
            <TimeSlotPicker
              startDateTime={startDateTime}
              endDateTime={endDateTime}
              unavailableSlotsPersonal={unavailableSlotsPersonal}
              unavailableSlotsNonPersonal={unavailableSlotsNonPersonal}
              handleTimeSelect={handleTimeSelect}
              findcategory={findcategory}
              participantsData={participants}
              selectedVenue={venue} // Pass the selected venue
            />
          </DialogContent>
          <DialogActions>
            {conflictingEvent.nonProceedable.length === 0 && conflictingEvent.proceedable.length > 0 && (
              <Button
                onClick={handleProceedAnyway}
                sx={{ color: colors.yellow }}
              >
                Proceed Anyway
              </Button>
            )}
            {showContinueButton && (
              <Button onClick={handleContinue} sx={{ color: "green" }}>
                Continue
              </Button>
            )}
            <Button onClick={handleCloseModal} sx={{ color: colors.red }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {showAdditionalFields && (
          <>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                disabled={isResched}
                label="Setup"
                value={setup || ""}
                onChange={(e) => {
                  setSetup(e.target.value);
                  setMeetingLink("");
                  setVenue("");
                }}
                helperText={
                  <>
                    {findcategory?.eventCategoryName === personalCat && (
                      <span>Optional</span>
                    )}
                  </>
                }
              >
                <MenuItem value="">None</MenuItem>
                {setups.map((setup) => (
                  <MenuItem key={setup.id} value={setup.id}>
                    {setup.setupName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            {findsetup?.setupName === bothSetup ||
              findsetup?.setupName === ftf ? (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  disabled={isResched}
                  label="Venue"
                  value={venue || ""}
                  onChange={(e) => {
                    setVenue(e.target.value);
                    // setShowAdditionalFields(false);
                  }}
                  helperText={
                    <>
                      {findcategory?.eventCategoryName === personalCat && (
                        <span>Optional</span>
                      )}
                    </>
                  }
                >
                  <MenuItem value="">None</MenuItem>
                  {venues.map((venue) => {
                    const isVenueConflicted = conflictingEvent.proceedable.some(
                      (event: any) => event.venueName === venue.venueName
                    );

                    return (
                      <MenuItem
                        key={venue.id}
                        value={venue.id}
                        disabled={isVenueConflicted}
                      >
                        {venue.venueName}
                      </MenuItem>
                    );
                  })}
                </TextField>
              </Grid>
            ) : (
              <></>
            )}

            {findsetup?.setupName === bothSetup ||
              findsetup?.setupName === online ? (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  disabled={isResched}
                  label="Meeting Link"
                  value={meetingLink || ""}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  helperText={
                    <>
                      <span>Optional</span>
                    </>
                  }
                />
              </Grid>
            ) : (
              <></>
            )}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    disabled={isResched}
                    checked={isRecurring}
                    onChange={(e) => handleIsRecurring(e)}
                    color="primary"
                  />
                }
                label="Recurring Events"
              />
              <Tooltip
                title={
                  <Typography sx={{ fontSize: "16px" }}>
                    Repeated Events
                  </Typography>
                }
              >
                <InfoIcon fontSize="small" />
              </Tooltip>
            </Grid>

            {isRecurring && (
              <>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Recurrence Type</InputLabel>
                    <Select
                      disabled={isResched}
                      value={recurrenceType}
                      onChange={handleRecurrenceTypeChange}
                      label="Recurrence Type"
                    >
                      <MenuItem value="none">None</MenuItem>
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                    </Select>
                    <FormHelperText>
                      Select recurrence type for the event
                    </FormHelperText>
                  </FormControl>
                </Grid>
                {recurrenceType === "weekly" && (
                  <Grid item xs={12}>
                    <Typography variant="h6">Weekly Recurrence Days</Typography>
                    <FormGroup row>
                      {Object.keys(recurrenceDays).map((day) => (
                        <FormControlLabel
                          key={day}
                          control={
                            <Checkbox
                              disabled={isResched}
                              checked={recurrenceDays[day]}
                              onChange={handleRecurrenceDayChange}
                              name={day}
                            />
                          }
                          label={day.charAt(0).toUpperCase() + day.slice(1)}
                        />
                      ))}
                    </FormGroup>
                  </Grid>
                )}
              </>
            )}
            {findcategory?.eventCategoryName !== personalCat && (
              <Grid item xs={12} sm={6}>
                <Box id="documents-upload" className="max-w-md flex flex-col">
                  <Box className="mb-2 block self-center">
                    <Label
                      htmlFor="approve-documents-upload"
                      value={`Upload Approved ${documents}`}
                    />
                  </Box>
                  <FileInput
                    id="approve-documents-upload" // Make sure this ID is unique within the form
                    // type="file"
                    disabled={
                      (currentUser.is_staff ? false : isEdit) &&
                      (!event ? false : !personal)
                    }
                    accept="application/pdf"
                    onChange={(e) => setApproveDocuments(e.target.files ? e.target.files[0] : null)}
                  />
                </Box>
                {event?.approveDocuments && !approveDocuments && (
                  <Typography variant="body1" sx={{ mb: 2, mt: 2 }}>
                    Preview:{" "}
                    <a
                      href={event?.approveDocuments}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        textDecoration: "none",
                        color: colors.darkblue,
                      }}
                    >
                      Event Document PDF Here
                    </a>
                  </Typography>
                )}
              </Grid>
            )}
            {findcategory?.eventCategoryName !== personalCat && (
              <Grid item xs={12} sm={6}>
                <Box id="image-upload" className="max-w-md flex flex-col">
                  <Box className="mb-2 block self-center">
                    <Label htmlFor="image-upload" value="Upload Poster" />
                  </Box>
                  <FileInput
                    id="image-upload" // Make sure this ID is unique within the form
                    // type="file"
                    disabled={isResched}
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </Box>
                {event?.images && !images && (
                  <Typography variant="body1" sx={{ mb: 2, mt: 2 }}>
                    Preview:{" "}
                    <a
                      href={event?.images}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        textDecoration: "none",
                        color: colors.darkblue,
                      }}
                    >
                      Event Image Here
                    </a>
                  </Typography>
                )}
              </Grid>
            )}

            {/* Display Selected Colleges */}
            {currentUser.role?.name.toLowerCase() !== student && (
              <Grid item xs={12}>
                <Typography variant="h6">Selected Colleges:</Typography>
                <div>
                  {selectedColleges.map((collegeId) => {
                    const college = colleges.find(
                      (col) => col.id === parseInt(collegeId)
                    );
                    return college ? (
                      <Chip key={college.id} label={college.name} />
                    ) : null;
                  })}
                </div>
              </Grid>
            )}

            {/* Participant Selection */}
            {currentUser.role?.name.toLowerCase() !== student && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  {/* Search Field */}
                  <TextField
                    variant="outlined"
                    placeholder="Search participants"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    fullWidth
                    margin="dense"
                    style={{ marginBottom: "8px" }}
                    helperText={
                      <>
                        <span>
                          Here you can search field such as firstname, lastname,
                          middlename, idNumber, designation, departmentName,
                          email, sectionName or studentOrgName
                        </span>
                      </>
                    }
                  />
                </Grid>

                {/* "Select All" Checkbox */}
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectAll}
                        onChange={handleSelectAll}
                        color="primary"
                      />
                    }
                    label="Select All Filtered Participants"
                  />
                </Grid>

                {/* Filtered Participants List */}
                <Grid item xs={12}>
                  <Box
                    style={{
                      maxHeight: "200px",
                      overflowY: "auto",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      padding: "8px",
                      marginBottom: "16px",
                    }}
                  >
                    {filteredParticipants.length > 0 ? (
                      filteredParticipants.map((user) => (
                        <Typography
                          key={user.uuid}
                          style={{
                            padding: "8px",
                            cursor: "pointer",
                            backgroundColor: selectedParticipants.includes(
                              user.uuid
                            )
                              ? "#f0f0f0"
                              : "white",
                          }}
                          onClick={() => handleAddParticipant(user.uuid)}
                        >
                          {`${user.first_name} ${user.last_name} - ${user.role?.name}`}
                        </Typography>
                      ))
                    ) : (
                      <Typography>No participants found.</Typography>
                    )}
                  </Box>
                </Grid>

                {/* Selected Participants Table */}
                <Grid item xs={12}>
                  <Grid container spacing={2} style={{ marginTop: "16px" }}>
                    {/* Left Section */}
                    <Grid item xs={12} md={6}>
                      <TableContainer
                        component={Paper}
                        style={{ maxHeight: "300px", overflowY: "auto" }}
                      >
                        <Table stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell padding="checkbox">
                                <Tooltip title="Select All">
                                  <Checkbox
                                    indeterminate={
                                      checkedParticipants.length > 0 &&
                                      checkedParticipants.length <
                                      selectedParticipants.length
                                    }
                                    checked={
                                      selectedParticipants.length > 0 &&
                                      checkedParticipants.length ===
                                      selectedParticipants.length
                                    }
                                    onChange={handleSelectAllparticipants}
                                  />
                                </Tooltip>
                              </TableCell>
                              <TableCell>Name</TableCell>
                              <TableCell>Role</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedParticipants
                              .slice(
                                0,
                                Math.ceil(selectedParticipants.length / 2)
                              ) // Split into two sections
                              .map((uuid: any, index: any) => {
                                const user = users.find((u) => u.uuid === uuid);
                                return user ? (
                                  <TableRow
                                    key={uuid}
                                    sx={{
                                      backgroundColor:
                                        index % 2 === 0 ? "white" : "#f7f7f7",
                                      height: "40px", // Reduced row height
                                    }}
                                  >
                                    <TableCell padding="checkbox">
                                      <Checkbox
                                        checked={checkedParticipants.includes(
                                          uuid
                                        )}
                                        onChange={() =>
                                          handleToggleCheckbox(uuid)
                                        }
                                      />
                                    </TableCell>
                                    <TableCell
                                      sx={{ padding: "4px 8px" }} // Compact cell padding
                                    >
                                      {`${user.first_name} ${user.last_name}`}
                                    </TableCell>
                                    <TableCell
                                      sx={{ padding: "4px 8px" }} // Compact cell padding
                                    >
                                      {user.role?.name}
                                    </TableCell>
                                  </TableRow>
                                ) : null;
                              })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Grid>

                    {/* Right Section */}
                    <Grid item xs={12} md={6}>
                      <TableContainer
                        component={Paper}
                        style={{ maxHeight: "300px", overflowY: "auto" }}
                      >
                        <Table stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell padding="checkbox">
                                <Tooltip title="Select All">
                                  <Checkbox
                                    indeterminate={
                                      checkedParticipants.length > 0 &&
                                      checkedParticipants.length <
                                      selectedParticipants.length
                                    }
                                    checked={
                                      selectedParticipants.length > 0 &&
                                      checkedParticipants.length ===
                                      selectedParticipants.length
                                    }
                                    onChange={handleSelectAllparticipants}
                                  />
                                </Tooltip>
                              </TableCell>
                              <TableCell>Name</TableCell>
                              <TableCell>Role</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedParticipants
                              .slice(Math.ceil(selectedParticipants.length / 2)) // Second section
                              .map((uuid: any, index: any) => {
                                const user = users.find((u) => u.uuid === uuid); // Use uuid to find user
                                return user ? (
                                  <TableRow
                                    key={uuid}
                                    sx={{
                                      backgroundColor: index % 2 === 0 ? "white" : "#f7f7f7",
                                      height: "40px", // Reduced row height
                                    }}
                                  >
                                    <TableCell padding="checkbox">
                                      <Checkbox
                                        checked={checkedParticipants.includes(uuid)} // Use uuid for checking
                                        onChange={() => handleToggleCheckbox(uuid)} // Toggle based on uuid
                                      />
                                    </TableCell>
                                    <TableCell sx={{ padding: "4px 8px" }}>
                                      {`${user.first_name} ${user.last_name}`}
                                    </TableCell>
                                    <TableCell sx={{ padding: "4px 8px" }}>
                                      {user.role?.name}
                                    </TableCell>
                                  </TableRow>
                                ) : null;
                              })}
                          </TableBody>

                        </Table>
                      </TableContainer>
                    </Grid>
                  </Grid>
                  {/* General Remove Button */}
                  {checkedParticipants.length > 0 && (
                    <CustomButton onClick={handleRemoveSelected} startIcon={""}>
                      Remove Selected
                    </CustomButton>
                  )}
                </Grid>
              </Grid>
            )}

            {event ? (
              <Grid item xs={12}>
                <CustomButton
                  onClick={(e: any) => handleSubmit(e)}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? "Saving..." : "Save Event"}
                </CustomButton>
                {(isEdit || isResched) && (
                  <CustomDeleteButton
                    onClick={() => {
                      setEditing(false);
                      setResched(false);
                    }}
                  >
                    Back
                  </CustomDeleteButton>
                )}
              </Grid>
            ) : (
              <Grid item xs={12}>
                <CustomButton
                  onClick={handleSubmit}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? "Creating..." : "Create Event"}
                </CustomButton>
              </Grid>
            )}
          </>
        )}
      </Grid>
      <ToastContainer />
    </Container>
  );
};

export default EditEvent;
