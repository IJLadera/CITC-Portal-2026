import { useEffect } from "react"
import { useAppSelector } from "../../hooks"
import { Outlet, useNavigate } from "react-router-dom"
import SideBar from "./components/SideBar"
import Friends from "./components/Friends"
import Post from "./pages/posts"


export default function Application () {

    const loggedIn = useAppSelector(state => state.auth.loggedIn)
    const navigate = useNavigate()

    useEffect(() => {
        if (!loggedIn) {
            navigate('/login')
        }
    }, [])

    return <div className="bg-[#1A1851] h-screen flex justify-center">
        <div className="w-[1280px] max-h-screen p-5 overflow-y-hidden">
            <div></div>
            <div className="grid grid-cols-4">
                <div>
                    <SideBar/>
                </div>
                <Outlet />
            </div>
        </div>
    </div>
}