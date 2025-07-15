import { Button, FloatingLabel, Modal, Select } from 'flowbite-react';
import React, { useState, useEffect } from 'react';
import { SubjectType, ModuleType } from '../../../models';
import { getAllSubjects, getAllModules, createLesson, updateLesson } from '../api';

import Editor from './Editor'

import { LessonType } from '../models';

interface CreateLessonProps {
  isEdit?:boolean;
  id?:string|null;
  lesson?:LessonType|null;
}

const CreateLesson:React.FC<CreateLessonProps> = ({
  isEdit = false,
  id="0",
  lesson=null }) => {
  
  const [modal, setModal] = useState<boolean>();
  const [subjects, setSubjects] = useState<Array<SubjectType>>([]);
  const [modules, setModules] = useState<Array<ModuleType>>([]);
  const [saveProcess, setSaveProcess] = useState<boolean>(false);
  const [data, setData] = useState<LessonType>({
    title: '',
    content: '',
    subject: 0,
    module: 0
  });

  const onUpdateData = (keyword: string, value: any) => {
    setData({
      ...data,
      [keyword] : value
    })
  }

  const onChangeSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    
    if (event.target.name === 'module') {
      onUpdateData('module', event.target.value)
    }

    if (event.target.name === 'subject') {
      onUpdateData('subject', event.target.value)
    }
  }

  const onUpdateLesson = () => {
    setSaveProcess(true)
    updateLesson(id).then(response => {
      console.log(response)
      setSaveProcess(false)
    }).catch(error => {
      console.log('samok!')
      setSaveProcess(false)
    })
  }

  const onSaveLesson = () => {
    setSaveProcess(true)
    createLesson(data).then(response => {
      if (response.status === 201) {
        setSaveProcess(false)
        setData({
          title: '',
          content: '',
          module: 0,
          subject: 0
        })
        setModal(false)
      }
    }).catch(error => {
        console.log('something error here!')
        setSaveProcess(false)
    })
  }

  useEffect(() => {
    getAllSubjects().then(response => {
      setSubjects(response.data);
    })
    
    getAllModules().then(response => {
      setModules(response.data)
    })
  }, [])
  

  return (
    <>
      <Button onClick={() => setModal(true)}>{ (!isEdit) ? 'Add Lesson' : 'Edit' }</Button>
      <Modal show={modal} size="7xl" onClose={() => setModal(false)}>
        <Modal.Header>
          Add Lesson
        </Modal.Header>
        <Modal.Body>
          <FloatingLabel label="Title" variant="outlined" onChange={(event: React.ChangeEvent<HTMLInputElement>) => onUpdateData('title', event.target.value)} />
          <div className="flex flex-row gap-5">
            <Select name="module" onChange={onChangeSelect}>
              <option value="">Select Module Number</option>
              {
                modules.map(obj => <option value={obj.id}>{obj.name}</option>)
              }
            </Select>
            <Select name="subject" onChange={onChangeSelect}>
              <option value="">Select Subject</option>
              {
                subjects.map(obj => <option value={obj.id}>{obj.name}</option>)
              }
            </Select>
          </div>
          <div className="pt-5">
            <Editor value={data.content} onChangeValue={(value:any) => onUpdateData('content', value)} />
          </div> 
        </Modal.Body>
        <Modal.Footer>
          <div>
            {
              (!isEdit) ? <Button isProcessing={saveProcess} onClick={onSaveLesson}>Save</Button> :
              <Button isProcessing={saveProcess} onClick={onUpdateLesson}>Edit</Button>
            }
          </div>
        </Modal.Footer>
      </Modal>
    </>
  )
}


export default CreateLesson
