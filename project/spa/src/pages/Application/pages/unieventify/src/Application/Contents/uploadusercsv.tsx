
import React, { useState } from 'react';
import http from "../../../../../../../http"
import { FileInput, Label, Button } from "flowbite-react";
import Cookies from "js-cookie";
import { Banner } from "flowbite-react";
import { MdAnnouncement } from "react-icons/md";



const UserUploadCSV = () => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [isDisabled, setIsDisabled] = useState(false);
    const token = Cookies.get("auth_token");

    const handleFileChange = (e: any) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setIsDisabled(true);
        setLoading(true);
        
        const formData = new FormData();
    
        if (!file) {
            alert("Please select a file before uploading.");
            setIsDisabled(false);
            setLoading(false);
            return; // Stop execution if no file is selected
        }
    
        formData.append("file", file); // Now `file` is guaranteed to be a `File`
    
        try {
            const response = await http.post("unieventify/upload-user/", formData, {
                headers: {
                    Authorization: `Token ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });
    
            alert("Successfully Uploaded.");
        } catch (error) {
            alert(`Unsuccessful Upload. ${error}`);
        } finally {
            setIsDisabled(false);
            setLoading(false);
        }
    };    

    return (
        <div>
            <div id="fileUpload" className="max-w-md flex flex-col">
                <div className="mb-2 block self-center">
                    <Label htmlFor="file" value="Upload User CSV" className='text-2xl' />
                </div>
                <FileInput id="file"
                    className='my-5'
                    onChange={handleFileChange} />
                <Button color="light"
                    onClick={handleSubmit}
                    disabled={isDisabled}
                    isProcessing={loading}
                >Submit</Button>
            </div>
            <Banner>
                <div className="mt-4 flex w-full items-center justify-between border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700">
                    <div className="flex items-center space-x-4 px-2">
                        <MdAnnouncement className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                        <div className="flex flex-col max-w-80">
                            <p className="text-base font-semibold text-gray-700 dark:text-gray-100 break-words overflow-visible whitespace-normal">
                                Important Reminder:
                            </p>
                            <div className="mt-1 text-sm font-normal text-gray-600 dark:text-gray-400">
                                - When inputting data please refer to the dashboard entities
                            </div>
                            <div className="mt-1 text-sm font-normal text-gray-600 dark:text-gray-400">
                                - Inputted Data must be Case Sensitive
                            </div>
                            <div className="mt-1 text-sm font-normal text-gray-600 dark:text-gray-400">
                                - In the Template CSV below it contain basic field and must follow the format
                            </div>
                            <div className="mt-1 text-sm font-normal text-gray-600 dark:text-gray-400">
                                - In the Template CSV, you can add optional field such as:
                            </div>
                            <div className="mt-1 text-sm font-normal text-gray-600 dark:text-gray-400">
                                - section: section name in the entities
                            </div>
                            <div className="mt-1 text-sm font-normal text-gray-600 dark:text-gray-400">
                                - organization: studentOrgName in the entities
                            </div>
                            <div className="mt-1 text-sm font-normal text-gray-600 dark:text-gray-400">
                                - The password is already set as default which is idNumber of the account
                            </div>
                        </div>
                    </div>
                </div>
            </Banner>

            {/* Link to download the CSV template */}
            <div className="mt-4">
                <a href="/user-template.csv" download className="text-blue-500 underline">
                    Download CSV Template
                </a>
            </div>

        </div>

    );
};

export default UserUploadCSV;
