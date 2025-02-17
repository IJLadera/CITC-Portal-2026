import React, { useState } from 'react'
import { Button, Card } from "flowbite-react";
import { useParams, useNavigate } from 'react-router-dom'
import { toast, ToastContainer } from 'react-toastify'
import http from '../axios';

export default function Activation() {
    const [isDelayed, setIsDelayed] = useState(false);
    const navigate = useNavigate();
    const { uid, token } = useParams()
    const handleSubmit = (e) => {
        e.preventDefault()
        const userData = {
            uid,
            token
        }
        http.post('auth/users/activation/', userData).then(response => {
            if (response.status === 204) {
                toast.success("Your account has been activated! You can login now", {
                    position: "top-center",
                    autoClose: 3000,
                    hideProgressBar: true,
                })
                setIsDelayed(true);
            }
        }).catch((error) => {
            toast.error(`${error.response.data}`, {
                position: "top-center",
                autoClose: 3000,
                hideProgressBar: true,
            })
        })
    };
    return (
        <div className='flex flex-col justify-center items-center'>
            <Card className="max-w-sm text-center mt-20">
                <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                    ACCOUNT ACTIVATION !!!
                </h5>
                <p className="font-normal text-gray-700 dark:text-gray-400">
                    By clicking the button activate below your account will be activate and you will redirect to the Login Page.
                </p>
                <Button onClick={handleSubmit}>
                    Activate
                </Button>
            </Card>
            <ToastContainer
            />
        </div>
    )
}
