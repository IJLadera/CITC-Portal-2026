import React, { useEffect, useState } from "react";
import { Box, CircularProgress, Paper, TextField, Typography } from "@mui/material";
import { DataGrid, GridRowParams } from '@mui/x-data-grid';
import colors from "../../../Components/colors";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../../../../../../../../hooks";
import { fetchTimelineEvents } from "../../slice";

export default function EventTimeline() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Get timeline data and loading state from Redux store
  const { timeline, timelineLoading } = useAppSelector(state => state.unieventify);
  
  useEffect(() => {
    // Dispatch the action to fetch timeline events
    dispatch(fetchTimelineEvents());
  }, [dispatch]);

  const filteredEvents = timeline.filter((event) => {
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
        {timelineLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
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
        )}
      </Paper>
    </Box>
  );
}