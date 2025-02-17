import React, { useEffect, useState } from "react";
import http from "../../../../../../../http"
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  Card,
  CardContent,
  CardActions,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Table,
  Paper,
  FormControl,
  InputLabel,
} from "@mui/material";

import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import Cookies from "js-cookie";
import { DataGrid, GridColDef, GridRowSelectionModel } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import colors from "../../Components/colors";
import CustomButton from "../../Components/button";
import CustomDeleteButton from "../../Components/customdeletebutton";
import { DeleteConfirmModal } from "../../Components/DeleteConfirmModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { DateTime } from "luxon";

const dean = "Dean";
const chairperson = "Chairperson";
const motherOrg = "Mother Org";
const unitOrg = "Unit Org";
const faculty = "Faculty";
const cancelled = "cancelled";

import { User, Role, Status, Event, College, Setup, Venue, Section } from "../../Components/models";

// interface UserRole {
//   id: number;
//   designation: string;
//   rank: number;
// }

// interface User {
//   id: number;
//   is_active: boolean;
//   first_name: string;
//   last_name: string;
//   idNumber: string;
//   email: string;
//   department: {
//     id: number;
//     departmentName: string;
//     collegeName: number;
//   };
//   role: UserRole;
//   createdBy: any
// }

// interface Notification {
//   id: number;
//   eventName: string;
//   created_by: string;
//   startDateTime: string;
//   endDateTime: string;
//   status: string;
// }

// interface Status {
//   id: number;
//   statusName: string;
// }

// interface Events {
//   id: number;
//   eventName: string;
//   startDateTime: string;
//   endDateTime: string;
//   status: Status;
//   created_by: User;
// }

// interface College {
//   id: number;
//   collegeName: string;
// }

// interface Setup {
//   id: number;
//   setupName: string;
// }

// interface Venue {
//   id: number;
//   venueName: string;
// }

// interface Section {
//   id: number;
//   sectionName: string;
// }

interface Entity {
  id: number,
  eventTypeName: string;
  college: string;
  collegeName: string;
  rank: string;
  sectionName: string;
  tblYearLevel: string;
  venueName: string;
  setupName: string;
  statusName: string;
  schoolYearName: string;
  departmentName: string;
  designation: string;
  yearLevel: string;
  startYear: string;
  endYear: string;
  status: string;
  eventCategoryName: string;
  eventName: string;
  createdBy: string;
  startDateTime: string;
  endDateTime: string;
  isAprrovedByDean: boolean;
  isAprrovedByChairman: boolean;
  type: string;
  location: string;
}

interface YearLevel {
  id: number;
  yearLevel: string;
}

