import { Button, FileInput, Label, Modal, Select } from "flowbite-react";
import AddClass from "./components/AddClass";
import { ChangeEvent, useEffect, useState } from "react";
import { getDepartments, getSchoolYear, getSections, getSubjects, getYearLevel } from "../../api";
import { useAppSelector } from "../../../../../../hooks";
import { useDispatch } from "react-redux";
import { storeDeparments, storeSchoolYear, storeSections, storeSubjects, storeYearLevel, storeClassRooms } from "../../slice";
import { ClassType, SchoolYear, RoomType } from "../../models";
import { onFileInput } from "./resources";
import Room from '../../components/Room';
import { GetAllSchoolYear, GetAllClasses, createClass } from './api';

export default function Class () {

    const [show, setShow] = useState(false)
    const token = useAppSelector(state => state.auth.token)
    const user = useAppSelector(state => state.auth.user)
    const departments = useAppSelector(state => state.lms.deparments)
    const schoolYear = useAppSelector(state => state.lms.schoolyears)
    const yearLevel = useAppSelector(state => state.lms.year_level)
    const sections = useAppSelector(state => state.lms.sections)
    const subjects = useAppSelector(state => state.lms.subjects)
    
    const [saveLoading, setSaveLoading] = useState(false);
    const [aysem, setaysem] = useState('')
    const [listSY, setSY] = useState<Array<SchoolYear>>([])
    const [rooms, setRoom] = useState<Array<RoomType>>([])

    const dispatch = useDispatch()
    const [data, setData] = useState<ClassType>({
        department: null,
        year_level: null,
        school_year: null,
        section: null,
        subject: null,
        teacher: user.uuid,
        students: []
    })
    

    useEffect(() => {
    
        if (!user.is_student) {

            if (departments.length === 0) {
                getDepartments(token).then(response => {
                    dispatch(storeDeparments(response.data))
                }).catch(error => {
                    console.log(error)
                })
            }

            GetAllSchoolYear().then(response => {
                setSY(response.data);
                dispatch(storeSchoolYear(response.data))
            }).catch(error => {
                    console.log('something went wrong!')
            })
        }

        GetAllClasses().then(response => {
            setRoom(response.data)
            dispatch(storeClassRooms(response.data))
        }).catch(error => {
                console.log('samok!')
            })
        
    }, [])

    const onChangeData = (event:ChangeEvent<HTMLSelectElement>) => {
        
        if (event.target.name === 'department' && schoolYear.length === 0) {
            getSchoolYear(token).then(response => {
                dispatch(storeSchoolYear(response.data))
            })
        }

        if (event.target.name === 'school_year' && event.target.value !== '0' && yearLevel.length === 0) {
            getYearLevel(token).then(response => {
                dispatch(storeYearLevel(response.data))
            })
        }

        if (event.target.name === 'year_level' && data.year_level === null) {
            getSections(token).then(response => {
                dispatch(storeSections(response.data))
            })
        }

        if (event.target.name === 'section' && data.section === null) {
            getSubjects(token).then(response => {
                dispatch(storeSubjects(response.data))
            })
        }
        
        setData({
            ...data,
            [event.target.name] : event.target.value
        });
    }

    const onCloseModal = () => {
        setShow(false)
        setData({
            department: null,
            year_level: null,
            school_year: null,
            section: null,
            subject: null,
            teacher: user.uuid,
            students: []
        })
    }

    const onChangeSelect = (event:React.ChangeEvent<HTMLSelectElement>) => {
        setaysem(event.target.value);
        // should have some request here on what school year and semester.
    }

    const onFileInputChange = async (event:React.ChangeEvent<HTMLInputElement>) => {
        try {
            const classData = await onFileInput(event);
            setData({
                ...data,
                students: classData.students
            })
        } catch (error) {
            console.log(error)
        }
        
    }

    const onClickSave = () => {
        if (data.school_year !== null && 
        data.school_year !== 0 && 
        data.section !== null && 
        data.section !== 0 &&
        data.subject !== null &&
        data.subject !== 0 &&
        data.year_level !== null &&
        data.year_level !== 0 &&
        data.subject !== null &&
        data.subject !== 0 &&
        data.students.length !== 0 &&
        data.teacher
        ) {
            setSaveLoading(true)
            createClass(data).then(response => {
                if (response.status === 200) {
                    console.log(response.data)
                    setSaveLoading(false)
                    onCloseModal();
                } else {
                    setSaveLoading(false)
                    onCloseModal();
                }
            }).catch(error => {
                    console.log(error)
                    setSaveLoading(false)
                    onCloseModal();
                })

        }


    }

    return (
        <div className="max-h-screen">
            <div className="max-w-md py-5">
                { user.is_student ? '' :
                    <Select name="schoolYear" onChange={onChangeSelect}>
                        <option value="0">Select School Year</option>
                        {
                            schoolYear.map(obj => (obj.name != undefined) ? <option key={`schoolyear-${obj.id}`} value={obj.id}>{`${obj.semester} - ${obj.name}`}</option>: '')
                        }
                    </Select>
                }
            </div>
            <div className="grid grid-cols-4 gap-4">
                {
                    rooms.map(obj => <Room key={obj.id} room={`${obj.id}`} subject={obj.subject} instructor={obj.teacher} yearLevel={`${obj.year_level}`} section={obj.section} />)
                }
                {
                    (!user.is_student) ? <AddClass onClick={() => setShow(true)} /> : ''
                }
            </div>
            <Modal show={show} onClose={onCloseModal}>
                <Modal.Header>
                    Add Class
                </Modal.Header>
                <Modal.Body>
                    <div className="flex flex-col gap-4 mb-5">
                        <Label>Department: </Label>
                        <Select name="department" onChange={(event) => onChangeData(event)} value={data.department ?? '0'}>
                            <option value={0}>Select Department</option>
                            {
                                departments.map(obj => <option value={obj.id} key={`dept-${obj.id}`}>{obj.name}</option>)
                            }
                        </Select>
                    </div>
                    <div className="flex flex-col gap-4 mb-5">
                        <Label>School Year: </Label>
                        <Select name="school_year" disabled={(data.department === null) ? true : false} value={data.school_year ?? '0'} onChange={(event) => onChangeData(event)}>
                            <option value={0}>Select School Year</option>
                            {
                                schoolYear.map(obj => <option value={obj.id} key={`sy-${obj.id}`}>{obj.name}</option>)
                            }
                        </Select>
                    </div>
                    <div className="flex flex-row gap-4">
                        <div className="basis-1/2">
                            <Label>Year Level:</Label>
                            <Select name="year_level" disabled={data.school_year === null} value={data.year_level ?? '0'} onChange={(event) => onChangeData(event)}>
                                <option value={0}>Select Year Level</option>
                                {
                                    yearLevel.map(obj => <option value={obj.id} key={`yl-${obj.id}`}>{obj.level}</option>)
                                }
                            </Select>
                        </div>
                        <div className="basis-1/2">
                            <Label>Section</Label>
                            <Select name="section" disabled={data.year_level === null} value={data.section ?? '0'} onChange={(event) => onChangeData(event)}>
                                <option value={0}>Select Section</option>
                                {
                                    sections.map(obj => <option value={obj.id} key={`section-${obj.id}`}>{obj.section}</option>)
                                }
                            </Select>
                        </div>
                    </div>
                    <div className="flex flex-col w-full mt-5">
                        <Label>Subject:</Label>
                        <Select name="subject" disabled={data.section === null} value={data.subject ?? '0'} onChange={(event) => onChangeData(event)}>
                            <option value={0}>Select Subject</option>
                            {
                                subjects.map(obj => <option value={obj.id} key={`subject-${obj.id}`}>{obj.name}</option>)
                            }
                        </Select>
                    </div>
                    <div className="flex flex-col w-full mt-5">
                        <Label>Upload Students:</Label>
                        <FileInput disabled={data.subject === null} accept=".csv" helperText="Please upload file with .csv" onChange={onFileInputChange} />
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button isProcessing={saveLoading} onClick={onClickSave}>Save</Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}
