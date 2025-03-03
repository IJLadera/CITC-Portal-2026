import React, { useState, useEffect, ReactHTMLElement } from 'react';
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Label, TextInput, Select, Button } from "flowbite-react";
import { CiSearch } from "react-icons/ci";
import { TextField } from "@mui/material";
import colors from '../../Components/colors';
import { styled } from '@mui/material/styles';
import { Event } from '../../Components/models';
import http from '../../../../../../../http';
import MonthlyEventList from '../../Components/eventComponents/MonthlyEventList';
import FooterComponent from '../../Components/Footer';
import { useNavigate } from "react-router-dom";
// import Skeleton from '@mui/material/Skeleton';
import { CircularProgress, Box } from "@mui/material";

const defaultTheme = createTheme();

interface eventCategory{
    id: number,
    eventCategoryName: string
}

// interface Event {
//     id: number,
//     eventName: string,
//     startDateTime: string,
//     endDateTime: string,
//     venue: {
//         location: string
//     },
//     status: {
//         statusName: string
//     }
//     eventCategory: {
//         id: number,
//         eventCategoryName: string
//     }
// }

const CustomTextField = styled(TextField)({
    backgroundColor: 'white',
    borderRadius: '6px',
    height: '42px',
    width: '100%',
    '& .MuiInputBase-root': {
        height: '100%',
    },
    '& .MuiOutlinedInput-notchedOutline': {
        borderRadius: '6px',
    },
});

const draft = 'draft';

// Utility function to check if two dates are the same
const isSameDate = (date1: Date, date2: Date) =>
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();

export default function Publicevents() {
    const [selectedDate, setSelectedDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [publicEvents, setPublicEvents] = useState<Event[]>([]);
    const [eventCategory, setEventCategory] = useState<eventCategory[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch events
        http
            .get("unieventify/public-events/")
            .then((response) => {
                const publicEvents = response.data.filter(
                    (event: any) => event.status?.statusName !== draft
                ).filter(
                    (event: any) => !event.isAnnouncement
                );
                setPublicEvents(publicEvents);
                setFilteredEvents(publicEvents); // Initially show all events
            })
            .catch((error) => console.log(error));

        // Fetch event categories
        http
            .get("unieventify/eventcategories/")
            .then((response) => setEventCategory(response.data))
            .catch((error) => console.log(error));
    }, []);

    const filterEventCategories = eventCategory
        ? eventCategory.filter(
            (category) =>
                category.eventCategoryName.toLowerCase() === "university" ||
                category.eventCategoryName.toLowerCase() === "college" ||
                category.eventCategoryName.toLowerCase() === "exam"
        )
        : [];

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedCategory(event.target.value);
    };

    const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedDate(event.target.value);
    };

    const handleSubmit = () => {
        // Filter events when user clicks search
        const filtered = publicEvents.filter((event) => {
            const eventStartDate = new Date(event.startDateTime);
            const eventEndDate = new Date(event.endDateTime);
            const selected = new Date(selectedDate);

            return (
                (searchTerm === '' || event.eventName.toLowerCase().includes(searchTerm.toLowerCase())) &&
                (selectedCategory === '' || event.eventCategory.id === parseInt(selectedCategory)) &&
                (selectedDate === '' ||
                    (selected >= eventStartDate && selected <= eventEndDate) ||
                    isSameDate(selected, eventStartDate) ||
                    isSameDate(selected, eventEndDate))
            );
        });

        setFilteredEvents(filtered);
    };

    // if (!publicEvents.length)
    //     return (
    //         <div className="space-y-8">
    //             <div>
    //                 <h2><Skeleton variant="text" sx={{ fontSize: '3rem', maxWidth: 200 }} /></h2>
    //                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ">
    //                     <Skeleton variant="text" sx={{ fontSize: '10rem', maxWidth: 300 }} />
    //                     <Skeleton variant="text" sx={{ fontSize: '10rem', maxWidth: 300 }} />
    //                     <Skeleton variant="text" sx={{ fontSize: '10rem', maxWidth: 300 }} />
    //                 </div>
    //             </div>
    //         </div>
    //     );

    return (
        <ThemeProvider theme={defaultTheme}>
            <div
                style={{
                    backgroundImage:
                        'url("https://pbs.twimg.com/media/Egbd8bVWAAEtEzP?format=jpg&name=4096x4096")',
                    height: "60vh",
                    backgroundSize: "cover",
                }}
            >
                <div className="flex justify-center h-3/5 pt-36 flex-col text-white font-bold sm:text-3xl">
                    <div className="self-center flex flex-row text-5xl lg:6xl">
                        <div className="lg:mb-10 mb-3">Events</div>
                    </div>
                    <div className='p-5 bg-black bg-opacity-50 backdrop-blur-sm flex grid grid-cols-1 
                    md:grid-cols-2 md:gap-x-3 gap-y-3 w-4/5 self-center md:mt-10 lg:grid-cols-4 xl:grid-cols-5'>
                        <div className='w-md lg:col-span-2'>
                            <TextInput
                                id="base"
                                type="text"
                                sizing="md"
                                placeholder='Search Events'
                                icon={CiSearch}
                                value={searchTerm}
                                onChange={handleSearchChange}
                            />
                        </div>
                        <div className="w-md">
                            <Select
                                id="category"
                                defaultValue=""
                                onChange={handleCategoryChange}
                            >
                                <option value="" disabled>Select Category</option>
                                <option value="">All Category</option>
                                {filterEventCategories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.eventCategoryName}
                                    </option>
                                ))}
                            </Select>
                        </div>
                        <div className="w-md lg:w-48">
                            <CustomTextField
                                label=""
                                type="date"
                                value={selectedDate || ''}
                                onChange={handleDateChange}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                variant="outlined"
                                placeholder='Select Date'
                            />
                        </div>
                        <Button gradientMonochrome="teal" className='w-md lg:col-span-4 xl:col-span-1'
                            onClick={handleSubmit}
                        >
                            Search Now
                        </Button>
                    </div>
                </div>
            </div>
            <div className="container mx-auto p-4">
                {filteredEvents.length > 0 ? (
                    <MonthlyEventList events={filteredEvents} />
                ) : (
                    <div className="self-center flex flex-row text-5xl lg:6xl">
                        <div className="lg:mb-10 mb-3">No Event Available on Current Filter</div>
                    </div>
                )}
            </div>
            <FooterComponent />
        </ThemeProvider>
    );
}
