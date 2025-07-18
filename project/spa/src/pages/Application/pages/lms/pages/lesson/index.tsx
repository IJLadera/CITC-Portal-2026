import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import CreateLesson from './components/CreateLesson';
import LessonCard from './components/LessonCard';

import { getLessons } from './api';
import { LessonCardType } from './models';
import { useAppSelector } from '../../../../../../hooks'

export default function Lesson() {
    
    const { room } = useParams();
    const [lessons, setLessons] = useState<Array<LessonCardType>>([])
    const user = useAppSelector(state => state.auth.user)

    useEffect(() => {
       getLessons(room).then(response => {
            setLessons(response.data);
        }).catch(error => {
                console.log(error)
            })
    }, [])

    return (
        <div>
            {
                (!user.is_student) ? <CreateLesson isEdit={false} id={null} lesson={null}/> : null
            }
            <div className="grid grid-cols-4 gap-4 my-5">
                { 
                    lessons.map((obj) => <LessonCard title={obj.title} content={obj.content} id={obj.id} key={obj.id} excerpt={obj.excerpt} subject={obj.subject} module={obj.module} />)
                }
            </div> 
        </div>
    )
}
