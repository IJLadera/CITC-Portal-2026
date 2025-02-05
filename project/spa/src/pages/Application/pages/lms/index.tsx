import { Outlet } from "react-router-dom"
import Nav from "./components/nav"

export default function LMS () {
    return (
        <div className="col-span-3">
            <Nav />
            <div>
                <Outlet />
            </div>
        </div>
    )
}