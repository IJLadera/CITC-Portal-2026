import React, { useState } from 'react';
import { Button, Card, Label, TextInput } from "flowbite-react";
import { toast, ToastContainer } from 'react-toastify';
import http from '../../../../../../http';
import { HiMail } from 'react-icons/hi';
import { FaEye } from "react-icons/fa";
import 'react-toastify/dist/ReactToastify.css';
import { useParams, useNavigate } from 'react-router-dom'

export default function Forgotpasswordconfirm() {
    const [email, setEmail] = useState('');
    const [isDelayed, setIsDelayed] = useState(false);
    const navigate = useNavigate();
    const [isDisabled, setIsDisabled] = useState(false);
    const [loading, setLoading] = useState(false)
    const { uid, token } = useParams()
    const [new_password, setNew_Password] = useState('')
    const [re_new_password, setRe_New_Password] = useState('')

    const handleSubmit = (e: any) => {
        e.preventDefault();
        setIsDisabled(!isDisabled);
        setLoading(!loading);
        const passwordData = {
            uid,
            token,
            new_password,
            re_new_password
        }
        http.post('auth/users/reset_password_confirm/', passwordData)
            .then(response => {
                if (response.status === 204) {
                    toast.success("Password Reset Successfully!", {
                        position: "top-center",
                        autoClose: 3000,
                        hideProgressBar: true,
                    });
                    setIsDelayed(true);
                }
                setNew_Password('')
                setRe_New_Password('')
                setIsDisabled(false);
                setLoading(false);
            }).catch(error => {
                toast.error("Error!! Please check the password", {
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
                            <Label htmlFor="newpassword" value="New Password" />
                        </div>
                        <TextInput
                            id="newpassword"
                            type="text"
                            icon={FaEye}
                            value={new_password}
                            onChange={(e) => setNew_Password(e.target.value)}
                            placeholder=""
                            required
                        />
                    </div>
                    <div>
                        <div className="mb-2 block">
                            <Label htmlFor="renewpassword" value="ReType New Password" />
                        </div>
                        <TextInput
                            id="renewpassword"
                            type="text"
                            icon={FaEye}
                            value={re_new_password}
                            onChange={(e) => setRe_New_Password(e.target.value)}
                            placeholder=""
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
