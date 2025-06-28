import { Card } from 'flowbite-react';
import { useNavigate } from 'react-router-dom';

interface RoomProps {
  room: string;
  subject: string;
  instructor: string;
  yearLevel: string;
  section: string;
}


export default function Room({room, subject, instructor, yearLevel, section}:RoomProps) {
  return (
    <Card href="#" className="w-full h-auto">
      <h5 className="font-bold">{ subject }</h5>
      <p className="text-xs mt-3">
        Instructor: <b>{instructor}</b>
        <br/>
        Year and Section: <b>{`${yearLevel}-${section}`}</b>
      </p>
    </Card>
  )
}
