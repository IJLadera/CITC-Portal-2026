import { createBrowserRouter } from "react-router-dom";
import Login from "./pages/authentication/Login";
import Application from "./pages/Application";
// import { AuthProvider } from "./pages/authentication/providers";
import Post from "./pages/Application/pages/posts";
import LMS from "./pages/Application/pages/lms";
import Class from "./pages/Application/pages/lms/pages/class";
import Publicevents from "./pages/Application/pages/unieventify/src/Application/PublicViewContent/publicevents";
import Header from "./pages/Application/pages/unieventify/src/Components/Header";
import Error from "./pages/Application/pages/unieventify/src/Application/error";
import Landingpage from "./pages/Application/pages/unieventify/src/Application/PublicViewContent/landingpage";
import Profile from "./pages/Application/pages/unieventify/src/Application/Contents/profile";
import MyCalendar from "./pages/Application/pages/unieventify/src/Components/calendar";
import Events from "./pages/Application/pages/unieventify/src/Application/Contents/Events/events";
import UniEventifyApplication from "./pages/Application/pages/unieventify/src/Application/application";
import Notification from "../src/pages/Application/pages/unieventify/src/Application/Contents/notification";
import DifEventDetails from "./pages/Application/pages/unieventify/src/Application/Contents/Events/eventDetails";
import UserEvents from "./pages/Application/pages/unieventify/src/Application/Contents/Events/userEvents";
import EventTimeline from "./pages/Application/pages/unieventify/src/Application/Contents/Events/timeline";
import AnnouncementsPage from "./pages/Application/pages/unieventify/src/Application/Contents/announcement";
import Dashboard from "./pages/Application/pages/unieventify/src/Application/Contents/dashboard";
import EventForm from "./pages/Application/pages/unieventify/src/Application/Contents/Events/addEvent";
import ApproveDocumentsPage from "./pages/Application/pages/unieventify/src/Application/Contents/Events/ApproveDocumentsPage";
import Reports from "./pages/Application/pages/unieventify/src/Application/Contents/reports";
import AddUser from "./pages/Application/pages/unieventify/src/Application/Contents/adduser";
import UserUploadCSV from "./pages/Application/pages/unieventify/src/Application/Contents/uploadusercsv";

const router = createBrowserRouter([
    {
        path: '/',
        element: <Application />,
        children: [
            {
                path: "",
                element: <Post />
            },
            {
                path: "lms/",
                element: <LMS />,
                children: [
                    {
                        path: "",
                        element: <Class />
                    }
                ]
            },
            // {
            //     path: "citc/portal/unieventify/",
            //     element: <Landingpage />,
            // }
        ]
    },
    {
        path: "/login",
        element: <Login />
    },
    {
        path: "/unieventify",
        element: <Header />,
        errorElement: <Error />,
        children: [
            {
                path: "",
                element: <Landingpage />
            },
            {
                path: "app/",
                element: <UniEventifyApplication />,
                children: [
                    {
                        path: "profile/",
                        element: <Profile />
                    },
                    {
                        path: "notifications/",
                        element: <Notification />
                    },
                    {
                        path: "eventdetails/:id",
                        element: <DifEventDetails />
                    },
                    {
                        path: "userevents/",
                        element: <UserEvents />
                    },
                    {
                        path: "timeline/",
                        element: <EventTimeline />
                    },
                    {
                        path: "events/",
                        element: <Events />
                    },
                    {
                        path: "announcements/",
                        element: <AnnouncementsPage />
                    },
                    {
                        path: "announcement/",
                        element: <AnnouncementsPage />
                    },
                    {
                        path: "dashboard/",
                        element: <Dashboard />
                    },
                    {
                        path: "addevent/",
                        element: <EventForm />
                    },
                    {
                        path: "documents/",
                        element: <ApproveDocumentsPage />
                    },
                    {
                        path: "reports/",
                        element: <Reports />
                    },
                    {
                        path: "adduser/",
                        element: <AddUser />
                    },
                    {
                        path: "uploaduser/",
                        element: <UserUploadCSV />
                    }
                ]
            },
        ]
    },
    {
        path: "calendar/",
        element: <MyCalendar />,
    },
    {
        path: "events/",
        element: <Events />,
    },

])

export default router;