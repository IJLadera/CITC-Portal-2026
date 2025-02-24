import Editprofile from "../../Components/profile/editprofile";
import Profileloadingskeleton from "../../Components/profile/profileloadingskeleton";
import React, { useEffect, useState } from "react";
import http from "../../../../../../../http";
import Cookies from "js-cookie";
import { useNavigate, useParams } from "react-router-dom";
import {
  Grid,
  Box,
  Typography,
  CircularProgress,
  Avatar,
  Divider,
  Button,
  IconButton,
  // CloseIcon,
} from "@mui/material";
import CustomDeleteButton from "../../Components/customdeletebutton";
import { DeleteConfirmModal } from "../../Components/DeleteConfirmModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { User, College, YearLevel } from "../../Components/models";

// interface User {
//   id: number;
//   username: string;
//   idNumber: string;
//   email: string;
//   first_name: string;
//   last_name: string;
//   middle_name: string;
//   role: {
//     designation: string;
//   };
//   department: {
//     departmentName: string;
//     collegeName: number;
//   };
//   section: {
//     sectionName: string;
//     tblYearLevel: number;
//   };
//   organization: {
//     studentOrgType: string;
//     studentOrgName: string;
//   };
//   image: string;
// } 

// interface College {
//   id: number;
//   collegeName: string;
// }

// interface YearLevel {
//   id: number;
//   yearLevel: string;
// }

