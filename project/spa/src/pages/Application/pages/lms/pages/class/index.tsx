import { Button, FileInput, Label, Modal, Select } from "flowbite-react";
import AddClass from "./components/AddClass";
import { ChangeEvent, useEffect, useState } from "react";
import { getDepartments, getSchoolYear, getSections, getSubjects, getYearLevel } from "../../api";
import { useAppSelector } from "../../../../../../hooks";
import { useDispatch } from "react-redux";
import { storeDeparments, storeSchoolYear, storeSections, storeSubjects, storeYearLevel } from "../../slice";
import { ClassType } from "../../models";

export default function Class () {

    const [show, setShow] = useState(false)
    const token = useAppSelector(state => state.auth.token)
    const departments = useAppSelector(state => state.lms.deparments)
    const schoolYear = useAppSelector(state => state.lms.schoolyears)
    const yearLevel = useAppSelector(state => state.lms.year_level)
    const sections = useAppSelector(state => state.lms.sections)
    const subjects = useAppSelector(state => state.lms.subjects)

    const dispatch = useDispatch()
    const [data, setData] = useState<ClassType>({
        department: null,
        year_level: null,
        school_year: null,
        section: null,
        subject: null,
        teacher: null,
        students: []
    })
    

    useEffect(() => {
        if (departments.length === 0) {
            getDepartments(token).then(response => {
                dispatch(storeDeparments(response.data))
            }).catch(error => {
                console.log(error)
            })
        }
        
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
            teacher: null,
            students: []
        })
    }

    return (
        <div className="max-h-screen">
            <div className="grid grid-cols-4 gap-4">
                <AddClass onClick={() => setShow(true)} />
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
                        <FileInput disabled={data.subject === null} accept=".csv" helperText="Please upload file with .csv" />
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button>Save</Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}