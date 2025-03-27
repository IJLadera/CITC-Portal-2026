import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function Error() {
  const navigate = useNavigate();

  const handleHomeClick = () => {
    navigate("/");
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      bgcolor="#f5f5f5"
      padding={3}
    >
      <Typography
        variant="h1"
        align="center"
        sx={{
          fontSize: { xs: "4rem", sm: "9rem", md: "10rem" },
          fontWeight: "bold",
          color: "#FAB417",
          mb: 2,
          textShadow: `2px 2px 4px #191750`,
        }}
      >
        Oops!
      </Typography>
      <Typography
        variant="h4"
        align="center"
        sx={{
          color: "#191750",
          mb: 2,
        }}
      >
        404 Not Found
      </Typography>
      <Typography
        variant="body1"
        align="center"
        sx={{
          color: "#333",
          mb: 4,
        }}
      >
        The page you are looking for does not exist.
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={handleHomeClick}
        sx={{
          bgcolor: "#FAB417",
          color: "#000",
          "&:hover": {
            bgcolor: "#191750",
            color: "#fff",
          },
        }}
      >
        Go Back to Homepage
      </Button>
    </Box>
  );
}
