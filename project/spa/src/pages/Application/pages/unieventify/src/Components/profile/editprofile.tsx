import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import React, { useEffect, useState } from "react";
import http from "../../../../../../../http"
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import {
  Grid,
  Box,
  Typography,
  CircularProgress,
  Avatar,
  Alert,
  Paper,
  Divider,
  Switch,
} from "@mui/material";
import { TextInput, Button } from "flowbite-react";
import Profileloadingskeleton from "./profileloadingskeleton";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";

interface EditprofileProps {
  handleClickEdit: (value: boolean) => void;
  profile: any;
  collegeParams: string | undefined;
  currentUser: any;
  yearLevelParams: string | undefined;
}

interface Department {
  id: number;
  name: string;
  college: College[];
}

interface College {
  id: number;
  name: string;
}

interface Role {
  id: number;
  designation: string;
}

// interface Department{
//   id: number;
//   departmentName: string;
// }

interface Section {
  id: number;
  sectionName: string;
  tblYearLevel: number;
}

interface YearLevel {
  id: number;
  yearLevel: string;
}

interface Organization {
  id: number;
  studentOrgName: string;
}

interface Error {
  message: string;
}

export default function Editprofile({
  handleClickEdit,
  profile,
  collegeParams,
  currentUser,
  yearLevelParams,
}: EditprofileProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const navigate = useNavigate();
  const token = Cookies.get("auth_token");
  const [colleges, setColleges] = useState<College[]>([]);
  const [roles, setRole] = useState<Role[]>([]);
  const [roleName, setRoleName] = useState([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentName, setDepartmentName] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [sectionName, setSectionName] = useState([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationName, setOrganizationName] = useState([]);
  const [yearLevel, setYearLevel] = useState<YearLevel[]>([]);
  const [selectedCollegeName, setSelectedCollegeName] = useState(collegeParams);
  const [selectedRoleName, setSelectedRoleName] = useState(
    profile.role?.designation
  );
  const [selectedDepartmentName, setSelectedDepartmentName] = useState(
    profile.department?.name
  );
  const [selectedSectionName, setSelectedSectionName] = useState(
    profile.section?.sectionName
  );
  const [selectedYearLevelName, setSelectedYearLevelName] =
    useState(yearLevelParams);
  const [selectedOrgName, setSelectedOrgName] = useState(
    profile.organization?.studentOrgName
  );
  const [editProfileInfo, setEditProfileInfo] = useState({
    email: profile.email,
    username: profile.username,
    first_name: profile.first_name,
    last_name: profile.last_name,
    middle_name: profile.middle_name,
    idNumber: profile.idNumber,
    role: profile.role?.id || null,
    college: profile.department?.college || null,
    department: profile.department?.id || null,
    yearLevel: profile.section?.tblYearLevel || null,
    section: profile.section?.id || null,
    organization: profile.organization?.id || null,
    image: profile.image,
    is_active: profile.is_active,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDisabled, setIsDisabled] = useState(false);

  useEffect(() => {
    http
      .get("unieventify/userroles/")
      .then((response) => {
        setRole(response.data);
        const designations = response.data.map((role: any) => role.designation);
        setRoleName(designations);
      })
      .catch((error) => console.log(error));

    http
      .get("unieventify/colleges/")
      .then((response) => {
        setColleges(response.data);
      })
      .catch((error) => console.log(error));

    http
      .get("unieventify/departments/")
      .then((response) => {
        setDepartments(response.data);
        // Filter out any undefined values and make sure departmentName is a string
        const designations = response.data
          .filter((department: any) => department && department.name)
          .map((department: any) => department.name);
        setDepartmentName(designations);
      })
      .catch((error) => console.log(error));

    http
      .get("unieventify/sections/")
      .then((response) => {
        setSections(response.data);
        const designations = response.data.map(
          (section: any) => section.sectionName
        );
        setSectionName(designations);
      })
      .catch((error) => console.log(error));

    http
      .get("unieventify/studentorgs/")
      .then((response) => {
        setOrganizations(response.data);
        const designations = response.data.map((org: any) => org.studentOrgName);
        setOrganizationName(designations);
      })
      .catch((error) => console.log(error));

    http
      .get("unieventify/yearlevel/")
      .then((response) => {
        setYearLevel(response.data);
      })
      .catch((error) => console.log(error));
  }, []);

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          bgcolor: "#191750",
        }}
      >
        <Alert severity="error">Error fetching profile: {error.message}</Alert>
      </Box>
    );
  }

  const handleRoleChange = (value: any) => {
    setSelectedRoleName(value);
    // Find the role by designation to get its ID
    const role = roles.find((role) => role.designation === value);
    // Set the ID to state
    if (role) {
      setEditProfileInfo({ ...editProfileInfo, role: role.id });
    }
  };

  const handleDepartmentsChange = (value: any) => {
    setSelectedDepartmentName(value);
    // Find the department by departmentName to get its ID
    const department = departments.find(
      (department) => department.name === value
    );
    // Set the ID and college ID to state
    if (department) {
      setEditProfileInfo({
        ...editProfileInfo,
        department: department.id,
        college: department?.college,
      });
      const college = colleges.find(
        (college: any) => college.id === department?.college
      );
      setSelectedCollegeName(college?.name);
    }
  };

  const handleSectionsChange = (value: any) => {
    setSelectedSectionName(value);
    // Find the role by designation to get its ID
    const section = sections.find((section) => section.sectionName === value);
    // Set the ID to state
    if (section) {
      setEditProfileInfo({
        ...editProfileInfo,
        section: section.id,
        yearLevel: section.tblYearLevel,
      });
      const yearLevels = yearLevel.find(
        (year) => year.id === section?.tblYearLevel
      );
      setSelectedYearLevelName(yearLevels?.yearLevel || '');
    }
  };

  const handleOrganizationsChange = (value: string) => {
    setSelectedOrgName(value);

    // Find the role by designation to get its ID
    const org = organizations.find((org) => org.studentOrgName === value);
    // Set the ID to state
    if (org) {
      setEditProfileInfo({ ...editProfileInfo, organization: org.id });
    }
  };

  const handleClickCancel = () => {
    handleClickEdit(false);
  };

  const handleActiveChange = (event: any) => {
    setEditProfileInfo({ ...editProfileInfo, is_active: event.target.checked });
  };

  const handleImageChange = (e: any) => {
    const file = e.target.files[0];

    // Check if a file was selected
    if (file) {
      setSelectedFile(file);
      setEditProfileInfo({
        ...editProfileInfo,
        image: URL.createObjectURL(file),
      }); // Create a preview URL for the selected image
    } else {
      // Handle the case where no file is selected or the user cancels
      setSelectedFile(null);
      setEditProfileInfo({ ...editProfileInfo, image: profile.image });
    }
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    setIsDisabled(true);
    setLoading(true);

    const formData = new FormData();
    formData.append("email", editProfileInfo.email);
    formData.append("username", editProfileInfo.username);
    formData.append("first_name", editProfileInfo.first_name);
    formData.append("last_name", editProfileInfo.last_name);
    formData.append("middle_name", editProfileInfo.middle_name);
    formData.append("is_active", editProfileInfo.is_active);

    if (editProfileInfo.idNumber)
      formData.append("idNumber", editProfileInfo.idNumber);
    if (editProfileInfo.role) formData.append("role", editProfileInfo.role);
    if (editProfileInfo.department)
      formData.append("department", editProfileInfo.department);
    if (editProfileInfo.section)
      formData.append("section", editProfileInfo.section);
    if (editProfileInfo.organization)
      formData.append("organization", editProfileInfo.organization);
    if (selectedFile) formData.append("image", selectedFile);

    http
      .patch(`auth/update_profile/`, formData, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        setIsDisabled(false);
        setLoading(false);
        handleClickEdit(false);
      })
      .catch((error) => {
        console.log(error.response.data); // Log detailed error response
        setIsDisabled(false);
        setLoading(false);
      });
  };

  return (
    <Box>
      {profile ? (
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
            <Avatar
              src={editProfileInfo.image}
              alt={profile.username}
              sx={{
                width: { xs: 150, sm: 200 },
                height: { xs: 150, sm: 200 },
                mb: 2,
                border: "2px solid #FAB417",
              }}
            />
            <Typography>Upload Image</Typography>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mt-2"
            />
            <Typography variant="h6" gutterBottom>
              {profile.username}
            </Typography>
            <Typography>ID: {profile.idNumber}</Typography>
            <Typography>Email: {profile.email}</Typography>
            <Box className="mt-4 flex space-x-3 lg:mt-6">
              <Button
                color="light"
                onClick={handleSubmit}
                disabled={isDisabled}
                isProcessing={loading}
              >
                Submit
              </Button>
              <Box
                onClick={handleClickCancel}
                className=" cursor-pointer inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:border-gray-700 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
              >
                Cancel
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={8}>
            <Box
              sx={{
                p: 3,
                height: "100%",
              }}
            >
              <Typography variant="h5" gutterBottom>
                Personal Information
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="body1">First Name:</Typography>
                  <TextInput
                    id="first_name"
                    type="text"
                    placeholder="First Name"
                    value={editProfileInfo.first_name || ""}
                    disabled={isDisabled}
                    onChange={(text) =>
                      setEditProfileInfo({
                        ...editProfileInfo,
                        first_name: text.target.value,
                      })
                    }
                  />
                </Box>
                <Divider
                  sx={{ my: 2, backgroundColor: "#FAB417", borderWidth: 1 }}
                />
                <Box>
                  <Typography variant="body1">Last Name: </Typography>
                  <TextInput
                    id="last_name"
                    type="text"
                    placeholder="Last Name"
                    value={editProfileInfo.last_name || ""}
                    disabled={isDisabled}
                    onChange={(text) =>
                      setEditProfileInfo({
                        ...editProfileInfo,
                        last_name: text.target.value,
                      })
                    }
                  />
                </Box>
                <Divider
                  sx={{ my: 2, backgroundColor: "#FAB417", borderWidth: 1 }}
                />
                <Box>
                  <Typography variant="body1">Middle Name: </Typography>
                  <TextInput
                    id="middle_name"
                    type="text"
                    placeholder="Middle Name"
                    value={editProfileInfo.middle_name || ""}
                    disabled={isDisabled}
                    onChange={(text) =>
                      setEditProfileInfo({
                        ...editProfileInfo,
                        middle_name: text.target.value,
                      })
                    }
                  />
                </Box>
                {currentUser?.is_staff ? (
                  <Box>
                    <Divider
                      sx={{ my: 2, backgroundColor: "#FAB417", borderWidth: 1 }}
                    />
                    <Box>
                      <Typography variant="body1">ID Number: </Typography>
                      <TextInput
                        id="id_number"
                        type="text"
                        placeholder="ID Number"
                        value={editProfileInfo.idNumber || ""}
                        disabled={isDisabled}
                        onChange={(text) =>
                          setEditProfileInfo({
                            ...editProfileInfo,
                            idNumber: text.target.value,
                          })
                        }
                      />
                    </Box>
                    <Divider
                      sx={{ my: 2, backgroundColor: "#FAB417", borderWidth: 1 }}
                    />
                    <Box>
                      <Typography variant="body1">Role:</Typography>
                      <Autocomplete
                        disablePortal
                        id="role"
                        options={roleName}
                        disabled={isDisabled}
                        onChange={(event, newValue) =>
                          handleRoleChange(newValue)
                        }
                        value={selectedRoleName}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "8px", // Adjust the border-radius
                            height: "43px", // Set the desired height
                            "& .MuiInputBase-input": {
                              height: "auto", // Ensure the input text aligns properly within the field
                              padding: "10px", // Adjust the padding if needed
                            },
                          },
                        }}
                        renderInput={(params) => (
                          <TextField {...params} label=" " />
                        )}
                      />
                    </Box>
                  </Box>
                ) : (
                  <Box></Box>
                )}
                <Divider
                  sx={{ my: 2, backgroundColor: "#FAB417", borderWidth: 1 }}
                />
                <Box>
                  <Typography variant="body1">Department:</Typography>
                  <Autocomplete
                    disablePortal
                    id="department"
                    options={departmentName || []} // Add fallback empty array
                    disabled={isDisabled}
                    onChange={(event, newValue) => handleDepartmentsChange(newValue)}
                    value={selectedDepartmentName || null} // Add null fallback
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        height: "43px",
                        "& .MuiInputBase-input": {
                          height: "auto",
                          padding: "10px",
                        },
                      },
                    }}
                    renderInput={(params) => <TextField {...params} label=" " />}
                  />
                </Box>
                <Divider
                  sx={{ my: 2, backgroundColor: "#FAB417", borderWidth: 1 }}
                />
                <Typography variant="body1">
                  College: {selectedCollegeName || "Not Available"}
                </Typography>
                <Divider
                  sx={{ my: 2, backgroundColor: "#FAB417", borderWidth: 1 }}
                />
                {profile?.role?.designation === "Student" && (
                  <Box>
                    <Box>
                      <Typography variant="body1">Section:</Typography>
                      <Autocomplete
                        disablePortal
                        id="section"
                        options={sectionName}
                        disabled={isDisabled}
                        onChange={(event, newValue) =>
                          handleSectionsChange(newValue)
                        }
                        value={selectedSectionName}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "8px", // Adjust the border-radius
                            height: "43px", // Set the desired height
                            "& .MuiInputBase-input": {
                              height: "auto", // Ensure the input text aligns properly within the field
                              padding: "10px", // Adjust the padding if needed
                            },
                          },
                        }}
                        renderInput={(params) => (
                          <TextField {...params} label=" " />
                        )}
                      />
                    </Box>
                    <Divider
                      sx={{
                        my: 2,
                        backgroundColor: "#FAB417",
                        borderWidth: 1,
                      }}
                    />
                    <Typography variant="body1">
                      Year Level: {selectedYearLevelName || "Not Available"}
                    </Typography>
                    <Divider
                      sx={{
                        my: 2,
                        backgroundColor: "#FAB417",
                        borderWidth: 1,
                      }}
                    />
                  </Box>
                )}
                {currentUser?.is_staff ? (
                  <Box>
                    <Divider
                      sx={{ my: 2, backgroundColor: "#FAB417", borderWidth: 1 }}
                    />
                    <Box display="flex" alignItems="center" mt={2}>
                      <Typography variant="body1" mr={1}>
                        Active Status:
                      </Typography>
                      <Switch
                        checked={editProfileInfo.is_active}
                        onChange={handleActiveChange}
                        color="primary"
                        inputProps={{ "aria-label": "active status" }}
                      />
                    </Box>
                  </Box>
                ) : (
                  <Box></Box>
                )}
              </Box>
            </Box>
          </Grid>
          <ToastContainer />
        </Grid>
      ) : (
        <Profileloadingskeleton />
      )}
    </Box>
  );
}
