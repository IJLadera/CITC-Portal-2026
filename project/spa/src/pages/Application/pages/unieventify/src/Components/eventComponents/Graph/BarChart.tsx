import React from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { Box, Typography, Modal } from '@mui/material';

import { Event } from '../../models';

const chartSetting = {
    maxwidth: 550,
    height: 500,
};

const valueFormatter = (value: any) => `${value}`;

interface BarChartComponentProps {
    data: any;
    label: string;
    color: string;
}

// interface Event{
//     id: number;
//     name: string;
// }

export default function BarChartComponent({ data, label, color }: BarChartComponentProps) {
    const [open, setOpen] = React.useState(false);
    const [events, setEvents] = React.useState<Event[]>([]);

    const handleOpen = (eventsList: any) => {
        setEvents(eventsList || []); // Ensure eventsList is valid
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEvents([]);
    };
    const eventsArray = data.map((item:any) => item.events);

    return (
        <div>
            <BarChart
                dataset={data}
                borderRadius={10}
                xAxis={[{ scaleType: 'band', dataKey: 'month' }]}
                yAxis={[{ label: 'Event Counts' }]}
                // onItemClick={(event, d:any) => {
                onItemClick={(d:any) => {
                    handleOpen(eventsArray[d.dataIndex])
                }} // Pass the correct events for the clicked mark
                series={[
                    { dataKey: 'count', label: `${label}`, valueFormatter, color: color },
                ]}
                {...chartSetting}
            />
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style}>
                    <Typography id="modal-modal-title" variant="h6" component="h2">
                        Events List
                    </Typography>
                    {events?.map((event, index) => (
                        <Typography id="modal-modal-description" sx={{ mt: 2 }} key={index}>
                            ID: {event.id} - Title: {event.eventName}.
                            {/* It should be event.name */}
                        </Typography>
                    ))}
                </Box>
            </Modal>
        </div>
    );
}

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};
