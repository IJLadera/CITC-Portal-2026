import { useEffect, useState } from "react";
import { useAppSelector } from "../../../../../../hooks";
import { RootState } from "../../../../../../store";
import http from "../../../../../../http";
import Cookies from "js-cookie";
import { Navigate, Outlet } from "react-router-dom";
import { CircularProgress, Box } from "@mui/material";
import SyllabaseSidebar from "../Components/Sidebar";

export default function SyllabeaseDashboard() {
    const token = useAppSelector((state: RootState) => state.auth.token);
    const [isAuthenticated, setIsAuthenticated] = useState<null | boolean>(null);

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
                        Cookies.remove("auth_token");
                        setIsAuthenticated(false);
                    }
                });
        } else {
            setIsAuthenticated(false);
        }
    }, [token]);

    if (!token) {
        return <Navigate to="/login" />;
    }

    if (isAuthenticated === null) {
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
        <div className="w-full h-full flex">
            <SyllabaseSidebar />
            <div className="flex-1 overflow-y-auto bg-white">
                <Outlet />
            </div>
        </div>
    ) : (
        <Box>
            <p>Not signed in</p>
        </Box>
    );
}
