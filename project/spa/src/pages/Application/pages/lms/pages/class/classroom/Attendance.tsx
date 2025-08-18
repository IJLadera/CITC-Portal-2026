import React from 'react';
import { Button, Checkbox, Datepicker, Modal, Table } from 'flowbite-react';
import { useEffect, useState } from 'react';
import { MdOutlineClose } from 'react-icons/md';
import { useParams } from 'react-router-dom';
import { useAppSelector } from '../../../../../../../hooks'
import {  StudentAttendance } from '../../../models'
import { attendanceListClass, updateAttendance, createAttendance } from '../api';

import AddStudent from '../classroom/AddStudent';

const datePickerCustom = {
  datepicker: {
    "popup": {
      "inner" : "inline-block rounded-lg bg-white p-4 shadow-lg dark:bg-gray-700 w-full"
    }
  }
}

type dateType = {
  date: string;
}

type HeadersType = {
  date: string;
  students: any[]
}

type ClassAttendanceType = {
  id: string;
  date: string;
  student: string;
  is_present: boolean;
  classroom?: string;
}


type AttendanceType = {
  id: string;
  student: string;
  classroom?: string;
  is_present: boolean;
  date: string;
}

interface AttendanceProps {
  students: StudentAttendance[] | undefined;
}

const Attendance: React.FC<AttendanceProps> = ({students}) => {
  
  const { room } = useParams();
  const { user } = useAppSelector(state => state.auth); 
  const [headers, setHeaders] = useState<Array<HeadersType>>([])
  const [showDateModal, setShowDateModal] = useState<boolean>(false);
  const dateObj = new Date()
  const dateNow = `${dateObj.getFullYear()}-${("0" + (dateObj.getMonth() + 1)).slice(-2)}-${dateObj.getDate()}`
  
  const [attendance, setAttendance] = useState<Array<AttendanceType>>([])

  useEffect(() => {
    attendanceListClass(room).then(response => {
      if (response.status === 200) {
        const data:AttendanceType[] = response.data.results;

        let temp_headers:HeadersType[] = []
        data.map(obj => {
          if (temp_headers.length === 0) {
            temp_headers = [
              {
                date: obj.date,
                students: []
              }
            ]
          } else {
            if (!temp_headers.find(x => x.date === obj.date)) {
              temp_headers = [
                ...temp_headers,
                {
                  date: obj.date,
                  students: []
                }
              ]
            }
          }
          return 0
        })
        setHeaders(temp_headers)
        setAttendance(data)
      } else {
        console.log('samoka!')
      }  
    })
  }, [])

  const onClickAddAttendance = (event:any) => {
    const date = `${event.getFullYear()}-${("0" + (event.getMonth() + 1)).slice(-2)}-${event.getDate()}`

    if (!headers.find(obj => obj.date == date)) {
      setHeaders([
        ...headers,
        {
          date: date,
          students: []
        }
      ])
    }

    setShowDateModal(false);
  }

  const getValueOfStudentsTardy = (id_number:string, date:string) => {
    try {
      return attendance?.find(obj => obj?.student === id_number && obj?.date === date)?.is_present 
    } catch {
      return false
    }
  }

  const onTickCheckBox = (id_number:string, date:string) => {
    console.log('onTick!');
    try {
      const temp = attendance?.find(obj => obj?.student === id_number && obj?.date === date)
      

      if (temp !== undefined) {
        const temp_att = attendance;
        const data = temp_att[temp_att.findIndex(obj => obj.student === temp.student && obj.date === temp.date)] = {
          ...temp_att[temp_att.findIndex(obj => obj.student === temp.student && obj.date === temp.date)],
          is_present: !temp.is_present
        }
        
        updateAttendance(data).then(response => {
          if (response.status === 200) {
            setAttendance([
              ...temp_att
            ])
          }
        })

      } else {
        const data = {
          id: '',
          student: id_number,
          classroom: room,
          is_present: true,
          date: date
        }

        if (attendance.length === 1 && attendance[0].student === '') {
          createAttendance(data).then(response => {
            if (response.status === 201) {
              data.id = response.data.id
              setAttendance([
                data,
              ])
            }
          }).catch(error => {
              console.log(error)
            })
        } else {
          createAttendance(data).then(response => {
            data.id = response.data.id
            if (response.status === 201) {
              setAttendance([
                ...attendance,
                data
              ])
            }
          }).catch(error => {
              console.log('samok!')
            })
        }
      }
    } catch {
      return false;
    }
  }
  

  return (
    <>
      <div className="flex flex-col gap-4">
      {
        (!user.is_student) ? <div className="flex flex-row gap-4">
            <Button className="mb-5" onClick={() => setShowDateModal(true)} >Add Attendance Date</Button>
            <AddStudent />
            <Modal size={'sm'} show={showDateModal} onClose={() => setShowDateModal(false)}>
              <Modal.Header>Set Attendance for Class</Modal.Header>
              <Modal.Body>
                <Datepicker inline onSelectedDateChanged={(event) => onClickAddAttendance(event)} />
              </Modal.Body>
            </Modal> 
        </div> : ''
      }
      </div>
      <div className="max-w-full overflow-auto" style={{maxHeight: "32rem"}}>
        <Table hoverable className="shadow-none drop-shadow-none">
          <Table.Head className="sticky top-0">
            {
              (!user.is_student) ? <><Table.HeadCell>ID Number</Table.HeadCell>
              <Table.HeadCell>Full Name</Table.HeadCell></> : null
            }
            {
              headers.map((obj, index) => <Table.HeadCell key={index}><span className="flex flex-row place-content-center items-center gap-2">{obj.date}<MdOutlineClose className="h-full" /></span></Table.HeadCell>)
            }
          </Table.Head>
          <Table.Body>
            {
              students && students.map((obj, index) => <Table.Row key={index}>
                {
                  (!user.is_student) ? <><Table.Cell>{obj.id_number}</Table.Cell>
                  <Table.Cell>{obj.last_name}, {obj.first_name}</Table.Cell></> : null
                }
                {
                  headers.map((ob,ind) => <Table.Cell key={`${index}`}><span className="flex flex-row place-content-center">{
                    (!user.is_student) ? <Checkbox disabled={(dateNow !== ob.date) ? true : false} checked={getValueOfStudentsTardy(obj.id_number, ob.date)} onChange={() => {onTickCheckBox(obj.id_number, ob.date)}} /> : 
                      <Checkbox disabled checked={getValueOfStudentsTardy(obj.id_number, ob.date)} />
                  }</span></Table.Cell>)
                }
              </Table.Row>
                )
            }
          </Table.Body>
        </Table>
      </div>
    </>
  )
}

export default Attendance;
