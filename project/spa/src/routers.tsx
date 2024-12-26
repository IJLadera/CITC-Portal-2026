import { createBrowserRouter } from "react-router-dom";
import Login from "./pages/authentication/Login";
import Application from "./pages/Application";
// import { AuthProvider } from "./pages/authentication/providers";
import Post from "./pages/Application/pages/posts";
import LMS from "./pages/Application/pages/lms";
import Class from "./pages/Application/pages/lms/pages/class";

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
    }
])

export default router;