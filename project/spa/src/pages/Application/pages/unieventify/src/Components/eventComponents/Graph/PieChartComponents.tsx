import React, { useState } from 'react';
import { PieChart } from '@mui/x-charts';
import { Box, Typography, Modal } from '@mui/material';

import { User } from "../../models"

interface DesignationPieChartProps {   
    data: any;
    totalCount: number;
}

// interface User {
//     id: number;
//     first_name: string;
//     last_name: string;
//     users: any;
//   }

interface UsersList {
    users: User[];
}

const DesignationPieChart = ({ data, totalCount } : DesignationPieChartProps) => {
    const [open, setOpen] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28EBB', '#FF6347', '#82CA9D'];

    const data2 = data.map((item: any, index:any) => ({
        id: item.designation,
        label: item.designation,
        value: item.count,
        color: COLORS[index % COLORS.length],
    }));

    const handleOpen = (eventsList: any) => {
        setUsers(eventsList || []); // Ensure eventsList is valid
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setUsers([]);
    };

    return (
        <div>
            <Box display="flex" flexDirection="column" alignItems='center'>
                <PieChart
                    series={[
                        {
                            data: data2,
                            innerRadius: 30,
                            outerRadius: 100,
                            paddingAngle: 5,
                            cornerRadius: 5,
                            startAngle: 0,
                            endAngle: 360,
                            cx: '40%',
                            cy: '50%',
                            // colorField: 'color', included in js but error in ts
                            // Use arcLabel to display the label and percentage, excluding 0%
                            arcLabel: (params) => {
                                const percentage = ((params.value / totalCount) * 100).toFixed(2);
                                return params.value > 0 ? `${percentage}%` : '';  // Show label only if value > 0
                            },
                        },
                    ]}
                    width={400}
                    height={300}
                    onItemClick={(event, d) => handleOpen(data[d.dataIndex])} // Pass the correct events for the clicked mark
                />
                <Box mt={2}>
                    <Typography variant="h6">
                        Total User: {totalCount}
                    </Typography>
                </Box>
            </Box>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style}>
                    <Typography id="modal-modal-title" variant="h6" component="h2">
                        User List
                    </Typography>
                    {/* {users.users?.map((user: any, index: any) => (
                        <Typography id="modal-modal-description" sx={{ mt: 2 }} key={index}>
                            ID: {user.id} - {user.first_name} {user.last_name}
                        </Typography>
                    ))} */}
                    {users.map((user, index) => (
                        <Typography id="modal-modal-description" sx={{ mt: 2 }} key={index}>
                            ID: {user.id} - {user.first_name} {user.last_name}
                        </Typography>
                    ))}
                </Box>
            </Modal>
        </div>
    );
};

export default DesignationPieChart;

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
