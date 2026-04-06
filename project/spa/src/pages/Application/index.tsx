import { useEffect } from "react"
import { useAppSelector } from "../../hooks"
import { Outlet, useNavigate } from "react-router-dom"
import SideBar from "./components/SideBar"
import { useDispatch } from "react-redux"
import { getProfile } from "../authentication/Login/api"
import { storeUser } from "../authentication/Login/slice"
import { ToastContainer } from 'react-toastify';

export default function Application () {

    const loggedIn = useAppSelector(state => state.auth.loggedIn)
    const token = useAppSelector(state => state.auth.token)
    const user = useAppSelector(state => state.auth.user)
    const navigate = useNavigate()
    const dispatch = useDispatch()

    useEffect(() => {
        if (token) {
            navigate('/');
        }
    }, [token, navigate]);

    useEffect(() => {
        if (!loggedIn) {
            navigate('/login')
        }
        else {
            if (user.first_name == '' && user.last_name == '' && user.uuid == '' && user.email == '') {
                getProfile(token).then(response => {
                    dispatch(storeUser(response.data))
                }).catch(error => {
                    console.log('something went wrong with the profile')
                })
            }
        }

    }, [])

    return <div className="bg-[#1A1851] h-screen flex justify-center">
        <div className="w-full max-h-screen p-5 overflow-y-hidden">
            <div></div>
            <div className="flex gap-4 h-full">
                <div className="w-64 flex-shrink-0">
                    <SideBar/>
                </div>
                <div className="flex-1 overflow-hidden">
                    <Outlet />
                </div>
                <ToastContainer style={{ fontSize: "18px" }} />
            </div>
        </div>
    </div>
}
