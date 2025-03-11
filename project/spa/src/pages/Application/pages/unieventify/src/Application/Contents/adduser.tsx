import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Container,
  Grid,
  Typography,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";
import http from "../../../../../../../http";
import Cookies from "js-cookie";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Department, Role, College } from "../../Components/models";

interface FormData {
  email: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  id_number: string;
  role: string;
  department: string;
  college: string;
  yearLevel: string;
  section: string;
  organization: string;
  image: null | File;
  isStaff: boolean;
  password: string;
  re_password: string;
}

export default function AddUser() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    first_name: "",
    last_name: "",
    middle_name: "",
    id_number: "",
    role: "",
    department: "",
    college: "",
    yearLevel: "",
    section: "",
    organization: "",
    image: null,
    isStaff: false,
    password: "",
    re_password: "",
  });

  const [roles, setRoles] = useState<Role[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const authToken = Cookies.get("auth_token");
        const headers = { Authorization: `Token ${authToken}` };

        // Check admin credentials
        const userResponse = await http.get("auth/users/me/", { headers });
        setIsAdmin(userResponse.data.is_staff);

        if (!userResponse.data.is_staff) {
          toast.error("You do not have permission to access this page.");
          setLoading(false);
          return;
        }

        // Fetch roles, colleges, and departments
        const [rolesResponse, collegesResponse] = await Promise.all([
          http.get("unieventify/userroles/", { headers }),
          http.get("unieventify/departmentsbycollege/", {
            headers,
          }),
        ]);

        setRoles(rolesResponse.data);
        setColleges(collegesResponse.data);
        setDepartments(
          collegesResponse.data.flatMap((college: any) => college.departments)
        ); // Flatten departments from colleges
      } catch (err) {
        console.error("Error fetching data", err);
        toast.error("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    if (formData.department) {
      const department = departments.find(
        (dept: any) => dept.id === formData.department
      );
      if (department) {
        const college = colleges.find(
          (college) => college.id === department.college
        );
        setFormData((prevData) => ({
          ...prevData,
          college: college ? college.name : "",
        }));
      }
    }
  }, [formData.department, departments, colleges]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e: any) => {
    setFormData({
      ...formData,
      image: e.target.files[0],
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  
    if (formData.password !== formData.re_password) {
      toast.error("Passwords do not match.");
      return;
    }
  
    const data = new FormData();
    (Object.keys(formData) as Array<keyof FormData>).forEach((key) => {
      const value = formData[key];
      if (value !== null && value !== undefined) {
        data.append(key, value as string | Blob);
      }
    });
  
    const authToken = Cookies.get("auth_token");
    const headers = { Authorization: `Token ${authToken}` };
  
    http
      .post("auth/users/", data, { headers })
      .then((response) => {
        console.log("User added successfully", response.data);
        toast.success("User added successfully!");
        setFormData({
          email: "",
          first_name: "",
          last_name: "",
          middle_name: "",
          id_number: "",
          role: "",
          department: "",
          college: "",
          yearLevel: "",
          section: "",
          organization: "",
          image: null,
          isStaff: false,
          password: "",
          re_password: "",
        });
      })
      .catch((error) => {
        console.error("There was an error adding the user!", error);
        toast.error("Failed to add user.");
      });
  };
  

  if (loading) return <CircularProgress />;

  if (!isAdmin)
    return (
      <Typography variant="h6" color="error">
        Access Denied
      </Typography>
    );

  return (
    <Container maxWidth="md" style={{backgroundColor: "white", padding: "50px", borderRadius: "3%"}} className="col-span-3">
      <Typography variant="h4" gutterBottom>
        Add New User
      </Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Middle Name"
              name="middle_name"
              value={formData.middle_name}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="ID Number"
              name="id_number"
              value={formData.id_number}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                {roles.map((role) => (
                  <MenuItem key={role.uuid} value={role.uuid}>
                    {role.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
              >
                {departments.map((department) => (
                  <MenuItem key={department.id} value={department.id}>
                    {department.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="College"
              name="college"
              value={formData.college}
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Confirm Password"
              name="re_password"
              type="password"
              value={formData.re_password}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <input accept="image/*" type="file" onChange={handleFileChange} />
          </Grid>
          <Grid item xs={12}>
            <FormControl>
              <label>
                <input
                  type="checkbox"
                  name="isStaff"
                  checked={formData.isStaff}
                  onChange={() =>
                    setFormData({ ...formData, isStaff: !formData.isStaff })
                  }
                />
                Is Staff
              </label>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Box textAlign="center">
              <Button type="submit" variant="contained" color="primary">
                Add User
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
      <ToastContainer />
    </Container>
  );
}
