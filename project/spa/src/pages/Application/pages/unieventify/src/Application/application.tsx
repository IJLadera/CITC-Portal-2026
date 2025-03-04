import SideBar from "../Components/sidebar";
import BaseTheme from "../Components/baseTheme";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import http from "../../../../../../http"; // Replace with your Axios instance
import { CircularProgress, Box } from "@mui/material";
import { useAppSelector } from "../../../../../../hooks";

export default function UniEventifyApplication() {
  const location = useLocation();
  const token = useAppSelector(state => state.auth.token)
  const [isAuthenticated, setIsAuthenticated] = useState<null | boolean>(null);
  console.log("isauthenticated",token)

  useEffect(() => {
    if (token) {
      http
        .get("auth/users/me/", {
          headers: {
            Authorization: `Token ${token}`,
          },
        })
        .then(() => {
          setIsAuthenticated(true);
        })
        .catch((error) => {
          if (error.response && error.response.status === 401) {
            Cookies.remove("auth_token"); // Remove the token from cookies
            setIsAuthenticated(false);
          }
        });
    } else {
      setIsAuthenticated(false);
    }
  }, [token]);

  if (isAuthenticated === null) {
    // Show a loading state while checking authentication
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

  return isAuthenticated ? (
    <BaseTheme>
      <SideBar />
      <div
        className="h-full w-full flex justify-center"
      >
        <Outlet />
      </div>
    </BaseTheme>
  ) : (
    <Box>
      <p>Not signed</p>
    </Box>
  );
}
