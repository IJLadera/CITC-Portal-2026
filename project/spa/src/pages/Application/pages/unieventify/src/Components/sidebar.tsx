import {Role, User} from './models'
import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuIcon from "@mui/icons-material/Menu";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useNavigate } from "react-router-dom";
import Badge from "@mui/material/Badge";
import { CircularProgress } from "@mui/material";

import TextSnippetIcon from "@mui/icons-material/TextSnippet";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import CampaignIcon from "@mui/icons-material/Campaign";
import DashboardIcon from "@mui/icons-material/Dashboard";
import EventIcon from "@mui/icons-material/Event";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import colors from "./colors";

import { Accordion } from "flowbite-react";

import http from "../../../../../../http";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useAppSelector } from '../../../../../../hooks';

const drawerWidth = 210;


// interface UserRole {
//   id: number;
//   rank: number;
//   designation: string;
// }

// interface User {
//   first_name: string;
//   is_staff: boolean;
//   image: string;
//   role?: UserRole;
// }

interface SideBarProps {
  window?: () => Window;
}

function SideBar(props: SideBarProps) {
  const { window } = props;
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [unreadCount, setUnreadCount] = useState(0);
  const [role, setRole] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const token = useAppSelector(state => state.auth.token)
  const [isAdmin, setIsAdmin] = useState(false);
  const [activePath, setActivePath] = useState("");
  const ADMIN_PANEL_API = "https://unieventify.duckdns.org/admin/";
  const SUS =
    "https://docs.google.com/forms/d/e/1FAIpQLSeov_4dwFHFvp8dg3CyHlrot0mjrxCdLoPwUNgu-TNxEmMEHg/viewform";
  const feedback =
    "https://docs.google.com/forms/d/e/1FAIpQLScDgqtr8zcwz18KBYWky0L57KjEPlmCoDIbmTYFC3R4q8FOYg/viewform";
  const bug =
    "https://docs.google.com/forms/d/e/1FAIpQLScE7tGtJTIKvVptizmWTz15ErkfUsSD-tJR1Wf3TfHEdpLHWA/viewform";

  const dashboardRole = ["Student", "Faculty", "Mother Org", "Unit Org"];

  useEffect(() => {
    http
      .get("auth/users/me/", {
        headers: {
          Authorization: `Token ${token}`,
        },
      })
      .then((response) => {
        setRole(response.data.role.rank);
        setCurrentUser(response.data);
        console.log("current user", response)
        if (response.data.is_staff) {
          setIsAdmin(true);
        }
      })
      .catch((error) => {
        setError(error);
      });
  }, [token]);

  const handleDrawerClose = () => {
    setIsClosing(true);
    setMobileOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    setIsClosing(false);
  };

  const handleDrawerToggle = () => {
    if (!isClosing) {
      setMobileOpen(!mobileOpen);
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (path: string) => {
    handleClose();
    if (path === "/auth") {
      Cookies.remove("auth_token");
      navigate(path);
    } else {
      navigate(path);
    }
  };

  const isActivePath = (path: string) => activePath === path;

  const getItemStyle = (path: string) => ({
    backgroundColor: isActivePath(path) ? colors.darkergray : "transparent",
    color: isActivePath(path) ? "#191750" : "inherit",
  });

  const drawer = (
    <div
      style={{
        color: "white",
        backgroundColor: "#191750",
        minHeight: "100vh",
        overflowY: "auto",
      }}
    >
      <Toolbar />
      <Divider />
      {!dashboardRole.includes(currentUser?.role?.name || "") && (
        <List>
          <ListItem disablePadding>
            <ListItemButton
              onClick={(event) => {
                onClickToNavigate(event, "dashboard/");
              }}
              style={getItemStyle("/auth/app/dashboard")}
            >
              <ListItemIcon>
                <DashboardIcon sx={{ color: "#FAB417", fontSize: 30 }} />
              </ListItemIcon>
              <ListItemText>Dashboard</ListItemText>
            </ListItemButton>
          </ListItem>
        </List>
      )}

      <Accordion className="border-none">
        <Accordion.Panel
          className="hover:bg-none bg-red-500 p-8"
          onClick={(event) => {
            onClickToNavigate(event, "/auth/app");
          }}
        >
          <Accordion.Title
            className="text-white-100 border-none bg-none hover:bg-none p-4"
            style={{ background: "none" }}
          >
            <EventIcon
              sx={{ color: "#FAB417", fontSize: 30, marginRight: 3 }}
            />
            Calendar
          </Accordion.Title>
          <Accordion.Content
            className="pt-1 ml-12 border-none cursor-pointer"
            onClick={(event) => {
              onClickToNavigate(event, "events/");
            }}
            style={getItemStyle("/auth/app/")}
          >
            Events
          </Accordion.Content>
          <Accordion.Content
            className="pt-1 ml-12 border-none cursor-pointer"
            onClick={(event) => {
              onClickToNavigate(event, "userevents");
            }}
            style={getItemStyle("/auth/app/userevents")}
          >
            Your Events
          </Accordion.Content>
          {currentUser?.role?.name !== "Faculty" ? (
            <Accordion.Content
              className="pt-1 ml-12 border-none cursor-pointer"
              onClick={(event) => {
                onClickToNavigate(event, "timeline");
              }}
              style={getItemStyle("/auth/app/timeline")}
            >
              Timeline
            </Accordion.Content>
          ) : <Accordion.Content></Accordion.Content>}
          <Accordion.Content
            className="pt-1 ml-12 border-none cursor-pointer"
            onClick={(event) => {
              onClickToNavigate(event, "addevent");
            }}
            style={getItemStyle("/auth/app/addevent")}
          >
            Add Event
          </Accordion.Content>
          {role === 1 || isAdmin ? (
            <Accordion.Content
              className="pt-1 ml-12 border-none cursor-pointer"
              onClick={(event) => {
                onClickToNavigate(event, "/auth/app/CSVUpload");
              }}
              style={getItemStyle("/auth/app/CSVUpload")}
            >
              Upload CSV
            </Accordion.Content>
          ) : (
            <Box></Box>
          )}

          <Accordion.Content
            className="pt-1 ml-12 border-none cursor-pointer"
            onClick={(event) => {
              onClickToNavigate(event, "documents");
            }}
            style={getItemStyle("/auth/app/Documents")}
          >
            Documents
          </Accordion.Content>
        </Accordion.Panel>
      </Accordion>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton
            onClick={(event) => {
              onClickToNavigate(event, "notifications");
            }}
            style={getItemStyle("/auth/app/notification")}
          >
            <ListItemIcon>
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsActiveIcon
                  sx={{ color: "#FAB417", fontSize: 30 }}
                />
              </Badge>
            </ListItemIcon>
            <ListItemText>Notification</ListItemText>
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={(event) => {
              onClickToNavigate(event, "announcement");
            }}
            style={getItemStyle("/auth/app/announcement")}
          >
            <ListItemIcon>
              <Badge color="error">
                <CampaignIcon sx={{ color: "#FAB417", fontSize: 30 }} />
              </Badge>
            </ListItemIcon>
            <ListItemText>Announcement</ListItemText>
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={(event) => {
              onClickToNavigate(event, "profile");
            }}
            style={getItemStyle("/auth/app/profile")}
          >
            <ListItemIcon>
              <AccountCircleIcon sx={{ color: "#FAB417", fontSize: 30 }} />
            </ListItemIcon>
            <ListItemText>Profile</ListItemText>
          </ListItemButton>
        </ListItem>
        {isAdmin || role !== 5 ? (
          <ListItem disablePadding>
            <ListItemButton
              onClick={(event) => {
                onClickToNavigate(event, "reports");
              }}
              style={getItemStyle("/auth/app/report")}
            >
              <ListItemIcon>
                <TextSnippetIcon sx={{ color: "#FAB417", fontSize: 30 }} />
              </ListItemIcon>
              <ListItemText>Reports</ListItemText>
            </ListItemButton>
          </ListItem>
        ) : (
          <Box></Box>
        )}
      </List>
    </div>
  );

  const navigate = useNavigate();

  const onClickToNavigate = (event: React.MouseEvent, path: string) => {
    event.preventDefault();
    setActivePath(path);
    navigate(path);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!token) throw new Error("No auth token found");

        const response = await http.get("auth/users/me/", {
          headers: {
            Authorization: `Token ${token}`,
          },
        });
        setProfile(response.data);
        console.log("profile", response.data);
      } catch (error) {
        setError(error as Error);
      } finally {
        setLoading(false);
      }
    };

    const fetchUnreadCount = async () => {
      try {
        if (!token) throw new Error("No auth token found");

        const response = await http.get("unieventify/notifications/", {
          headers: {
            Authorization: `Token ${token}`,
          },
        });

        const unreadNotifications = response.data.filter(
          (notification: any) => !notification.is_read
        );
        setUnreadCount(unreadNotifications.length);
      } catch (error) {
        console.error("Error fetching unread notifications count:", error);
      }
    };

    fetchProfile();
    fetchUnreadCount();
  }, []);

  if (!(profile ))
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <CircularProgress />
      </Box>
    );

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar style={{ backgroundColor: "#191750" }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <Typography variant="h6" noWrap>
              Welcome, {profile ? profile.first_name : "Guest"}!
            </Typography>
            <Avatar
              alt="Profile Picture"
              src={profile?.image}
              onClick={handleClick}
              sx={{ cursor: "pointer" }}
            ></Avatar>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              PaperProps={{
                sx: {
                  width: "200px",
                  bgcolor: "#191750",
                  color: "white",
                },
              }}
            >
              {profile?.is_staff ? (
                <MenuItem>
                  <a
                    href={ADMIN_PANEL_API}
                    className="btn btn-primary text-white"
                  >
                    Admin Panel
                  </a>
                </MenuItem>
              ) : (
                <Box></Box>
              )}
              <MenuItem>
                <a href={SUS} className="btn btn-primary text-white">
                  SUS Survey
                </a>
              </MenuItem>
              <MenuItem>
                <a href={bug} className="btn btn-primary text-white">
                  BUG Report
                </a>
              </MenuItem>
              <MenuItem>
                <a href={feedback} className="btn btn-primary text-white">
                  FeedBack
                </a>
              </MenuItem>
              <MenuItem
                onClick={() => handleMenuItemClick("/")}
              >
                Hobnob
              </MenuItem>
              <MenuItem
                onClick={() => handleMenuItemClick("/auth/app/profile")}
              >
                Profile
              </MenuItem>
              {/* <MenuItem onClick={() => handleMenuItemClick("/auth")}>
                Logout
              </MenuItem> */}
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onTransitionEnd={handleDrawerTransitionEnd}
          onClose={handleDrawerClose}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
    </Box>
  );
}

export default SideBar;