import { useState } from 'react';
import { LineChart, lineElementClasses } from '@mui/x-charts/LineChart';
import { Box, Typography, Modal } from '@mui/material';

// Define your colors
const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];

interface StatCardProps {
    data: CategoryData[];
    type: 'category' | 'department';
}

interface Statistic {
    month: string;
    count: number;
    events: Event[];
}

interface Event {
    id: number;
    name: string;
}

interface CategoryData {
    category?: string;
    department?: string;
    total_count: number;
    statistics: Statistic[];
}

export default function StatCard({ data, type }: StatCardProps) {
    const [open, setOpen] = useState(false);
    const [events, setEvents] = useState<Event[]>([]);

    const handleOpen = (eventsList: Event[]) => {
        setEvents(eventsList || []);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEvents([]);
    };

    return (
        <div>
            <div className="grid grid-cols-1 gap-x-5 lg:grid-cols-2 xl:grid-cols-3">
                {data.map((categoryData, index) => {
                    const name = categoryData[type];
                    const { statistics } = categoryData;

                    const xLabels = statistics.map(item => item.month);
                    const seriesData = statistics.map(item => item.count);
                    const eventsArray = statistics.map(item => item.events);
                    const color = colors[index % colors.length];

                    return (
                        <div key={name} className="p-4 border rounded-md shadow-md">
                            <LineChart
                                width={300}
                                height={200}
                                series={[{
                                    data: seriesData,
                                    label: `${name} Events (${seriesData.reduce((sum, count) => sum + count, 0)})`,
                                    area: true,
                                    showMark: true,
                                    color: color,
                                }]}
                                xAxis={[{ scaleType: 'point', data: xLabels }]}
                                yAxis={[{ label: 'Event Counts' }]}
                                onMarkClick={(event, d) => {
                                    if (d && d.dataIndex !== undefined) {
                                        handleOpen(eventsArray[d.dataIndex] || []);
                                    }
                                }}
                                sx={{
                                    [`& .${lineElementClasses.root}`]: {
                                        stroke: color,
                                        fill: `${color}33`,
                                    },
                                    [`& .MuiLegend-root`]: {
                                        display: 'none',
                                    },
                                }}
                            />
                        </div>
                    );
                })}
            </div>
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
                    {events.map((event, index) => (
                        <Typography key={index} sx={{ mt: 2 }}>
                            ID: {event.id} - Title: {event.name}
                        </Typography>
                    ))}
                </Box>
            </Modal>
        </div>
    );
}

const style = {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};
