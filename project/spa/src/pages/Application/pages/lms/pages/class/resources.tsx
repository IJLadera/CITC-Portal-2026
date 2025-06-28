import { ChangeEvent } from "react";

import Papa from 'papaparse';

type studentType = {
    id_number: string;
    email: string;
    first_name: string;
    last_name: string;
    number: string;
    password: string;
}

type fileDataType = {
    course: string;
    section: string;
    instructor: string;
    sem_acad_year: string;
    students: studentType[];
}


export const onFileInput = (event:ChangeEvent<HTMLInputElement>) => {
    
    const data:fileDataType = {
        course: '',
        section: '',
        instructor: '',
        sem_acad_year: '',
        students: []
    }

    if (event.target.files?.length) {
        const inputFile = event.target.files[0];


        if (inputFile) {
            Papa.parse(inputFile, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const data = results.data;
                    let student_holder = []
                    let instructor = '';
                    let section = '';
                    let acad_year = '';
                    let course = '';
                    
                    data.map((obj,index) => {
                        if (/^\d+$/.test(obj._3)) {
                            let fullName = (obj._4.split(',')[1] != undefined) ? obj._4.split(',') : obj._5.split(',')
                            let first_name = fullName[1]
                            let last_name = fulleName[0]

                            student_holder.push({
                                id_number: obj._3,
                                email: (obj._17 != '') ? obj._17 : obj._19,
                                first_name: first_name,
                                last_name: last_name,
                                number: (obj._20 != '') ? obj._20 : obj.__parsed_extra[0],
                                password: `${last_name.replace(/\s+/g).toLowerCase()}@${obj._3}` 
                            })
                        }
                        if (index == 1) {
                            course = (obj._5 != '') ? obj._5 : obj._6
                            section = (obj._19 != '') ? obj._19 : obj._21
                        }

                        if (index == 11) {
                            instructor = (obj._5.trim() != '') ? obj._5.trim() : obj._6.trim()
                        }
                        
                        if (index == 0) {
                            acad_year = obj["OFFICIAL LIST OF ENROLLED STUDENTS"]
                        }

                        data = {
                            course: course,
                            section: section,
                            instructor: instructor,
                            sem_acad_year: acad_year,
                            students: student_holder
                        }


                    }),
                    error: (error) => {
                        console.log(error);
                    }


                }
            })
        }

    }

    return data;
}
