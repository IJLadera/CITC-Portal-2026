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
            }
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
            path: "/unieventify",
            element: <Landingpage />,
          },
          {
            path: "publicevents/",
            element: <Publicevents />,
          }
        ]
    },
    {
        path: "profile/",
        element: <Profile />,
    },

])

export default router;