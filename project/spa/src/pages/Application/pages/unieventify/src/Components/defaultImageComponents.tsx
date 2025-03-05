import examImage from "../images/event default picture/exam_picture.jpg"; // Add actual image paths
import studentRelatedImage from "../images/event default picture/student_related.jpg";
import schoolRelatedImage from "../images/event default picture/school_related.jpg";
import defaultImage from "../images/eventssample.jpg";
import personal from '../images/event default picture/personal.webp';
import officialtravel from '../images/event default picture/official_travel.webp';
import meeting from "../images/event default picture/meeting.webp"
import classSchedule from "../images/event default picture/class_schedules.webp"
import consultation from "../images/event default picture/consultations.webp"
import task from "../images/event default picture/task.webp"
import seminar from "../images/event default picture/seminars.webp"

// Function to map event category to an image
const getImageForCategory = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
        case "exam":
            return examImage;
        case "student related":
            return studentRelatedImage;
        case "school related":
            return schoolRelatedImage;
        case "personal":
            return personal;
        case "official travels":
            return officialtravel;
        case "meetings":
            return meeting;
        case "class schedules":
            return classSchedule;
        case "consultations":
            return consultation;
        case "tasks":
            return task;
        case "seminars":
            return seminar;
        default:
            return defaultImage; // Default image if no specific category matches
    }
};

export default getImageForCategory;