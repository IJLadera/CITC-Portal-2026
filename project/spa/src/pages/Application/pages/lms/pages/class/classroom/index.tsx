import { Tabs, Spinner } from 'flowbite-react';
import { useEffect, useState } from 'react';
import { RxActivityLog } from 'react-icons/rx';
import { HiAdjustments, HiUserCircle } from 'react-icons/hi';
import { LuChartNoAxesCombined } from "react-icons/lu";
import { FaBook } from 'react-icons/fa6';
import Attendance from './Attendance';
import { useParams } from 'react-router-dom';
import { useAppSelector } from '../../../../../../../hooks';
import { ClassroomType } from '../../../models'
import Lesson from '../../lesson';
import { getStudentClass } from '../api';


export default function Classroom() {
  
  const { room } = useParams();
  const { classRooms } = useAppSelector(state => state.lms)
  const user = useAppSelector(state => state.auth.user)
  const [detail, setDetails] = useState<ClassroomType>();
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<number>(0);

  useEffect(() => {
    setLoading(true);
    getStudentClass(room).then(response => {
      let classroom = classRooms[classRooms.findIndex(obj => `${obj.id}` == room)]
      if (response.status == 200) {
        setDetails({
          ...classroom,
          students : response.data,
        });
        setLoading(false);
      }
    }).catch(error => {
        setLoading(false);
      })
  }, []);

  const onHandleActiveTab = (tabIndex:number) => {
    setActiveTab(tabIndex);
  }


  return (
    <>
      <p className="text-4xl font-bold text-white">{detail && detail.subject}</p>
      <p className="text-2xl font-bold text-white">{detail && detail.year_level}{detail && detail.section} and {detail && detail.students.length}</p>
      <p className="text-md text-white">{detail && detail.school_year}</p>
      <div className="mt-5">
        <Tabs onActiveTabChange={onHandleActiveTab}>
          <Tabs.Item active title="Attendance" icon={HiUserCircle}>
            {
              (loading) ? <Spinner aria-label="Loading" size="xl" /> : (!user.is_student) ? <Attendance students={detail && detail.students} /> : <Attendance students={detail && detail.students.filter(obj => obj.id_number == user.id_number)} />
            }
          </Tabs.Item>
          <Tabs.Item title="Lessons" icon={FaBook}>
            { (activeTab === 1) ? <Lesson /> : null }
          </Tabs.Item>
          <Tabs.Item title="Activities" icon={RxActivityLog}>
            <p>Under Construction</p>
          </Tabs.Item>
          <Tabs.Item title={(user.is_student) ? "Evaluate" : "Evaluation"} icon={LuChartNoAxesCombined}>
            <h1>Evaluation Here!</h1>
          </Tabs.Item>
        </Tabs>
      </div>
    </>
  )
}
