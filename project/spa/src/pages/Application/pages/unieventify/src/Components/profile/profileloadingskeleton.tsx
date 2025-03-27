import {
    Grid,
    Box,
} from "@mui/material";
import Skeleton from '@mui/material/Skeleton';

export default function Profileloadingskeleton() {
    return (
        <Grid container spacing={3}>
            <Grid
                item
                xs={12}
                md={4}
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}

            >
                <Skeleton variant="circular" width={150} height={150} />

                <Skeleton variant="text" sx={{ fontSize: '2rem', width: 100 }} />
                <Skeleton variant="text" sx={{ fontSize: '2rem', width: 50 }} />
                <Skeleton variant="text" sx={{ fontSize: '2rem', width: 200 }} />
                <div className="mt-4 flex space-x-3 lg:mt-6">
                    <Skeleton variant="rounded" width={90} height={40} />
                    <Skeleton variant="rounded" width={90} height={40} />
                </div>
            </Grid>
            <Grid item xs={12} md={8}>
                <Box
                    sx={{
                        p: 3,
                        height: "100%",
                    }}
                >
                    <Skeleton variant="text" sx={{ fontSize: '2rem' }} />
                    <Box sx={{ mb: 2 }}>
                        <Skeleton variant="rounded" height={60} />
                        <Skeleton variant="text" sx={{ fontSize: '0.2rem', marginY: 1 }} />
                        <Skeleton variant="rounded" height={60} />
                        <Skeleton variant="text" sx={{ fontSize: '0.2rem', marginY: 1 }} />
                        <Skeleton variant="rounded" height={60} />
                        <Skeleton variant="text" sx={{ fontSize: '0.2rem', marginY: 1 }} />
                        <Skeleton variant="rounded" height={60} />
                        <Skeleton variant="text" sx={{ fontSize: '0.2rem', marginY: 1 }} />
                        <Skeleton variant="rounded" height={60} />
                        <Skeleton variant="text" sx={{ fontSize: '0.2rem', marginY: 1 }} />
                        <Skeleton variant="rounded" height={60} />
                        <Skeleton variant="text" sx={{ fontSize: '0.2rem', marginY: 1 }} />
                        <Skeleton variant="rounded" height={60} />
                        <Skeleton variant="text" sx={{ fontSize: '0.2rem', marginY: 1 }} />
                        <Skeleton variant="rounded" height={60} />
                        <Skeleton variant="text" sx={{ fontSize: '0.2rem', marginY: 1 }} />
                        <Skeleton variant="rounded" height={60} />
                    </Box>
                </Box>
            </Grid>
        </Grid>
    )
}