const Dashboard: React.FC = () => {
  // State declarations
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [setups, setSetups] = useState<Setup[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [eventCategories, setEventCategories] = useState<any[]>([]);
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [schoolYears, setSchoolYears] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<number[]>([]);
  const [inactiveUsers, setInactiveUsers] = useState<boolean>(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedCollege, setSelectedCollege] = useState<string>("");
  const [selectedEventType, setSelectedEventType] = useState<string>("");
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(false);
  const [draftEvents, setDraftEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [yearLevels, setYearLevels] = useState<YearLevel[]>([]);

  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState<string>("");
  const [currentEntity, setCurrentEntity] = useState<Partial<Entity>>({
    id: 0,
    eventTypeName: "",
    college: "",
    collegeName: "",
    rank: "",
    sectionName: "",
    tblYearLevel: "",
    venueName: "",
    setupName: "",
    statusName: "",
    schoolYearName: "",
    departmentName: "",
    designation: "",
    yearLevel: "",
    startYear: "",
    endYear: "",
    status: "",
    eventCategoryName: "",
    eventName: "",
    createdBy: "",
    startDateTime: "",
    endDateTime: "",
    isAprrovedByDean: false,
    isAprrovedByChairman: false,
    type: "",
    location: "",
  });
  const [currentEntityType, setCurrentEntityType] = useState<string>("");

  const token = Cookies.get("auth_token");
  const navigate = useNavigate();
  const [openModal, setOpenModal] = useState(false);
  const [openModal2, setOpenModal2] = useState(false);
  const [openPostponeModal, setOpenPostponeModal] = useState(false);
  const [cancel, setCancel] = useState<{ id: number } | null>(null);
  const [remark, setRemark] = useState<string>("");
  const [entityToDelete, setEntityToDelete] = useState<Entity | null>(null);

  //designation
  const draftRole = ["Dean", "Chairperson"];

  // Fetch data from API
  const fetchData = async () => {
    try {
      const [
        usersResponse,
        departmentsResponse,
        rolesResponse,
        collegesResponse,
        setupsResponse,
        venuesResponse,
        statusesResponse,
        sectionsResponse,
        eventCategoriesResponse,
        // yearLevelsResponse,
        eventTypesResponse,
        schoolYearsResponse,
        remarkResponse,
      ] = await Promise.all([
        http.get("users/", { headers: { Authorization: `Token ${token}` } }),
        http.get("departments/", {
          headers: { Authorization: `Token ${token}` },
        }),
        http.get("userroles/", {
          headers: { Authorization: `Token ${token}` },
        }),
        http.get("colleges/", {
          headers: { Authorization: `Token ${token}` },
        }),
        http.get("setups/", { headers: { Authorization: `Token ${token}` } }),
        http.get("venues/", { headers: { Authorization: `Token ${token}` } }),
        http.get("status/", { headers: { Authorization: `Token ${token}` } }),
        http.get("sections/", {
          headers: { Authorization: `Token ${token}` },
        }),
        http.get("eventcategories/", {
          headers: { Authorization: `Token ${token}` },
        }),
        http.get("eventtypes/", {
          headers: { Authorization: `Token ${token}` },
        }),
        http.get("schoolyear/", {
          headers: { Authorization: `Token ${token}` },
        }),
        http.get("eventremark/", {
          headers: { Authorization: `Token ${token}` },
        }),
      ]);

      // Set state with fetched data.
      setUsers(usersResponse.data);
      setDepartments(departmentsResponse.data);
      setRoles(
        rolesResponse.data.filter((role: any) => role.designation !== "Admin")
      );
      setColleges(collegesResponse.data);
      setSetups(setupsResponse.data);
      setVenues(venuesResponse.data);
      setStatuses(statusesResponse.data);
      setSections(sectionsResponse.data);
      setEventCategories(eventCategoriesResponse.data);
      // setYearLevels(yearLevelsResponse.data);
      setEventTypes(eventTypesResponse.data);
      setSchoolYears(schoolYearsResponse.data);
      setRemark(remarkResponse.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchDraftEvents = async () => {
    try {
      const notificationsResponse = await http.get("approvalevents/", {
        headers: { Authorization: `Token ${token}` },
      });

      const draftNotifications = notificationsResponse.data.filter(
        (notification: any) => notification.status.statusName === "draft"
      );

      setDraftEvents(draftNotifications); // Store the fetched draft events in state
    } catch (error) {
      console.error("Error fetching draft events:", error);
    }
  };

  useEffect(() => {
    const fetchYearLevels = async () => {
      try {
        const response = await http.get("yearlevel/");
        setYearLevels(response.data);
      } catch (error) {
        console.error("Error fetching year levels:", error);
      }
    };

    fetchYearLevels();
  }, []);

  // Call fetchDraftEvents in useEffect
  useEffect(() => {
    fetchDraftEvents();
  }, [token]);

  // Fetch user role and data on component mount
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await http.get("auth/users/me", {
          headers: { Authorization: `Token ${token}` },
        });
        setUser(response.data);
        setAdmin(response.data.is_staff);
        fetchData();
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };

    fetchUserRole();
  }, [token]);

  // Handle filter changes
  const handleFilterChange = (event: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const { name, value } = event.target;
    if (name === "role") setSelectedRole(value as string);
    if (name === "department") setSelectedDepartment(value as string);
    if (name === "college") setSelectedCollege(value as string);
  };

  // Generate rows for DataGrid
  const getRows = () => {
    return users
      .filter((user) => {
        const isActiveFilter = activeUsers ? user.is_active === true : true;
        const isInactiveFilter = inactiveUsers
          ? user.is_active === false
          : true;
        return isActiveFilter && isInactiveFilter;
      })
      .map((user) => ({
        id: user.id,
        idNumber: user.idNumber,
        firstName: user.first_name,
        lastName: user.last_name,
        username: user.email,
        department: user.department ? user.department.departmentName : "N/A",
        role: user.role ? user.role.designation : "N/A",
        college: user.department
          ? colleges.find(
            (college) => college.id === user.department.collegeName
          )?.collegeName || "N/A"
          : "N/A",
        active: user.is_active,
        detailsUrl: `${http}users/${user.id}/`,
      }));
  };

  const getDraftEventRows = () => {
    return draftEvents.map((event) => ({
      id: event.id,
      eventName: event.eventName,
      createdBy: `${event.created_by.first_name} ${event.created_by.last_name}`,
      startDateTime: new Date(event.startDateTime).toLocaleString(),
      endDateTime: new Date(event.endDateTime).toLocaleString(),
      status: event.status.statusName,
    }));
  };

  // Define columns for DataGrid
  const columns: GridColDef[] = [
    { field: "idNumber", headerName: "ID", width: 100 },
    { field: "firstName", headerName: "First Name", width: 130 },
    { field: "lastName", headerName: "Last Name", width: 130 },
    { field: "username", headerName: "Email", width: 200 },
    { field: "department", headerName: "Department", width: 150 },
    { field: "role", headerName: "Role", width: 150 },
    { field: "college", headerName: "College", width: 150 },
    {
      field: "active",
      headerName: "Active",
      width: 150,
      renderCell: (params: any) =>
        params.value ? (
          <CheckIcon style={{ color: "green" }} />
        ) : (
          <CloseIcon style={{ color: "red" }} />
        ),
    },
    {
      field: "details",
      headerName: "See Details",
      width: 150,
      renderCell: (params: any) => (
        <CustomButton
          onClick={() => navigate(`/auth/app/userdetails/${params.row.id}`)}
        >
          See Details
        </CustomButton>
      ),
    },
  ];

  const eventColumns: GridColDef[] = [
    { field: "id", headerName: "Event ID", width: 100 },
    { field: "eventName", headerName: "Event Name", width: 200 },
    { field: "createdBy", headerName: "Created By", width: 150 },
    { field: "startDateTime", headerName: "Start Date", width: 180 },
    { field: "endDateTime", headerName: "End Date", width: 180 },
    { field: "status", headerName: "Status", width: 120 },
    {
      field: "details",
      headerName: "See Details",
      width: 150,
      renderCell: (params: any) => (
        <CustomButton
          onClick={() => navigate(`/auth/app/eventdetails/${params.row.id}`)}
        >
          See Details
        </CustomButton>
      ),
    },
    {
      field: "approve",
      headerName: "Approve",
      renderCell: (params: any) => (
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleApproveEvent(params.row.id)} // Approve button for each row
        >
          Approve
        </Button>
      ),
    },
    {
      field: "disapprove",
      headerName: "DisApprove",
      renderCell: (params: any) => (
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleOpenDisapproveModal(params.row.id)} // Open modal for disapproving
        >
          Disapprove
        </Button>
      ),
    },
  ];

  // Open dialog for adding or editing entities
  const handleOpenDialog = (type: any, entityType: any, entity: any) => {
    setDialogType(type);
    setCurrentEntityType(entityType);

    // Ensure the entity fields are set correctly
    if (entityType === "departments") {
      setCurrentEntity({
        id: entity?.id,
        departmentName: entity?.departmentName,
        college: entity?.college || "", // Ensure correct property name
      });
    } else if (entityType === "userroles") {
      setCurrentEntity({
        id: entity?.id,
        designation: entity?.designation,
        rank: entity?.rank || "",
      });
    } else {
      // Default handling or additional cases
      setCurrentEntity(entity || {});
    }

    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Save entity data
  const handleSave = async () => {
    try {
      let updatedEntity = { ...currentEntity };

      // Adjust properties based on entity type
      if (currentEntityType === "departments") {
        if (updatedEntity.college) {
          updatedEntity.collegeName = updatedEntity.college;
          delete (updatedEntity as { college?: string }).college;
        }
      }

      // Add handling for other entity types if necessary

      if (dialogType === "add") {
        await http.post(`${currentEntityType}/`, updatedEntity, {
          headers: { Authorization: `Token ${token}` },
        });
      } else if (dialogType === "edit") {
        await http.put(
          `${currentEntityType}/${currentEntity.id}/`,
          updatedEntity,
          {
            headers: { Authorization: `Token ${token}` },
          }
        );
      }
      fetchData(); // Refresh the data
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving entity:", error);
    }
  };

  const handleDelete = async () => {
    try {
      if (entityToDelete) {
        await http.delete(`${entityToDelete.type}/${entityToDelete.id}/`, {
          headers: { Authorization: `Token ${token}` },
        });
        fetchData(); // Refresh the data after deletion
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
        setOpenModal(false); // Close modal after successful deletion
      }
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

  // Open delete confirmation modal
  const handleOpenDeleteModal = (entityType: any, entity: any) => {
    setEntityToDelete({
      id: entity.id,
      eventTypeName: "",
      college: "",
      collegeName: "",
      rank: "",
      sectionName: "",
      tblYearLevel: "",
      venueName: "",
      setupName: "",
      statusName: "",
      schoolYearName: "",
      departmentName: "",
      designation: "",
      yearLevel: "",
      startYear: "",
      endYear: "",
      status: "",
      eventCategoryName: "",
      eventName: "",
      createdBy: "",
      startDateTime: "",
      endDateTime: "",
      isAprrovedByDean: false,
      isAprrovedByChairman: false,
      type: entityType,
      location: "",
    }); // Set the entity to delete
    setOpenModal(true); // Open the modal
  };

  // Render entity tables
  const renderEntityTable = (entityType: any, entities: any) => {
    return (
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>
                {entityType === "departments"
                  ? "Department Name"
                  : entityType === "userroles"
                    ? "Role Designation"
                    : entityType === "yearlevels"
                      ? "Year Level"
                      : entityType === "eventtypes"
                        ? "Event Type"
                        : entityType === "schoolyear"
                          ? "School Year"
                          : entityType.charAt(0).toUpperCase() +
                          entityType.slice(1) +
                          " Name"}
              </TableCell>
              {entityType === "schoolyear" && (
                <>
                  <TableCell>Start Year</TableCell>
                  <TableCell>End Year</TableCell>
                </>
              )}
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entities.map((entity: any) => (
              <TableRow key={entity.id}>
                <TableCell>{entity.id}</TableCell>
                <TableCell>
                  {entityType === "departments" && entity.departmentName}
                  {entityType === "userroles" && entity.designation}
                  {entityType === "colleges" && entity.collegeName}
                  {entityType === "setups" && entity.setupName}
                  {entityType === "venues" && entity.venueName}
                  {entityType === "status" && entity.statusName}
                  {entityType === "sections" && entity.sectionName}
                  {entityType === "eventcategories" && entity.eventCategoryName}
                  {entityType === "eventtypes" && entity.eventTypeName}
                  {entityType === "schoolyear" && entity.schoolYearName}
                </TableCell>
                {entityType === "schoolyear" && (
                  <>
                    <TableCell>{entity.startYear}</TableCell>
                    <TableCell>{entity.endYear}</TableCell>
                  </>
                )}
                <TableCell>
                  <Button
                    onClick={() => handleOpenDialog("edit", entityType, entity)}
                    variant="outlined"
                    sx={{ mr: 1 }}
                  >
                    Edit
                  </Button>
                  <CustomDeleteButton
                    onClick={() => handleOpenDeleteModal(entityType, entity)}
                  >
                    Delete
                  </CustomDeleteButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const handleApproveEvent = async (eventId: any) => {
    try {
      // Determine the approval field based on the current user's role
      const approvalField =
        user?.role?.designation === dean
          ? { isAprrovedByDean: true }
          : { isAprrovedByChairman: true };

      // Update the approval field in the backend
      await http.patch(`events/${eventId}/`, approvalField, {
        headers: { Authorization: `Token ${token}` },
      });

      // Fetch the updated event data
      const response = await http.get(`events/${eventId}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const updatedEvent = response.data;

      const start = DateTime.fromISO(updatedEvent.startDateTime);
      const end = DateTime.fromISO(updatedEvent.endDateTime);
      const now = DateTime.now();

      let status: any;

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
        await http.patch(
          `events/${eventId}/`,
          { status: findStatus?.id || '' },
          {
            headers: { Authorization: `Token ${token}` },
          }
        );
        const remarks = Array.isArray(remark) ? remark.find((rem: any) => rem.events.id === eventId) : null;
        if (remarks) {
          // Remove the event remark for the approved event
          await http.delete(`eventremark/${remarks.id}`, {
            headers: { Authorization: `Token ${token}` },
          });
        }
        toast.success(`Selected event has been approved and marked as ${status}`, {
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
    } catch (error) {
      console.error("Error updating approval status:", (error: any) => error.message);
      toast.error("Failed to approve the selected events", {
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

  const handleApproveMultipleEvent = async () => {
    try {
      await Promise.all(
        selectedEvents.map(async (eventId) => {
          // Determine the approval field based on the current user's role
          const approvalField =
            user?.role?.designation === dean
              ? { isAprrovedByDean: true }
              : { isAprrovedByChairman: true };

          // Update the approval field in the backend
          await http.patch(`events/${eventId}/`, approvalField, {
            headers: { Authorization: `Token ${token}` },
          });

          // Fetch the updated event data
          const response = await http.get(`events/${eventId}/`, {
            headers: { Authorization: `Token ${token}` },
          });
          const updatedEvent = response.data;

          const start = DateTime.fromISO(updatedEvent.startDateTime);
          const end = DateTime.fromISO(updatedEvent.endDateTime);
          const now = DateTime.now();

          let status: any;

          // Determine status based on role and approvals
          const { designation } = updatedEvent.created_by.role;

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
            await http.patch(
              `events/${eventId}/`,
              { status: findStatus?.id || '' },
              {
                headers: { Authorization: `Token ${token}` },
              }
            );
            const remarks = Array.isArray(remark) ? remark.find((rem: any) => rem.events.id === eventId) : null;
            if (remarks) {
              // Remove the event remark for the approved event
              await http.delete(`eventremark/${remarks.id}`, {
                headers: { Authorization: `Token ${token}` },
              });
            }
          }
        })
      );

      toast.success(
        "Selected events have been approved and their statuses updated.",
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

      // Optionally, refresh your events data to reflect the changes
      // getDraftEventRows(); // or trigger a state update here
    } catch (error) {
      console.error("Error approving selected events:", (error: any) => error.message);
      toast.error("Failed to approve the selected events", {
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


  const handleDisapproveEvent = async (eventId: number) => {
    try {
      if (remark) {
        // Add event remark
        await http.post(
          `eventremark/`,
          {
            events: eventId,
            remark: remark, // Use the remark state here
          },
          {
            headers: { Authorization: `Token ${token}` },
          }
        );

        // Find the status id for "disapproved"
        const findstatus = statuses?.find(
          (stat) => stat.statusName === "disapproved"
        );

        if (findstatus?.id) {
          // Proceed only if `findstatus` is found
          // Update event status
          await http.patch(
            `events/${eventId}/`,
            {
              status: findstatus.id,
            },
            {
              headers: { Authorization: `Token ${token}` },
            }
          );

          // Show success toast and close modal
          toast.success("Event Disapproved Successfully", {
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
          });

          setOpenPostponeModal(false); // Close modal after successful disapproval
          setTimeout(() => {
            window.location.reload();
          }, 3000); // 3 seconds delay to refresh the page
        } else {
          throw new Error("Status 'disapproved' not found.");
        }
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`, {
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

  const handleOpenDisapproveModal = (eventId: number) => {
    setCancel({ id: eventId }); // Set the event ID to cancel
    setRemark(""); // Reset remark each time the modal opens
    setOpenPostponeModal(true); // Open the modal
  };

  const handleActivateUsers = async () => {
    try {
      await Promise.all(
        selectedUsers.map((userId) =>
          http.patch(
            `users/${userId}/`,
            { is_active: true },
            {
              headers: { Authorization: `Token ${token}` },
            }
          )
        )
      );
      toast.success("Selected users have been activated", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      // Refresh user data here to reflect the changes
    } catch (error) {
      console.error("Error activating users:", error);
    }
  };

  const handleDeactivateUsers = async () => {
    try {
      await Promise.all(
        selectedUsers.map((userId) =>
          http.patch(
            `users/${userId}/`,
            { is_active: false },
            {
              headers: { Authorization: `Token ${token}` },
            }
          )
        )
      );
      alert("Selected users have been deactivated");
      // Refresh user data here to reflect the changes
    } catch (error) {
      console.error("Error deactivating users:", error);
    }
  };

  // Render the dashboard
  return (
    <Container
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "83vh",
        overflow: "hidden",
        width: "79vw",
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
        }}
      >
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>

        {loading ? (
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
        ) : (
          <Box>
            {draftRole.includes(user?.role?.designation) && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Draft Event
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleApproveMultipleEvent} // Approve all selected events
                  disabled={selectedEvents.length === 0} // Disable the button if no events are selected
                >
                  Approve Selected Events
                </Button>
                <DataGrid
                  rows={getDraftEventRows()}
                  columns={eventColumns}
                  checkboxSelection
                  onRowSelectionModelChange={(newSelection: GridRowSelectionModel) => {
                    setSelectedEvents(newSelection as number[]); // Update selected events based on selection
                  }}
                  onRowClick={(params) => setSelectedEvent(params.row)}
                  initialState={{
                    pagination: {
                      paginationModel: { page: 0, pageSize: 10 },
                    },
                  }}
                  pageSizeOptions={[5, 10]}
                />
              </Box>
            )}
            {admin ? (
              <Box>
                <Box sx={{ mt: 5 }}>
                  <CustomButton onClick={() => navigate("/auth/app/adduser")}>
                    Add a User
                  </CustomButton>
                  {admin && (
                    <CustomButton
                      onClick={() => navigate("/auth/app/uploaduser")}
                    >
                      Upload User
                    </CustomButton>
                  )}
                  <CustomButton onClick={() => setActiveUsers((prev) => !prev)}>
                    {activeUsers ? "Show All Users" : "Active Users"}
                  </CustomButton>
                  <CustomButton
                    onClick={() => setInactiveUsers((prev) => !prev)}
                  >
                    {inactiveUsers ? "Show All Users" : "Inactive Users"}
                  </CustomButton>

                  <CustomButton
                    onClick={handleActivateUsers}
                    disabled={selectedUsers.length === 0} // Enable button only if users are selected
                    color="primary"
                    variant="contained"
                  >
                    Reactivate Selected
                  </CustomButton>
                  <CustomButton
                    onClick={handleDeactivateUsers}
                    disabled={selectedUsers.length === 0} // Enable button only if users are selected
                    color="secondary"
                    variant="contained"
                    sx={{ marginLeft: 8 }}
                  >
                    Deactivate Selected
                  </CustomButton>
                </Box>

                <DataGrid
                  rows={getRows()}
                  columns={columns}
                  paginationModel={{ page: 0, pageSize: 10 }}
                  checkboxSelection
                  onRowSelectionModelChange={(newSelection: GridRowSelectionModel) => {
                    setSelectedUsers(newSelection as number[]); // Update selected users based on selection
                  }}
                  initialState={{
                    pagination: {
                      paginationModel: { page: 0, pageSize: 10 },
                    },
                  }}
                  pageSizeOptions={[5, 10]}
                />

                {admin && (
                  <Box sx={{ mt: 4, p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Manage Entities
                    </Typography>
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h6" gutterBottom>
                        Setups
                      </Typography>
                      <CustomButton
                        onClick={() => handleOpenDialog("add", "setups", "")}
                      >
                        Add Setup
                      </CustomButton>
                      {renderEntityTable("setups", setups)}
                    </Box>
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h6" gutterBottom>
                        Venues
                      </Typography>
                      <CustomButton
                        onClick={() => handleOpenDialog("add", "venues", "")}
                      >
                        Add Venue
                      </CustomButton>
                      {renderEntityTable("venues", venues)}
                    </Box>
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h6" gutterBottom>
                        Status
                      </Typography>
                      <CustomButton
                        onClick={() => handleOpenDialog("add", "status", "")}
                      >
                        Add Status
                      </CustomButton>
                      {renderEntityTable("status", statuses)}
                    </Box>
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h6" gutterBottom>
                        Sections
                      </Typography>
                      <CustomButton
                        onClick={() => handleOpenDialog("add", "sections", "")}
                      >
                        Add Section
                      </CustomButton>
                      {renderEntityTable("sections", sections)}
                    </Box>
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h6" gutterBottom>
                        Event Categories
                      </Typography>
                      <CustomButton
                        onClick={() =>
                          handleOpenDialog("add", "eventcategories", "")
                        }
                      >
                        Add Event Category
                      </CustomButton>
                      {renderEntityTable("eventcategories", eventCategories)}
                    </Box>
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h6" gutterBottom>
                        Colleges
                      </Typography>
                      <CustomButton
                        onClick={() => handleOpenDialog("add", "colleges", "")}
                      >
                        Add College
                      </CustomButton>
                      {renderEntityTable("colleges", colleges)}
                    </Box>
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h6" gutterBottom>
                        Departments
                      </Typography>
                      <CustomButton
                        onClick={() => handleOpenDialog("add", "departments", "")}
                      >
                        Add Department
                      </CustomButton>
                      {renderEntityTable("departments", departments)}
                    </Box>
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h6" gutterBottom>
                        User Roles
                      </Typography>
                      <CustomButton
                        onClick={() => handleOpenDialog("add", "userroles", "")}
                      >
                        Add User Role
                      </CustomButton>
                      {renderEntityTable("userroles", roles)}
                    </Box>

                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h6" gutterBottom>
                        Event Types
                      </Typography>
                      <CustomButton
                        onClick={() => handleOpenDialog("add", "eventtypes", "")}
                      >
                        Add Event Type
                      </CustomButton>
                      {renderEntityTable("eventtypes", eventTypes)}
                    </Box>

                    {/* School Year */}
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h6" gutterBottom>
                        School Years
                      </Typography>
                      <CustomButton
                        onClick={() => handleOpenDialog("add", "schoolyear", "")}
                      >
                        Add School Year
                      </CustomButton>
                      {renderEntityTable("schoolyear", schoolYears)}
                    </Box>
                    <DeleteConfirmModal
                      name="entity"
                      openModal={openModal}
                      setOpenModal={setOpenModal}
                      handleDelete={handleDelete}
                      type="delete"
                      remark={null}
                      setRemark={() => {}}
                    />
                  </Box>
                )}
              </Box>
            ) : (
              <Typography variant="h6" color="textSecondary">
                You do not have permission to view the users list.
              </Typography>
            )}
          </Box>
        )}

        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>
            {dialogType === "add"
              ? `Add ${currentEntityType.charAt(0).toUpperCase() + currentEntityType.slice(1)}`
              : `Edit ${currentEntityType.charAt(0).toUpperCase() + currentEntityType.slice(1)}`}
          </DialogTitle>
          <DialogContent>
            {currentEntityType === "setups" && (
              <TextField
                autoFocus
                margin="dense"
                id="setupName"
                label="Setup Name"
                type="text"
                fullWidth
                variant="standard"
                value={currentEntity?.setupName || ""}
                onChange={(e) => setCurrentEntity({ ...currentEntity, setupName: e.target.value })}
              />
            )}

            {currentEntityType === "venues" && (
              <Box>
                <TextField
                  autoFocus
                  margin="dense"
                  id="venueName"
                  label="Venue Name"
                  type="text"
                  fullWidth
                  variant="standard"
                  value={currentEntity?.venueName || ""}
                  onChange={(e) => setCurrentEntity({ ...currentEntity, venueName: e.target.value })}
                />
                <TextField
                  margin="dense"
                  id="location"
                  label="Location"
                  type="text"
                  fullWidth
                  variant="standard"
                  value={currentEntity?.location || ""}
                  onChange={(e) => setCurrentEntity({ ...currentEntity, location: e.target.value })}
                />
              </Box>
            )}

            {currentEntityType === "status" && (
              <TextField
                autoFocus
                margin="dense"
                id="statusName"
                label="Status Name"
                type="text"
                fullWidth
                variant="standard"
                value={currentEntity?.statusName || ""}
                onChange={(e) => setCurrentEntity({ ...currentEntity, statusName: e.target.value })}
              />
            )}

            {currentEntityType === "sections" && (
              <TextField
                autoFocus
                margin="dense"
                id="sectionName"
                label="Section Name"
                type="text"
                fullWidth
                variant="standard"
                value={currentEntity?.sectionName || ""}
                onChange={(e) => setCurrentEntity({ ...currentEntity, sectionName: e.target.value })}
              />
            )}

            {currentEntityType === "sections" && (
              <FormControl fullWidth margin="dense">
                <InputLabel id="yearLevelLabel">Year Level</InputLabel>
                <Select
                  labelId="yearLevelLabel"
                  id="yearLevel"
                  value={currentEntity?.tblYearLevel || ""}
                  onChange={(e) =>
                    setCurrentEntity({
                      ...currentEntity,
                      tblYearLevel: e.target.value,
                    })
                  }
                  variant="standard"
                >
                  {yearLevels.map((year) => (
                    <MenuItem key={year.id} value={year.id}>
                      {year.yearLevel}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {currentEntityType === "eventcategories" && (
              <TextField
                autoFocus
                margin="dense"
                id="eventCategoryName"
                label="Event Category Name"
                type="text"
                fullWidth
                variant="standard"
                value={currentEntity?.eventCategoryName || ""}
                onChange={(e) => setCurrentEntity({ ...currentEntity, eventCategoryName: e.target.value })}
              />
            )}

            {currentEntityType === "colleges" && (
              <TextField
                autoFocus
                margin="dense"
                id="collegeName"
                label="College Name"
                type="text"
                fullWidth
                variant="standard"
                value={currentEntity?.collegeName || ""}
                onChange={(e) => setCurrentEntity({ ...currentEntity, collegeName: e.target.value })}
              />
            )}

            {currentEntityType === "departments" && (
              <Box>
                <TextField
                  autoFocus
                  margin="dense"
                  id="departmentName"
                  label="Department Name"
                  type="text"
                  fullWidth
                  variant="standard"
                  value={currentEntity?.departmentName || ""}
                  onChange={(e) => setCurrentEntity({ ...currentEntity, departmentName: e.target.value })}
                />
                <Select
                  margin="dense"
                  id="collegeName"
                  label="College"
                  value={currentEntity?.college || ""}
                  onChange={(e) =>
                    setCurrentEntity({
                      ...currentEntity,
                      college: e.target.value, // Ensure this matches API field name
                    })
                  }
                  fullWidth
                >
                  {colleges.map((college) => (
                    <MenuItem key={college.id} value={college.id}>
                      {college.collegeName}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            )}

            {currentEntityType === "userroles" && (
              <Box>
                <TextField
                  autoFocus
                  margin="dense"
                  id="designation"
                  label="Role Designation"
                  type="text"
                  fullWidth
                  variant="standard"
                  value={currentEntity?.designation || ""}
                  onChange={(e) => setCurrentEntity({ ...currentEntity, designation: e.target.value })}
                />
                <TextField
                  autoFocus
                  margin="dense"
                  id="rank"
                  label="Rank"
                  type="number"
                  fullWidth
                  variant="standard"
                  value={currentEntity?.rank || ""}
                  onChange={(e) => setCurrentEntity({ ...currentEntity, rank: e.target.value })}
                />
              </Box>
            )}

            {currentEntityType === "eventtypes" && (
              <Box>
                <TextField
                  autoFocus
                  margin="dense"
                  id="eventtpye"
                  label="Event Type"
                  type="text"
                  fullWidth
                  variant="standard"
                  value={currentEntity?.eventTypeName || ""}
                  onChange={(e) => setCurrentEntity({ ...currentEntity, eventTypeName: e.target.value })}
                />
              </Box>
            )}

            {currentEntityType === "eventtypes" && (
              <Box>
                <TextField
                  autoFocus
                  margin="dense"
                  id="eventtpye"
                  label="Event Type"
                  type="text"
                  fullWidth
                  variant="standard"
                  value={currentEntity?.eventTypeName || ""}
                  onChange={(e) => setCurrentEntity({ ...currentEntity, eventTypeName: e.target.value })}
                />
              </Box>
            )}

            {currentEntityType === "schoolyear" && (
              <Box>
                <TextField
                  autoFocus
                  margin="dense"
                  id="schoolyear"
                  label="School Year"
                  type="text"
                  fullWidth
                  variant="standard"
                  value={currentEntity?.schoolYearName || ""}
                  onChange={(e) => setCurrentEntity({ ...currentEntity, schoolYearName: e.target.value })}
                />
                <TextField
                  autoFocus
                  margin="dense"
                  id="schoolyear"
                  label="Start Year"
                  type="text"
                  fullWidth
                  variant="standard"
                  value={currentEntity?.startYear || ""}
                  onChange={(e) => setCurrentEntity({ ...currentEntity, startYear: e.target.value })}
                />
                <TextField
                  autoFocus
                  margin="dense"
                  id="schoolyears"
                  label="End Year"
                  type="text"
                  fullWidth
                  variant="standard"
                  value={currentEntity?.endYear || ""}
                  onChange={(e) => setCurrentEntity({ ...currentEntity, endYear: e.target.value })}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogActions>
        </Dialog>
      </Box>
      <ToastContainer />
      <DeleteConfirmModal
        name="event" // This can be customized based on the entity
        openModal={openPostponeModal}
        setOpenModal={setOpenPostponeModal}
        handleDelete={() => handleDisapproveEvent(cancel!.id)} // Pass disapprove function
        type="disapprove"
        remark={remark} // Remark state
        setRemark={setRemark} // Function to update remark
      />
    </Container>
  );
};

export default Dashboard;