export default function UserDetails() {
  const { id } = useParams(); // Extract user ID from URL parameters
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editProfile, setEditProfile] = useState(false);
  const [colleges, setColleges] = useState<College[]>([]);
  const [yearLevels, setYearLevels] = useState<YearLevel[]>([])
  const [isStaff, setIsStaff] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();
  const token = Cookies.get("auth_token");
  const [openModal, setOpenModal] = useState(false);

  const fetchProfile = async () => {
    try {
      const response = await http.get(`/users/${id}/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      setProfile(response.data);
    } catch (error) {
      setError("Error fetching user details");
    } finally {
      setLoading(false);
    }
  };

  const fetchColleges = async () => {
    try {
      const response = await http.get("colleges/");
      setColleges(response.data);
    } catch (error) {
      console.error("Error fetching colleges:", error);
    }
  };

  const fetchYearLevel = async () => {
    try {
      const response = await http.get("yearlevel/");
      setYearLevels(response.data);
    } catch (error) {
      console.error("Error fetching colleges:", error);
    }
  };

  const fetchUserRole = async () => {
    try {
      const response = await http.get("auth/users/me/", {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      setIsStaff(response.data.is_staff);
      setCurrentUser(response.data)
    } catch (error) {
      setError("Error fetching user role");
    }
  };

  useEffect(() => {

    if (editProfile === false) {
      fetchProfile();
      fetchProfile();
      fetchColleges();
      fetchUserRole();
      fetchYearLevel();
    }
  }, [id, token, editProfile]);

  const handleClick = (bol: any) => {
    setEditProfile(bol);
  };

  const handleDelete = async () => {
    try {
      await http.delete(`users/${id}/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      toast.success('User deleted successfully', {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      setOpenModal(false)
      setTimeout(() => {
        navigate("/auth/app/dashboard");
      }, 2000);
    } catch (error) {
      toast.error('Something Wrong in Deleting User. Please try again later.', {
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
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress color="inherit" />
      </Box>
    );
  }

  if (error) {
    return <Profileloadingskeleton />;
  }

  const college = colleges?.find(
    (college) => college.id === profile?.department?.college
  );

  const yearLevel = yearLevels?.find((year: YearLevel) => year.id === profile?.section?.tblYearLevel.id);


  return (
    <Box
      sx={{
        flexGrow: 1,
        px: { xs: "2vw", sm: "5vw" },
        py: { xs: "2vh", sm: "5vh" },
        bgcolor: "white",
        color: "black",
        border: "2px solid #FAB417",
        borderRadius: "8px",
        minHeight: "100vh",
      }}
    >
      {!editProfile ? (
        profile ? (
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
                src={profile.image}
                // alt={profile.username}
                sx={{
                  width: { xs: 150, sm: 200 },
                  height: { xs: 150, sm: 200 },
                  mb: 2,
                  border: "2px solid #FAB417",
                }}
              />
              <Typography variant="h6" gutterBottom>
                {profile.username}
              </Typography>
              <Typography>ID: {profile.idNumber}</Typography>
              <Typography>Email: {profile.email}</Typography>
              <Box className="mt-4 flex space-x-3 lg:mt-6">
                <Box
                  onClick={() => handleClick(true)}
                  className="cursor-pointer inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:border-gray-700 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
                >
                  Edit Profile
                </Box>
                <CustomDeleteButton onClick={() => setOpenModal(true)}>
                  Delete User
                </CustomDeleteButton>
                <DeleteConfirmModal
                  name="User"
                  openModal={openModal}
                  setOpenModal={setOpenModal}
                  handleDelete={handleDelete} // Pass handleDelete as a prop
                  type="delete"
                  remark=""
                  setRemark={() => {}}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <Box sx={{ p: 3, height: "100%" }}>
                <Typography variant="h5" gutterBottom>
                  Personal Information
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1">
                    First Name: <strong>{profile.first_name}</strong>
                  </Typography>
                  <Divider
                    sx={{ my: 2, backgroundColor: "#FAB417", borderWidth: 1 }}
                  />
                  <Typography variant="body1">
                    Last Name: <strong>{profile.last_name}</strong>
                  </Typography>
                  <Divider
                    sx={{ my: 2, backgroundColor: "#FAB417", borderWidth: 1 }}
                  />
                  <Typography variant="body1">
                    Middle Name: <strong>{profile.middle_name}</strong>
                  </Typography>
                  <Divider
                    sx={{ my: 2, backgroundColor: "#FAB417", borderWidth: 1 }}
                  />
                  <Typography variant="body1">
                    Role: <strong>{profile.role?.name}</strong>
                  </Typography>
                  <Divider
                    sx={{ my: 2, backgroundColor: "#FAB417", borderWidth: 1 }}
                  />
                  <Typography variant="body1">
                    College:{" "}
                    <strong>{college?.name || "No College"}</strong>
                  </Typography>
                  <Divider
                    sx={{ my: 2, backgroundColor: "#FAB417", borderWidth: 1 }}
                  />
                  <Typography variant="body1">
                    Department:{" "}
                    <strong>
                      {profile.department?.name || "No Department"}
                    </strong>
                  </Typography>

                  {profile.section?.tblYearLevel ? (
                    <Box>
                      <Divider
                        sx={{
                          my: 2,
                          backgroundColor: "#FAB417",
                          borderWidth: 1,
                        }}
                      />
                      <Typography variant="body1">
                        Year Level:{" "}
                        <strong>
                          {yearLevel?.yearLevel ||
                            "Year Level Unavailable"}
                        </strong>
                      </Typography>
                    </Box>
                  ) : (
                    <Box></Box>
                  )}

                  {profile.section ? (
                    <Box>
                      <Divider
                        sx={{
                          my: 2,
                          backgroundColor: "#FAB417",
                          borderWidth: 1,
                        }}
                      />
                      <Typography variant="body1">
                        Section:{" "}
                        <strong>
                          {profile.section?.section ||
                            "Section Unavailable"}
                        </strong>
                      </Typography>
                    </Box>
                  ) : null}

                  {profile.organization ? (
                    <Box>
                      <Divider
                        sx={{
                          my: 2,
                          backgroundColor: "#FAB417",
                          borderWidth: 1,
                        }}
                      />
                      <Typography variant="body1">
                        Organization Type:{" "}
                        <strong>
                          {profile.organization?.studentOrgType ||
                            "Organization Unavailable"}
                        </strong>
                      </Typography>
                      <Divider
                        sx={{
                          my: 2,
                          backgroundColor: "#FAB417",
                          borderWidth: 1,
                        }}
                      />
                      <Typography variant="body1">
                        Organization Name:{" "}
                        <strong>
                          {profile.organization?.studentOrgName ||
                            "Organization Unavailable"}
                        </strong>
                      </Typography>
                    </Box>
                  ) : null}
                </Box>
              </Box>
            </Grid>
            {/* {isStaff && (
              <Box mt={2}>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleDelete}
                >
                  Delete
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleClick(true)}
                  sx={{ ml: 2 }}
                >
                  Edit
                </Button>
              </Box>
            )} */}
          </Grid>
        ) : (
          <Profileloadingskeleton />
        )
      ) : (
        <Box>
          <Editprofile
            handleClickEdit={handleClick}
            profile={profile}
            collegeParams={college?.name}
            currentUser={currentUser}
            yearLevelParams={yearLevel?.yearLevel}
          />
          <ToastContainer />
        </Box>
      )}
      <ToastContainer />
    </Box>
  );
}
