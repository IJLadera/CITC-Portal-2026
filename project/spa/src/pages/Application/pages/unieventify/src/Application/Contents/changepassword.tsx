import { useState, useEffect } from 'react';
import { Button, Card, Label, TextInput } from "flowbite-react";
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import http from '../../../../../../../http';
import 'react-toastify/dist/ReactToastify.css';
import Cookies from "js-cookie";
import { FaEye } from "react-icons/fa";

import { useAppDispatch, useAppSelector } from '../../../../../../../hooks';
import { RootState } from '../../../../../../../store';

// interface Profile {
//     id: number;
//     // other profile properties
//   }

export default function Changepassword() {
    // const [profile, setProfile] = useState<User | null>(null);

    const dispatch = useAppDispatch();

    const profile = useAppSelector((state: RootState) => state.unieventify.user)

    // useEffect(() => {
    //     dispatch(fetchCurrentUser());
    // }, [dispatch]);


    const [old_password, setOld_Password] = useState('');
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState('');
    const [isDelayed, setIsDelayed] = useState(false);
    const navigate = useNavigate();
    const [isDisabled, setIsDisabled] = useState(false);
    const [loading, setLoading] = useState(false)
    const token = Cookies.get("auth_token");

    // useEffect(() => {
    //     const fetchProfile = async () => {
    //         try {
    //             // const token = Cookies.get("auth_token");
    //             if (!token) throw new Error("No authentication token found");

    //             const response = await http.get("auth/users/me/", {
    //                 headers: {
    //                     Authorization: `Token ${token}`,
    //                 },
    //             });

    //             setProfile(response.data);
    //         } catch (error) {
    //             console.log(error);
    //         }
    //     };

    //     fetchProfile();
    // }, [token]);

    const handleSubmit = (e: any) => {
        e.preventDefault();
        if (!profile) return;

        setIsDisabled(!isDisabled);
        setLoading(!loading);
        const passwords = {
            old_password,
            password,
            password2
        }
        http.put(`change_password/${profile.id}/`, passwords, {
            headers: {
                Authorization: `Token ${token}`,
            }
        })
            .then(response => {
                if (response.status === 204) {
                    toast.success("Passwords Changes!! ", {
                        position: "top-center",
                        autoClose: 3000,
                        hideProgressBar: true,
                    });
                    setIsDelayed(true);
                }
                setOld_Password('')
                setPassword('')
                setPassword2('')
                setIsDisabled(false);
                setLoading(false);
                navigate('/auth/app/profile')
            }).catch(error => {
                toast.error("Please check the password if its correct", {
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
            <Card className="w-80 text-center">
                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                    <div>
                        <div className="mb-2 block">
                            <Label htmlFor="oldpassword" value="Old Password" />
                        </div>
                        <TextInput
                            id="oldpassword"
                            type="text"
                            icon={FaEye}
                            value={old_password}
                            onChange={(e) => setOld_Password(e.target.value)}
                            placeholder=""
                            required
                        />
                    </div>
                    <div>
                        <div className="mb-2 block">
                            <Label htmlFor="newpassword" value="New Password" />
                        </div>
                        <TextInput
                            id="newpassword"
                            type="text"
                            icon={FaEye}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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
                            value={password2}
                            onChange={(e) => setPassword2(e.target.value)}
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
