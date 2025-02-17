import React, { useState, useEffect, useRef } from "react";
import http from "../../../../../../../http";
import colors from "../colors";
import CardMedia from "@mui/material/CardMedia";
import {
  Box,
  Typography,
  Divider,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import Cookies from "js-cookie";
import CustomDeleteButton from "../customdeletebutton";
import CustomButton from "../button";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import logo from "../../images/logo.png";
import {
  Editor,
  EditorState,
  convertFromRaw,
  convertToRaw,
  ContentState,
} from "draft-js";
import { DeleteConfirmModal } from "../DeleteConfirmModal";
import { useParams } from "react-router-dom";
import EditEvent from "./editevent";
import { DateTime } from "luxon";

//status
const cancelled = "cancelled";
const postponed = "postponed";
const draft = "draft";
const ongoing = "ongoing";
const done = "done";
const upcoming = "upcoming";
const disapprove = "disapproved";

// event category
const personalCat = "personal";

//designation
const dean = "Dean";
const chairperson = "Chairperson";
const motherOrg = "Mother Org";
const unitOrg = "Unit Org";
const faculty = "Faculty";

interface Postpone {
  id: number;
}

interface EventDetailsProps {
  event: any;
  admin: boolean | string;
  currentUser: any;
}

interface Event {
  id: number;
  eventName: string;
  eventDescription: string;
  startDateTime: string;
  endDateTime: string;
  venue: {
    id: number;
    venueName: string;
  };
  eventCategory: {
    id: number;
    eventCategoryName: string;
  };
  status: {
    id: number;
    statusName: string;
  };
  setup: {
    id: number;
    setupName: string;
  };
  meetinglink: string;
  recurrence_type: string;
  recurrence_days: string[];
  eventType: {
    id: number;
    eventTypeName: string;
  };
  isAprrovedByDean: boolean;
  isAprrovedByChairman: boolean;
  created_by: {
    role: {
      designation: string;
    };
    department: number;
  };
  department: any;
}

interface Cancel{
  id: number;
}

interface Status {
  id: number;
  statusName: string;
}

interface Remark{
  id: number;
  events: Event[];
  find: (remark: any) => any; // nah ambot lagi ani
}

interface AuditLog {
  object_id: number;
  action: string;
  timestamp: string;
  // Add other properties if necessary
} 

export default function EventDetails({ event, admin, currentUser }:EventDetailsProps) {
  const { id } = useParams();
  const [editing, setEditing] = useState(false);
  const [resched, setResched] = useState(false);
  const [formData, setFormData] = useState({
    id: 0,
    eventName: '',
    eventDescription: '',
    startDateTime: '',
    endDateTime: '',
    venue: {
      id: 0,
      venueName: '',
    },
    eventCategory: {
      id: 0,
      eventCategoryName: '',
    },
    status: {
      id: 0,
      statusName: '',
    },
    setup: {
      id: 0,
      setupName: '',
    },
    meetinglink: '',
    recurrence_type: '',
    recurrence_days: [],
    eventType: {
      id: 0,
      eventTypeName: '',
    },
    isAprrovedByDean: false,
    isAprrovedByChairman: false,
    created_by: {
      role: {
        designation: '',
      },
      department: 0,
    },
    department: [],
    approveDocuments: '',
  });
  const [statuses, setStatuses] = useState<Status[]>([]);
  const token = Cookies.get("auth_token");
  const [isDisabled, setIsDisabled] = useState(false);
  const [remark, setRemark] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [openModal2, setOpenModal2] = useState(false);
  const [cancel, setCancel] = useState<Cancel | null>(null);
  const [postpone, setPostpone] = useState<Postpone | null>(null);
  const [remarks, setRemarks] = useState<Remark | null>(null);
  const [eventDescription, setEventDescription] = useState(
    event.eventDescription
  );
  const [isAprrovedByDean, setIsAprrovedByDean] = useState(false);
  const [isAprrovedByChairman, setIsAprrovedByChairman] = useState(false);
  const [auditLog, setAuditLog] = useState<AuditLog[]>([]);
  const [auditLogAll, setAuditLogAll] = useState<AuditLog[]>([]);

  let editorState = EditorState.createEmpty();

  if (eventDescription) {
    try {
      const contentState = convertFromRaw(JSON.parse(eventDescription));
      editorState = EditorState.createWithContent(contentState);
    } catch (error) {
      console.warn("Error parsing event description as JSON:", error);
      const contentState = ContentState.createFromText(eventDescription);
      editorState = EditorState.createWithContent(contentState);
    }
  }

  useEffect(() => {
    // Scroll to the top of the page on initial load
    window.scrollTo(0, 0);
  }, []); // Empty dependency array ensures this runs only on mount

  const previousEditingRef = useRef(editing);
  useEffect(() => {
    http
      .get("status/", { headers: { Authorization: `Token ${token}` } })
      .then((response) => setStatuses(response.data))
      .catch((error) => console.error("Error fetching status:", error));

    http
      .get("eventremark/")
      .then((response) => setRemarks(response.data))
      .catch((error) => console.error("Error fetching status:", error));

    http
      .get("auditlogdatechange/", {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => setAuditLog(response.data))
      .catch((error) => console.error("Error fetching status:", error));
    http
      .get("auditlogeventchange/", {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => setAuditLogAll(response.data))
      .catch((error) => console.error("Error fetching status:", error));

    setFormData({
      ...event,
      venue: event.venue?.id || null,
      eventCategory: event.eventCategory?.id || null,
      status: event.status?.id || null,
      setup: event.setup?.id || null,
      startDateTime: new Date(event.startDateTime).toISOString().slice(0, 16),
      endDateTime: new Date(event.endDateTime).toISOString().slice(0, 16),
    });

    // Check if editing changed from false to true
    if (previousEditingRef.current === false && editing === true) {
      setFormData({
        ...event,
        venue: event.venue?.id || null,
        eventCategory: event.eventCategory?.id || null,
        status: event.status?.id || null,
        setup: event.setup?.id || null,
        startDateTime: new Date(event.startDateTime).toISOString().slice(0, 16),
        endDateTime: new Date(event.endDateTime).toISOString().slice(0, 16),
      });
    }

    // Update the previous value of editing
    previousEditingRef.current = editing;
  }, [editing, event]);

  const getFormattedLink = (link: string) => {
    if (link && !link.startsWith("http://") && !link.startsWith("https://")) {
      return `https://${link}`;
    }
    return link;
  };

  const handleApproval = async () => {
    try {
      // Determine the approval field based on the current user's role
      const approvalField =
        currentUser?.role?.designation === dean
          ? { isAprrovedByDean: true }
          : { isAprrovedByChairman: true };

      // Update the approval field in the backend
      await http.patch(`events/${id}/`, approvalField, {
        headers: { Authorization: `Token ${token}` },
      });

      // Fetch the updated event data
      const response = await http.get(`events/${id}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const updatedEvent = response.data;

      const start = DateTime.fromISO(updatedEvent.startDateTime);
      const end = DateTime.fromISO(updatedEvent.endDateTime);
      const now = DateTime.now();

      // Update the local state with the latest approval status
      setIsAprrovedByDean(updatedEvent.isAprrovedByDean);
      setIsAprrovedByChairman(updatedEvent.isAprrovedByChairman);

      let status: string | undefined;

      // Determine status based on role and approvals
      const { designation } = updatedEvent.created_by.role;

      if (
        designation === unitOrg &&
        !updatedEvent.isAprrovedByDean &&
        updatedEvent.isAprrovedByChairman
      ) {
        toast.success(`Successfully approved but it need to be approved by dean to be visible to the calendar!`, {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      } else if (
        designation === unitOrg &&
        updatedEvent.isAprrovedByDean &&
        !updatedEvent.isAprrovedByChairman
      ) {
        toast.success(`Successfully approved but it need to be approved by Chairperson to be visible to the calendar!`, {
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

      // Approval logic for "Mother Org"
      if (designation === motherOrg && updatedEvent.isAprrovedByDean) {
        status = now < start ? "upcoming" : now <= end ? "ongoing" : "done";
      }

      // Approval logic for "Unit Org" (requires both Dean and Chairperson)
      else if (
        designation === unitOrg &&
        updatedEvent.isAprrovedByDean &&
        updatedEvent.isAprrovedByChairman
      ) {
        status = now < start ? "upcoming" : now <= end ? "ongoing" : "done";
      }

      // Approval logic for "Faculty" (requires only Chairperson)
      else if (designation === faculty && updatedEvent.isAprrovedByChairman) {
        status = now < start ? "upcoming" : now <= end ? "ongoing" : "done";
      }

      // If status was determined, update the event status
      if (status) {
        const findStatus = statuses.find((stat) => stat.statusName === status);
        if (findStatus?.id) {
          await http.patch(
            `events/${id}/`,
            { status: findStatus.id },
            {
              headers: { Authorization: `Token ${token}` },
            }
          );
        }
      }
    } catch (error: any) {
      console.error("Error updating approval status:", error.message);
    }
  };

  const showApproveButton = (() => {
    // Ensure the event is in "draft" status
    if (event?.status?.statusName !== draft) {
      return false;
    }
    // Check if the user is a Dean
    if (currentUser?.role?.designation === "Dean") {
      return (
        event?.created_by?.role?.designation === "Mother Org" ||
        event?.created_by?.role?.designation === "Unit Org"
      );
    }

    // Check if the user is a Chairperson with the same department
    if (
      currentUser?.role?.designation === "Chairperson" &&
      currentUser?.department?.id === event?.created_by?.department
    ) {
      return (
        event?.created_by?.role?.designation === "Unit Org" ||
        event?.created_by?.role?.designation === "Faculty"
      );
    }

    return false; // Default to false if none of the conditions match
  })();

  const handleCancelevent = async () => {
    try {
      if (cancel && remark) {
        // Add event remark
        await http.post(
          `eventremark/`,
          {
            events: cancel.id,
            remark: remark, // Use the remark state here
          },
          {
            headers: { Authorization: `Token ${token}` },
          }
        );

        // Find the status id for "cancelled"
        const findstatus = statuses?.find(
          (stat) => stat.statusName === cancelled
        ); // Ensure "cancelled" is in quotes
        if (findstatus?.id) {
          // Proceed only if `findstatus` is found
          // Update event status
          await http.patch(
            `events/${cancel.id}/`,
            {
              status: findstatus.id,
            },
            {
              headers: { Authorization: `Token ${token}` },
            }
          );
        } else {
          // Handle if `cancelled` status is not found
          throw new Error("Status 'cancelled' not found.");
        }

        // Show success toast and close modal
        toast.success("Event Cancelled Successfully", {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        setOpenModal(false); // Close modal after successful deletion
        setTimeout(() => {
          window.location.reload();
        }, 3000); // 5000 milliseconds = 5 seconds
      }
    } catch (error: any) {
      // Handle errors from validation or unexpected responses
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        const errorMessage = Object.keys(errorData)
          .map((key) => `${key}: ${errorData[key]}`)
          .join(" | "); // Concatenate multiple errors

        toast.error(`${errorMessage}`, {
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
        toast.error(`${error}`, {
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
    }
  };

  const handleOpenCancelModal = (id: number) => {
    setCancel({ id }); // Set the event ID to cancel
    setRemark(""); // Reset remark each time the modal opens
    setOpenModal(true); // Open the modal
  };

  const handlePostponed = async () => {
    try {
      if (postpone) {
        // Find the status id for "postponed"
        const findstatus = statuses?.find(
          (stat) => stat.statusName === postponed
        ); // Ensure "postponed" is in quotes

        if (findstatus?.id) {
          // Proceed only if `findstatus` is found
          // Update event status
          await http.patch(
            `events/${postpone.id}/`,
            {
              status: findstatus.id,
            },
            {
              headers: { Authorization: `Token ${token}` },
            }
          );
        } else {
          // Handle if `postponed` status is not found
          throw new Error("Status 'postponed' not found.");
        }

        // Show success toast and close modal
        toast.success("Event Postponed Successfully", {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        setOpenModal2(false); // Close modal after successful postpone
        setTimeout(() => {
          window.location.reload();
        }, 3000); // 5000 milliseconds = 5 seconds
      }
    } catch (error: any) {
      // Handle errors from validation or unexpected responses
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        const errorMessage = Object.keys(errorData)
          .map((key) => `${key}: ${errorData[key]}`)
          .join(" | "); // Concatenate multiple errors

        toast.error(`${errorMessage}`, {
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
        toast.error(`${error}`, {
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
    }
  };

  const handleOpenPostponedModal = (id: number) => {
    setPostpone({ id }); // Set the event ID to cancel
    setOpenModal2(true); // Open the modal
  };

  //filter the remarks
  const findRemark = remarks?.find((remark: any) => remark.events?.id === event?.id);
  const postponedStatus = event?.status?.statusName === postponed;
  const disapprovedStatus = event?.status?.statusName === disapprove;
  const cancelledStatus = event?.status?.statusName === cancelled;
  const draftStatus = event?.status?.statusName === draft;
  const userOrAdmin = event.created_by?.id === currentUser?.id || admin;
  const doneStatus = event?.status?.statusName === done;

  const timeAgo = (timestamp: any) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInMs = now.getTime() - past.getTime(); // Difference in milliseconds

    const diffInSecs = Math.floor(diffInMs / 1000); // seconds
    const diffInMins = Math.floor(diffInSecs / 60); // minutes
    const diffInHours = Math.floor(diffInMins / 60); // hours
    const diffInDays = Math.floor(diffInHours / 24); // days
    const diffInYears = Math.floor(diffInDays / 365); // years

    if (diffInYears >= 1) return ''; // If the difference is a year or more, no indicator
    if (diffInDays >= 1) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    if (diffInHours >= 1) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInMins >= 1) return `${diffInMins} minute${diffInMins > 1 ? 's' : ''} ago`;
    return `${diffInSecs} second${diffInSecs > 1 ? 's' : ''} ago`;
  };

  const eventLog = auditLogAll.find(log => log.object_id === event?.id);
  const eventLog2 = auditLog.find(log => log.object_id === event?.id);

  return (
    <Box
      sx={{
        width: "100%",
        mx: "auto",
        p: 3,
        borderRadius: 2,
        boxShadow: 3,
        border: `2px solid ${colors.yellow}`,
      }}
      className="grid grid-cols-1 xl:grid-cols-2"
    >
      <Box className="order-last">
        <ToastContainer />
        {editing || resched ? (
          <EditEvent
            event={event}
            eventID={event?.id}
            isEdit={editing}
            setEditing={setEditing}
            isResched={resched}
            setResched={setResched}
            currentUser={currentUser}
          />
        ) : (
          <Box>
            {event.isAnnouncement && (
              <Typography variant="h4" sx={{ color: colors.darkblue, mb: 3 }}>
                Announcement
              </Typography>
            )}
            <Typography variant="h4" sx={{ color: colors.darkblue, mb: 3 }}>
              {formData.eventName || event.eventName}
            </Typography>
            {formData.recurrence_type !== "none" ||
              event.recurrence_type !== "none" ? (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="h6" color={colors.darkblue}>
                    Start Date:
                  </Typography>
                  <Typography variant="body1">
                    {new Intl.DateTimeFormat("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }).format(
                      new Date(
                        event.startDateTime
                          ? event.startDateTime
                          : formData.startDateTime
                      )
                    )}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="h6" color={colors.darkblue}>
                    End Date:
                  </Typography>
                  <Typography variant="body1">
                    {new Intl.DateTimeFormat("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }).format(
                      new Date(
                        event.endDateTime
                          ? event.endDateTime
                          : formData.endDateTime
                      )
                    )}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="h6" color={colors.darkblue}>
                    Day:
                  </Typography>
                  {formData.recurrence_type === "daily" ||
                    event.recurrence_type === "daily" ? (
                    <Typography variant="body1">
                      {formData.recurrence_type || event.recurrence_type}
                    </Typography>
                  ) : (
                    <Box>
                      {formData.recurrence_days &&
                        formData.recurrence_days.length > 0 ? (
                        formData.recurrence_days.map((days, index) => (
                          <Typography
                            variant="body1"
                            key={`formData-day-${index}`}
                          >
                            {days}
                          </Typography>
                        ))
                      ) : event.recurrence_days &&
                        event.recurrence_days.length > 0 ? (
                        event.recurrence_days.map((days: any, index: any) => (
                          <Typography
                            variant="body1"
                            key={`event-day-${index}`}
                          >
                            {days}
                          </Typography>
                        ))
                      ) : (
                        <Typography variant="body1">
                          No recurrence days available
                        </Typography>
                      )}
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="h6" color={colors.darkblue}>
                    Time:
                  </Typography>
                  <Typography variant="body1">
                    {new Intl.DateTimeFormat("en-US", {
                      hour: "numeric",
                      minute: "numeric",
                    }).format(
                      new Date(
                        event.startDateTime
                          ? event.startDateTime
                          : formData.startDateTime
                      )
                    )}{" "}
                    -{" "}
                    {new Intl.DateTimeFormat("en-US", {
                      hour: "numeric",
                      minute: "numeric",
                    }).format(
                      new Date(
                        event.endDateTime
                          ? event.endDateTime
                          : formData.endDateTime
                      )
                    )}
                  </Typography>
                </Grid>
              </Grid>
            ) : (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="h6" color={colors.darkblue}>
                    Start Date:
                  </Typography>
                  <Typography variant="body1">
                    {new Intl.DateTimeFormat("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                    }).format(
                      new Date(
                        event.startDateTime
                          ? event.startDateTime
                          : formData.startDateTime
                      )
                    )}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="h6" color={colors.darkblue}>
                    End Date:
                  </Typography>
                  <Typography variant="body1">
                    {new Intl.DateTimeFormat("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                    }).format(
                      new Date(
                        event.endDateTime
                          ? event.endDateTime
                          : formData.endDateTime
                      )
                    )}
                  </Typography>
                </Grid>
              </Grid>
            )}
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" color={colors.darkblue} sx={{ mb: 1 }}>
              Description:
            </Typography>
            {editorState.getCurrentContent().hasText() ? (
              <Editor
                editorState={editorState}
                readOnly={true}
                placeholder="No description provided."
                // onChange={(editorState) => setEventDescription(editorState)}
                onChange={() => {}} // Disable editing
              />
            ) : (
              <p>{event.eventDescription}</p>
            )}
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" color={colors.darkblue} sx={{ mb: 1 }}>
                  Category:
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {formData.eventCategory?.eventCategoryName ||
                    event.eventCategory?.eventCategoryName}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" color={colors.darkblue} sx={{ mb: 1 }}>
                  Event Type:
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {formData.eventType?.eventTypeName ||
                    event?.eventType?.eventTypeName}
                </Typography>
              </Grid>
              {event.setup && (
                <Grid item xs={12} sm={6}>
                  <Typography
                    variant="h6"
                    color={colors.darkblue}
                    sx={{ mb: 1 }}
                  >
                    Setup:
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {formData.setup?.setupName || event.setup?.setupName}
                  </Typography>
                </Grid>
              )}
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                {event.venue?.venueName ? (
                  <Box>
                    <Typography
                      variant="h6"
                      color={colors.darkblue}
                      sx={{ mb: 1 }}
                    >
                      Venue:
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {formData.venue?.venueName || event.venue?.venueName}
                    </Typography>
                  </Box>
                ) : (
                  <Box></Box>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                {event?.meetinglink ? (
                  <Box>
                    <Typography
                      variant="h6"
                      color={colors.darkblue}
                      sx={{ mb: 1 }}
                    >
                      Meeting Link:
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      <a
                        href={getFormattedLink(
                          formData.meetinglink || event.meetinglink
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          textDecoration: "none",
                          color: colors.darkblue,
                        }}
                      >
                        Click Here to Proceed with the Link
                      </a>
                    </Typography>
                  </Box>
                ) : (
                  <Box></Box>
                )}
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" color={colors.darkblue} sx={{ mb: 1 }}>
                  Status:
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {formData.status?.statusName || event.status?.statusName}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" color={colors.darkblue} sx={{ mb: 1 }}>
                  Department:
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {formData.department
                    ?.map((d: any) => `${d.departmentName}`)
                    .join(", ") ||
                    "No Department selected." ||
                    event.department
                      ?.map((d: any) => `${d.departmentName}`)
                      .join(", ") ||
                    "No Department selected."}
                </Typography>
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              {event.participants.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Participants:
                  </Typography>
                  <TableContainer
                    component={Paper}
                    sx={{
                      maxHeight: 250, // Set the fixed height for the table
                      overflow: "auto", // Enable scroll if content exceeds height
                    }}
                  >
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell
                            sx={{
                              py: 0.5, // Adjust padding for smaller height
                              fontWeight: "bold", // Optional: Emphasize header
                            }}
                          >
                            Role
                          </TableCell>
                          <TableCell
                            sx={{
                              py: 0.5, // Adjust padding for smaller height
                              fontWeight: "bold", // Optional: Emphasize header
                            }}
                          >
                            Count
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(
                          event.participants.reduce((acc: any, participant: any) => {
                            const role = participant.role.designation;
                            acc[role] = (acc[role] || 0) + 1;
                            return acc;
                          }, {})
                        ).map(([role, count]) => (
                          <TableRow key={role}>
                            <TableCell
                              sx={{
                                py: 0.5, // Adjust padding for smaller height
                              }}
                            >
                              {role}
                            </TableCell>
                            <TableCell
                              sx={{
                                py: 0.5, // Adjust padding for smaller height
                              }}
                            >
                              {count as number}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              )}

              <Grid item xs={12} sm={6}>
                {event?.approveDocuments ? (
                  <Box>
                    <Typography
                      variant="h6"
                      color={colors.darkblue}
                      sx={{ mb: 1 }}
                    >
                      Document:
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      <a
                        href={
                          formData.approveDocuments || event?.approveDocuments
                        }
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
                  </Box>
                ) : (
                  <Box></Box>
                )}
              </Grid>
              {eventLog2 && (
                <Grid item xs={12} sm={6}>
                  <Typography
                    variant="body1"
                    sx={{ fontStyle: "italic", mb: 2 }}
                  >
                    *Rescheduled
                  </Typography>
                </Grid>
              )}
              {eventLog && (
                <Grid item xs={12} sm={6}>
                  <Typography
                    variant="body1"
                    sx={{ fontStyle: "italic", mb: 2 }}
                  >
                    *Changes {timeAgo(eventLog.timestamp)} {/* Show the time difference for the specific event */}
                  </Typography>
                </Grid>
              )}
            </Grid>
            <Grid container spacing={2}>
              {findRemark && (
                <Grid item xs={12} sm={6}>
                  <Typography
                    variant="h6"
                    color={colors.darkblue}
                    sx={{ mb: 1 }}
                  >
                    Remark:
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {findRemark.remark || "no remark inputted"}
                  </Typography>
                </Grid>
              )}
            </Grid>

            <Box sx={{ mt: 3 }}>
              {userOrAdmin && !doneStatus && (
                <CustomButton onClick={() => setEditing(true)}>
                  Edit
                </CustomButton>
              )}
              {(postponedStatus || disapprovedStatus) && !admin && (
                <CustomButton onClick={() => setResched(true)}>
                  ReSchedule
                </CustomButton>
              )}
              <CustomButton onClick={() => window.history.back()}>
                Back
              </CustomButton>
              {!postponedStatus &&
                !draftStatus &&
                !cancelledStatus &&
                !doneStatus &&
                userOrAdmin &&
                !findRemark && (
                  <CustomDeleteButton
                    onClick={() => handleOpenPostponedModal(event?.id)}
                    disabled={isDisabled}
                  >
                    Postpone Event
                  </CustomDeleteButton>
                )}
              {!cancelledStatus &&
                !draftStatus &&
                !doneStatus &&
                userOrAdmin &&
                !findRemark && (
                  <CustomDeleteButton
                    // onClick={() => handleOpenCancelModal(event?.id, remark)}
                    onClick={() => handleOpenCancelModal(event?.id)}
                    disabled={isDisabled}
                  >
                    Cancel Event
                  </CustomDeleteButton>
                )}
            </Box>
            <DeleteConfirmModal
              name="event"
              openModal={openModal2}
              setOpenModal={setOpenModal2}
              handleDelete={handlePostponed}
              type="postpone"
              remark=""
              setRemark={() => {}} // Ensure remark and setRemark are passed correctly
            />
            <DeleteConfirmModal
              name="event"
              openModal={openModal}
              setOpenModal={setOpenModal}
              handleDelete={handleCancelevent}
              type="cancel"
              remark={remark} // Ensure remark and setRemark are passed correctly
              setRemark={setRemark}
            />  
          </Box>
        )}
        {showApproveButton && currentUser?.role?.designation === dean && (
          <CustomButton
            color={isAprrovedByDean ? "success" : "primary"}
            onClick={handleApproval}
            disabled={isAprrovedByDean} // Disable if already approved
          >
            {isAprrovedByDean ? "Approved" : "Approve"}
          </CustomButton>
        )}
        {showApproveButton &&
          currentUser?.role?.designation === chairperson && (
            <CustomButton
              color={isAprrovedByChairman ? "success" : "primary"}
              onClick={handleApproval}
              disabled={isAprrovedByChairman} // Disable if already approved
            >
              {isAprrovedByChairman ? "Approved" : "Approve"}
            </CustomButton>
          )}
      </Box>
      <Box className="self-center justify-self-center">
        <CardMedia
          component="img"
          sx={{
            width: 450, // Fixed width
            height: 400, // Fixed height
            marginBottom: 3,
          }}
          className="rounded-lg sm:self-start lg:mr-5 transition-transform duration-300 transform hover:scale-110"
          image={event.images || logo} // Replace with your default image URL or logic
          alt="Event Image"
        />
      </Box>
    </Box>
  );
}
