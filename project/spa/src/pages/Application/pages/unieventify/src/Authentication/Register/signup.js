import * as React from "react";
import { useState } from "react";
import {
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  Paper,
  Select,
  MenuItem,
  ThemeProvider,
  createTheme,
  Link,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import axios from "../../axios";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { IconButton } from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const theme = createTheme();

export default function SignUp({ toggleForm }) {
  const [options, setOptions] = React.useState({
    roles: [],
    colleges: [],
  });

  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const [userData, setUserData] = React.useState({
    firstName: "",
    lastName: "",
    middleName: "",
    idNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    selectedDepartment: "",
  });

  const [passwordError, setPasswordError] = React.useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isDisabled, setIsDisabled] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [isPrivacyAgreed, setIsPrivacyAgreed] = React.useState(false);

  React.useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [rolesRes, collegesRes] = await Promise.all([
          axios.get("userroles/"),
          axios.get("departmentsbycollege/"),
        ]);

        setOptions({
          roles: rolesRes.data,
          colleges: collegesRes.data,
        });
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch options:", error);
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  React.useEffect(() => {
    const regFaculty = /^3/;
    const regStudent = /^20/;

    const determineRole = () => {
      const role = options.roles.find((r) =>
        regFaculty.test(userData.idNumber)
          ? r.designation.toLowerCase() === "faculty"
          : regStudent.test(userData.idNumber)
          ? r.designation.toLowerCase() === "student"
          : null
      );
      if (role) {
        setUserData((prev) => ({
          ...prev,
          selectedRole: role.id,
        }));
      }
    };

    determineRole();
  }, [userData.idNumber, options.roles]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setUserData((prevData) => {
      const updatedData = { ...prevData, [name]: value };

      if (name === "selectedDepartment") {
        // Find the selected department to get the college
        const selectedDept = options.colleges
          .flatMap((college) => college.departments)
          .find((dept) => dept.id === parseInt(value));
        updatedData.selectedCollege = selectedDept
          ? options.colleges.find(
              (college) => college.id === selectedDept.collegeName
            )?.collegeName || ""
          : "";
      }

      return updatedData;
    });
  };

  const textFieldStyle = {
    "& .MuiInputLabel-asterisk": {
      color: "red", // Custom asterisk color
    },
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsDisabled(true);
    setLoading(true);

    if (userData.password !== userData.confirmPassword) {
      setPasswordError("Passwords do not match.");
      setIsDisabled(false);
      setLoading(false);
      return;
    } else {
      setPasswordError("");
    }

    if (!userData.selectedDepartment) {
      toast.error("Please Select Department", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      setIsDisabled(false);
      setLoading(false);
      return;
    }

    if (!isPrivacyAgreed) {
      toast.error("You must agree to the Data Privacy Act to proceed.", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      setIsDisabled(false);
      setLoading(false);
      return;
    }

    const userDataToSend = {
      first_name: userData.firstName,
      last_name: userData.lastName,
      middle_name: userData.middleName,
      idNumber: userData.idNumber,
      email: userData.email,
      password: userData.password,
      confirm_password: userData.confirmPassword,
      role: userData.selectedRole || null,
      department: userData.selectedDepartment || null,
    };

    try {
      const response = await axios.post("auth/users/", userDataToSend, {
        headers: { "Content-Type": "application/json" },
      });
      setIsDisabled(false);
      setLoading(false);
      toast.success(
        "Registration successful! Proccessing Time to activate your Account is 2-5 days",
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
      setUserData({
        firstName: "",
        lastName: "",
        middleName: "",
        idNumber: "",
        email: "",
        password: "",
        confirmPassword: "",
        selectedDepartment: "",
      });
      setIsPrivacyAgreed(false);
    } catch (error) {
      setIsDisabled(false);
      setLoading(false);
      const errorResponse = error.response
        ? error.response.data
        : error.message;
      if (typeof errorResponse === "object") {
        const errorMessages = Object.keys(errorResponse)
          .map((key) => `${key}: ${errorResponse[key].join(", ")}`)
          .join("\n");
        toast.error(`Registration failed:\n${errorMessages}`, {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      } else {
        toast.error(`Registration failed: ${errorResponse}`, {
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
      <Grid
        item
        xs={12}
        sm={8}
        md={6}
        lg={4}
        component={Paper}
        square
        sx={{
          height: "88vh",
          backgroundColor: "rgba(255, 255, 255, 0.7)",
          borderRadius: "8px",
          overflow: "scroll",
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
            alt="Logo"
          />
          <Typography variant="h5">Sign up</Typography>
          <Box
            component="form"
            noValidate
            onSubmit={handleSubmit}
            sx={{ mt: 1, px: 3 }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  autoComplete="given-name"
                  name="firstName"
                  required
                  fullWidth
                  id="firstName"
                  label="First Name"
                  autoFocus
                  value={userData.firstName}
                  onChange={handleInputChange}
                  sx={textFieldStyle}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="middleName"
                  label="Middle Name"
                  name="middleName"
                  value={userData.middleName}
                  onChange={handleInputChange}
                  sx={textFieldStyle}
                />
              </Grid>
            </Grid>
            <TextField
              required
              fullWidth
              id="lastName"
              label="Last Name"
              name="lastName"
              autoComplete="family-name"
              value={userData.lastName}
              onChange={handleInputChange}
              sx={textFieldStyle}
            />
            <TextField
              margin="dense"
              required
              fullWidth
              id="idNumber"
              label="ID Number"
              name="idNumber"
              value={userData.idNumber}
              onChange={handleInputChange}
              sx={textFieldStyle}
            />
            <TextField
              margin="dense"
              required
              fullWidth
              id="email"
              type={showPassword ? "text" : "password"}
              label="Email Address"
              name="email"
              autoComplete="email"
              value={userData.email}
              onChange={handleInputChange}
              sx={textFieldStyle}
            />
            <TextField
              margin="dense"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="new-password"
              value={userData.password}
              onChange={handleInputChange}
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
            />
            <TextField
              margin="dense"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type={showPassword ? "text" : "password"}
              id="confirmPassword"
              autoComplete="new-password"
              value={userData.confirmPassword}
              onChange={handleInputChange}
              sx={textFieldStyle}
              error={Boolean(passwordError)}
              helperText={passwordError}
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
            />

            <Select
              name="selectedDepartment"
              value={userData.selectedDepartment}
              onChange={handleInputChange}
              fullWidth
              required
              margin="dense"
              id="department"
              displayEmpty
            >
              <MenuItem value="" disabled>
                Select Department
              </MenuItem>
              {options.colleges.flatMap((college) =>
                college.departments.map((department) => (
                  <MenuItem key={department.id} value={department.id}>
                    {department.departmentName}
                  </MenuItem>
                ))
              )}
            </Select>

            <TextField
              margin="dense"
              fullWidth
              id="college"
              label="College"
              value={
                options.colleges.find((college) =>
                  college.departments.some(
                    (dept) => dept.id === parseInt(userData.selectedDepartment)
                  )
                )?.collegeName || ""
              }
              InputProps={{ readOnly: true }}
              sx={{ marginTop: 1 }}
            />
            {/* Privacy Checkbox */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={isPrivacyAgreed}
                  onChange={(e) => setIsPrivacyAgreed(e.target.checked)}
                  name="privacyPolicy"
                  color="primary"
                />
              }
              label="I agree to the Data Privacy Act of 2012"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isDisabled}
              sx={{ mt: 3, mb: 2, backgroundColor: "#191750" }}
            >
              Sign Up
            </Button>

            <Grid container>
              <Grid item>
                <Link
                  href="#"
                  variant="body2"
                  onClick={toggleForm}
                  sx={{ color: "black" }}
                >
                  {"Already have an account? Sign In"}
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Grid>
      <ToastContainer />
    </ThemeProvider>
  );
}
