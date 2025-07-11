import { Button, FloatingLabel, Modal, Select } from 'flowbite-react';
import React, { useState, useEffect } from 'react';
import { SubjectType, ModuleType } from '../../../models';
import { getAllSubjects, getAllModules } from '../api';
import Editor from './Editor'

export default function CreateLesson() {
  
  const [modal, setModal] = useState<boolean>();
  const [subjects, setSubjects] = useState<Array<SubjectType>>([]);
  const [modules, setModules] = useState<Array<ModuleType>>([]);
  const [content, setContent] = useState('');

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
      <Button onClick={() => setModal(true)}>Add Lesson</Button>
      <Modal show={modal} size="7xl" onClose={() => setModal(false)}>
        <Modal.Header>
          Add Lesson
        </Modal.Header>
        <Modal.Body>
          <FloatingLabel label="Title" variant="outlined" />
          <div className="flex flex-row gap-5">
            <Select>
              <option value="">Select Module Number</option>
              {
                modules.map(obj => <option value={obj.id}>{obj.name}</option>)
              }
            </Select>
            <Select>
              <option value="">Select Subject</option>
              {
                subjects.map(obj => <option value={obj.id}>{obj.name}</option>)
              }
            </Select>
          </div>
          <div className="pt-5">
            <Editor value={content} onChangeValue={(value:any) => setContent(value)} />
          </div> 
        </Modal.Body>
        <Modal.Footer>
          <div>
            <Button>Save</Button>
          </div>
        </Modal.Footer>
      </Modal>
    </>
  )
}
