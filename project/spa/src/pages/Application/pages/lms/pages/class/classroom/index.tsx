import { Tabs } from 'flowbite-react';
import { useEffect, useState } from 'react';
import { RxActivityLog } from 'react-icons/rx';
import { HiAdjustments, HiUserCircle } from 'react-icons/hi';
import { FaBook } from 'react-icons/fa6';
import Attendance from './Attendance';
import { useParams } from 'react-router-dom';
import { useAppSelector } from '../../../../../../../hooks';
import { ClassroomType } from '../../../models'
import Lesson from '../../lesson';

export default function Classroom() {
  
  const { room } = useParams();
  const { classRooms } = useAppSelector(state => state.lms)
  const [detail, setDetails] = useState<ClassroomType>();

  useEffect(() => {
    setDetails(classRooms[classRooms.findIndex(obj => `${obj.id}` == room)])
  });


  return (
    <>
      <p className="text-4xl font-bold text-white">{detail && detail.subject}</p>
      <p className="text-2xl font-bold text-white">{detail && detail.year_level}{detail && detail.section} and {detail && detail.students.length}</p>
      <p className="text-md text-white">{detail && detail.school_year}</p>
      <div className="mt-5">
        <Tabs>
          <Tabs.Item active title="Attendance" icon={HiUserCircle}>
            <Attendance students={detail && detail.students} /> 
          </Tabs.Item>
          <Tabs.Item title="Lessons" icon={FaBook}>
            <Lesson />
          </Tabs.Item>
          <Tabs.Item title="Activities" icon={RxActivityLog}>

          </Tabs.Item>
        </Tabs>
      </div>
    </>
  )
}
