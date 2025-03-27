import { Box, Typography, Divider, Grid } from "@mui/material";
import Skeleton from "@mui/material/Skeleton";

export default function Eventskeleton() {
  return (
    <Box
      sx={{
        mx: 2,
        p: 3,
        borderRadius: 2,
        boxShadow: 3,
      }}
      className="grid grid-cols-1 lg:grid-cols-2"
    >
      <Box className="order-last">
        <Typography variant="h4" sx={{ mb: 3 }}>
          <Skeleton variant="text" sx={{ fontSize: "4rem", maxWidth: 500 }} />
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="h6">
              <Skeleton
                variant="text"
                sx={{ fontSize: "2rem", maxWidth: 150 }}
              />
            </Typography>
            <Typography variant="body1">
              <Skeleton
                variant="text"
                sx={{ fontSize: "3rem", maxWidth: 300 }}
              />
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="h6">
              <Skeleton
                variant="text"
                sx={{ fontSize: "2rem", maxWidth: 150 }}
              />
            </Typography>
            <Typography variant="body1">
              <Skeleton
                variant="text"
                sx={{ fontSize: "3rem", maxWidth: 300 }}
              />
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" sx={{ mb: 1 }}>
          <Skeleton variant="text" sx={{ fontSize: "3rem", maxWidth: 150 }} />
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          <Skeleton variant="text" sx={{ fontSize: "6rem", maxWidth: 500 }} />
        </Typography>

        <Typography variant="h6" sx={{ mb: 1 }}>
          <Skeleton variant="text" sx={{ fontSize: "3rem", maxWidth: 150 }} />
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          <Skeleton variant="text" sx={{ fontSize: "6rem", maxWidth: 500 }} />
        </Typography>

        <Typography variant="h6" sx={{ mb: 1 }}>
          <Skeleton variant="text" sx={{ fontSize: "3rem", maxWidth: 150 }} />
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          <Skeleton variant="text" sx={{ fontSize: "6rem", maxWidth: 500 }} />
        </Typography>
      </Box>
      <Box className="self-center justify-self-center">
        <Skeleton variant="text" sx={{ height: 600, width: 300 }} />
      </Box>
    </Box>
  );
}
