import React, { useState } from 'react';
import { Button, Card, Label, TextInput } from "flowbite-react";
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import http from '../axios';
import { HiMail } from 'react-icons/hi';
import 'react-toastify/dist/ReactToastify.css';

export default function Forgotpassword() {
    const [email, setEmail] = useState('');
    const [isDelayed, setIsDelayed] = useState(false);
    const navigate = useNavigate();
    const [isDisabled, setIsDisabled] = useState(false);
    const [loading, setLoading] = useState(false)

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsDisabled(!isDisabled);
        setLoading(!loading);
        http.post('auth/users/reset_password/', { email: email })
            .then(response => {
                if (response.status === 204) {
                    toast.success("Email Sent! Please Check Your Email Inbox", {
                        position: "top-center",
                        autoClose: 3000,
                        hideProgressBar: true,
                    });
                    setIsDelayed(true);
                }
                setEmail('')
                setIsDisabled(false);
                setLoading(false);
            }).catch(error => {
                toast.error("Email Not Found", {
                    position: "top-center",
                    autoClose: 3000,
                    hideProgressBar: true,
                });
                setIsDisabled(false);
                setLoading(false);
            });
    };

    return (
        <div className='flex flex-col justify-center items-center'>
            <Card className="w-80 text-center mt-28">
                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                    <div>
                        <div className="mb-2 block">
                            <Label htmlFor="email1" value="Email" />
                        </div>
                        <TextInput
                            id="email1"
                            type="email"
                            icon={HiMail}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@gmail.com"
                            required
                        />
                    </div>
                    <Button type="submit" disabled={isDisabled} isProcessing={loading}>Submit</Button>
                </form>
            </Card>
            <ToastContainer />
        </div>
    );
}
