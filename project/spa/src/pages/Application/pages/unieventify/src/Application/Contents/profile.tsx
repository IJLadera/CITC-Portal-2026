import Editprofile from "../../Components/profile/editprofile";
import Profileloadingskeleton from "../../Components/profile/profileloadingskeleton";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import React, { useEffect, useState } from "react";
import http from "../../../../../../../http";
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
} from "@mui/material";
import SideBar from "../../Components/sidebar";

import {User, College, YearLevel} from "../../Components/models";
import { useAppSelector } from "../../../../../../../hooks";
import { fetchUserProfileApi, fetchCollegesesApi, fetchYearLevelsApi } from "../../../../../../../api"


export default function Profile() {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const token = useAppSelector(state => state.auth.token)
  const [editProfile, setEditProfile] = useState(false);
  const [colleges, setColleges] = useState<College[]>([]);
  const [yearLevels, setYearLevels] = useState<YearLevel | null>(null);

  const fetchProfile = async () => {
    try {
      if (!token) throw new Error("No authentication token found");
  
      const userProfile = await fetchUserProfileApi(); // Fetch user profile
  
      // Find the role with the lowest rank (highest priority)
      const highestRankRole = userProfile.roles.reduce((minRole: any, currentRole: any) => {
        return currentRole.rank < minRole.rank ? currentRole : minRole;
      }, userProfile.roles[0]); // Start with the first role as the minimum
      
      // Assuming you set the profile state to store the highest rank role
      setProfile({
        ...userProfile,
        highestRankRole,  // Add the highest rank role to the profile
      });
    } catch (error: any) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  // const highestRankRole = profile?.roles?.find(role => role.rank === 1);

  useEffect(() => {
    if (!editProfile) {
      fetchProfile(); // Call fetchProfile when editProfile is false
    }

    // Fetch colleges using fetchColleges
    const fetchCollegesData = async () => {
      try {
        const collegesData = await fetchCollegesesApi(); // Assuming fetchColleges returns a promise
        setColleges(collegesData); // Set colleges state with the fetched data
      } catch (error) {
        console.error("Error fetching colleges:", error); // Handle error
      }
    };

    // Fetch year levels using fetchYearLevels
    const fetchYearLevelsData = async () => {
      try {
        const yearLevelsData = await fetchYearLevelsApi(); // Assuming fetchYearLevels returns a promise
        setYearLevels(yearLevelsData); // Set year levels state with the fetched data
      } catch (error) {
        console.error("Error fetching year levels:", error); // Handle error
      }
    };

    // Call the fetch functions
    fetchCollegesData();
    fetchYearLevelsData();
  }, [editProfile]); // This effect runs when editProfile changes

  const college = colleges?.find(
    (college) => college.id === profile?.department?.college
  );

  const yearLevel = yearLevels?.find(
    (year: any) => year.id === profile?.section?.tblYearLevel
  );

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

  const handleClick = (bol: boolean) => {
    setEditProfile(bol);
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        px: { xs: "2vw", sm: "5vw" },
        py: { xs: "2vh", sm: "5vh" },
        bgcolor: "white",
        color: "black",
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
                alt={profile.username}
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
                <a
                  href="change_password"
                  className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:border-gray-700 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
                >
                  Change Password
                </a>
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
                    Role: <strong>{profile.highestRankRole.name}</strong>
                    {/* {highestRankRole ? (
                        <p>Highest Role: {highestRankRole.name} (Rank {highestRankRole.rank})</p>
                      ) : (
                        <p>No highest rank role found</p>
                      )} */}
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
                          {yearLevel?.yearLevel || "Year Level Unavailable"}
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
                  ) : (
                    <Box></Box>
                  )}
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
                  ) : (
                    <Box></Box>
                  )}
                </Box>
              </Box>
            </Grid>
            <ToastContainer />
          </Grid>
        ) : (
          // <Typography>No profile data available.</Typography>
          <Profileloadingskeleton />
        )
      ) : (
        <Box>
          <Editprofile
            handleClickEdit={handleClick}
            profile={profile}
            collegeParams={college?.name}
            yearLevelParams={yearLevel?.yearLevel}
            currentUser={profile}
          />
          <ToastContainer />
        </Box>
      )}
    </Box>
  );
}
