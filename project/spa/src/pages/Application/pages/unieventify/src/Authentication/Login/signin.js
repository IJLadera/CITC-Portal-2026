import * as React from "react";
import Avatar from "@mui/material/Avatar";
import { useState } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Typography from "@mui/material/Typography";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import axios from "../../axios";
import { IconButton } from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const theme = createTheme();

export default function SignIn({ toggleForm }) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);

  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const checkLoginAttempts = (email) => {
    const attemptsData = JSON.parse(
      Cookies.get(`login_attempts_${email}`) || "{}"
    );
    const attempts = attemptsData.attempts || 0;
    const lastAttemptTime = attemptsData.lastAttemptTime || 0;

    // Check if cooldown period has expired
    if (attempts >= 5 && Date.now() - lastAttemptTime < 5 * 60 * 1000) {
      setIsDisabled(true);
      toast.error("Too many login attempts. Please try again in 5 minutes.", {
        position: "top-center",
        autoClose: 5000,
      });
      return false;
    } else if (Date.now() - lastAttemptTime >= 5 * 60 * 1000) {
      // Reset attempts if cooldown period has expired
      Cookies.set(
        `login_attempts_${email}`,
        JSON.stringify({ attempts: 0, lastAttemptTime: Date.now() }),
        { expires: 1 }
      );
      setIsDisabled(false);
    }
    return true;
  };

  const incrementLoginAttempts = (email) => {
    const attemptsData = JSON.parse(
      Cookies.get(`login_attempts_${email}`) || "{}"
    );
    const attempts = (attemptsData.attempts || 0) + 1;

    // Set new attempts and timestamp in cookie
    Cookies.set(
      `login_attempts_${email}`,
      JSON.stringify({
        attempts,
        lastAttemptTime: Date.now(),
      }),
      { expires: 1 }
    );
  };

  const textFieldStyle = {
    "& .MuiInputLabel-asterisk": {
      color: "red", // Custom asterisk color
    },
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = data.get("email");
    const loginData = {
      email,
      password: data.get("password"),
    };

    // Check if the user is allowed to attempt login
    if (!checkLoginAttempts(email)) return;
    setIsDisabled(true);
    try {
      const response = await axios.post("auth/token/login", loginData, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      setIsDisabled(false);
      // Reset attempts on successful login
      Cookies.remove(`login_attempts_${email}`);
      Cookies.set("auth_token", response.data.auth_token, { expires: 2 });
      navigate("app/");
    } catch (error) {
      setIsDisabled(false);
      incrementLoginAttempts(email);
      const errorResponse = error.response
        ? error.response.data
        : error.message;
      if (typeof errorResponse === "object") {
        const errorMessages = Object.keys(errorResponse)
          .map((key) => `${key}: ${errorResponse[key].join(", ")}`)
          .join("\n");
        toast.error(`${errorMessages}`, {
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

  return (
    <ThemeProvider theme={theme}>
      <Grid container component="main" sx={{ height: "88vh" }}>
        <Grid item xs={false} sm={5} md={7} lg={8} sx={{}} />
        <Grid
          item
          xs={12}
          sm={7}
          md={5}
          lg={4}
          component={Paper}
          square
          sx={{
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            borderRadius: "8px",
            height: "88vh",
          }}
        >
          <Box
            sx={{
              my: 8,
              mx: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <img
              src={require("../../images/logo.png")}
              style={{ height: 110, width: 110, marginBottom: 10 }}
            />
            <Typography variant="h5">Sign in</Typography>
            <Box
              component="form"
              noValidate
              onSubmit={handleSubmit}
              sx={{ mt: 1, px: 3 }}
            >
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                sx={textFieldStyle}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                id="password"
                autoComplete="current-password"
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
                sx={textFieldStyle}
              />
              <FormControlLabel
                control={<Checkbox value="remember" color="primary" />}
                label="Remember me"
              />
              <Button
                disabled={isDisabled}
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, backgroundColor: "#191750" }}
              >
                Sign In
              </Button>
              <Grid container sx={{ color: "black" }}>
                <Grid item xs>
                  <Link
                    href="/forgotpassword"
                    variant="body2"
                    sx={{ color: "black" }}
                  >
                    Forgot password?
                  </Link>
                </Grid>
                <Grid item>
                  <Link
                    href="#"
                    variant="body2"
                    onClick={toggleForm}
                    sx={{ color: "black", cursor: "pointer" }}
                  >
                    {"Don't have an account? Sign Up"}
                  </Link>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Grid>
      </Grid>
      <ToastContainer />
    </ThemeProvider>
  );
}
