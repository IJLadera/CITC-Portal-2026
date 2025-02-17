import React, { useEffect, useState } from "react";
import axios from "../../../axios";
import Cookies from "js-cookie";
import { Box, Paper, Button, Stack, TextField, Typography } from "@mui/material";
import { DataGrid, GridRowParams  } from '@mui/x-data-grid';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import colors from "../../../Components/colors";
import { CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Event } from "../../../Components/models";

interface EventType {
  id: number;
  eventName: string;
  startDateTime: string;
  endDateTime: string;
  status?: { statusName: string };
}

export default function EventTimeline() {
  const [events, setEvents] = useState([
    {
    id: 0,
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
            rank: 0
        },
        department: 0
    },
    eventCategory: 
        {
            id: 0,
            eventCategoryName: '',
        },
    eventType: 
    {
        id: 0,
        eventTypeName: '',
    },
    status: {
        id: 0,
        statusName: '',
    },
    venue: 
    {
      id: 0,
      venueName: '',
      location: ''
    },
    setup: {
      id: 0,
      setupName: '',
    },
    department: {
      id: 0,
      departmentName: '',
      collegeName: 0
    },
    meetinglink: '',
    eventName: '',
    eventDescription: '',
    startDateTime: '', 
    endDateTime: '',
    timestamp: '',
    approveDocuments: '',
    images: '',
    isAnnouncement: false,
    isAprrovedByDean: false,
    isAprrovedByChairman: false,
    majorEvent: false,
    recurrence_type: '',
    recurrence_days: '',
    }
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const token = Cookies.get("auth_token");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get("timeline/", {
          headers: {
            Authorization: `Token ${token}`,
          },
        });
        const filteredEvents = (response.data as EventType[]).filter(event => event.status?.statusName !== 'draft');
        const sortedEvents = filteredEvents.sort(
          (a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
        );
  
        const formatted = sortedEvents.map((event) => ({
          id: event.id,
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
              rank: 0
            },
            department: 0
          },
          eventCategory: event.status ? 
            { id: 0, eventCategoryName: event.status.statusName } 
            : { id: 0, eventCategoryName: '' },  // Add the id here
          eventType: { id: 0, eventTypeName: '' },
          status: event.status ? { id: 0, statusName: event.status.statusName } : { id: 0, statusName: '' },
          venue: { id: 0, venueName: '', location: '' },
          setup: { id: 0, setupName: '' },
          department: { id: 0, departmentName: '', collegeName: 0 },
          meetinglink: '',
          eventName: event.eventName,
          eventDescription: '',
          startDateTime: event.startDateTime,
          endDateTime: event.endDateTime,
          timestamp: '',
          approveDocuments: '',
          images: '',
          isAnnouncement: false,
          isAprrovedByDean: false,
          isAprrovedByChairman: false,
          majorEvent: false,
          recurrence_type: '',
          recurrence_days: ''
        }));        
  
        setEvents(formatted);
      } catch (error) {
        console.error("Failed to fetch events:", error);
      }
    };
  
    fetchEvents();
  }, [token]);  

  const filteredEvents = events.filter((event) => {
    const eventMonth = new Date(event.startDateTime).toLocaleString("en-US", { month: "long" });
    return event.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.eventCategory?.eventCategoryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.venue?.venueName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.setup?.setupName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.status?.statusName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eventMonth.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const rows = filteredEvents.map((event) => ({
    id: event.id,
    eventName: event.eventName,
    eventCategory: event.eventCategory?.eventCategoryName || 'No Data',
    setup: event.setup?.setupName || 'No Data',
    venue: event.venue?.venueName || 'No Data',
    startDateTime: new Date(event.startDateTime).toLocaleDateString(
      "en-US",
      { month: "long", day: "numeric", year: 'numeric' }
    ),
    endDateTime: new Date(event.endDateTime).toLocaleDateString(
      "en-US",
      { month: "long", day: "numeric", year: 'numeric' }
    ),
    status: event.status?.statusName || 'No Data'
  }));

  const columns = [
    { field: "eventName", headerName: "Event Name", width: 130 },
    { field: "eventCategory", headerName: "Category", width: 130 },
    { field: "setup", headerName: "Setup", width: 130 },
    { field: "venue", headerName: "Venue", width: 130 },
    { field: "startDateTime", headerName: "Start Date", width: 150 },
    { field: "endDateTime", headerName: "End Date", width: 150 },
    { field: "status", headerName: "Status", width: 130 },
  ];

  const handleRowClick = (params: GridRowParams) => {
    navigate(`/auth/app/eventdetails/${params.row.id}`);
  };

  const getRowClassName = (params: GridRowParams) => {
    const rowIndex = rows.findIndex((row) => row.id === params.row.id);
    return rowIndex % 2 === 0 ? "white-row" : "gray-row";
  };

  return (
    <Box
      sx={{
        width: "98%",
        mx: "auto",
        p: 3,
        bgcolor: "background.paper",
        borderRadius: 2,
        boxShadow: 3,
      }}
    >
      <Typography
        variant="h4"
        gutterBottom
        sx={{ mb: 2, color: colors.darkblue }}
      >
        Archived Events
      </Typography>

      <TextField
        label="Search Events"
        variant="outlined"
        fullWidth
        margin="normal"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Paper sx={{ height: '54vh' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowClassName={getRowClassName}
          onRowClick={handleRowClick}
          sx={{
            '& .white-row': { backgroundColor: 'white' },
            '& .gray-row': { backgroundColor: '#f7f7f7' },
            '& .MuiDataGrid-row:hover': { backgroundColor: '#e0f7fa' },
          }}
        />
      </Paper>
    </Box>
  );
}
