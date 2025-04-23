import React, { useState } from 'react';
import { Modal, Button, Label, FileInput } from "flowbite-react";
import DraftEditor from '../unieventify/src/Components/eventComponents/draft components/DraftEditor'; // Import the DraftEditor component
import http from '../../../../http'; // Assuming you're using axios for API calls
import { useAppSelector, useAppDispatch } from '../../../../hooks';
import { appendPost } from './slice'

interface CreatePostProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ isOpen, onClose }) => {
  // const [title, setTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  // const [startDateTime, setStartDateTime] = useState('');
  // const [endDateTime, setEndDateTime] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const token = useAppSelector(state => state.auth.token);
  const dispatch = useAppDispatch()

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImage(event.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    try {
      const formData = new FormData();
      // formData.append('title', title);
      formData.append('description', eventDescription);
      
      // if (startDateTime) {
      //   formData.append('startDateTime', new Date(startDateTime).toISOString());
      // }
      
      // if (endDateTime) {
      //   formData.append('endDateTime', new Date(endDateTime).toISOString());
      // }
      
      if (image) {
        formData.append('image', image);
      }

      const response = await http.post('/lms/post/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Handle successful post
      console.log('Post created:', response.data);
      dispatch(appendPost(response.data))
      // Reset form and close modal
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      // Handle error (show error message, etc.)
    }
  };

  const resetForm = () => {
    // setTitle('');
    setEventDescription('');
    // setStartDateTime('');
    // setEndDateTime('');
    setImage(null);
  };

  return (
    <Modal show={isOpen} size="4xl" onClose={onClose} popup>
      <Modal.Header />
      <Modal.Body>
        <div className="space-y-6">
          <h3 className="text-xl font-medium text-gray-900 dark:text-white">Create a New Post</h3>
          
          {/* Title Input */}
          {/* <div>
            <Label htmlFor="title" value="Title" />
            <input 
              type="text" 
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              placeholder="Enter post title"
            />
          </div> */}

          {/* Date and Time Inputs */}
          {/* <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDateTime" value="Start Date and Time" />
              <input 
                type="datetime-local" 
                id="startDateTime"
                value={startDateTime}
                onChange={(e) => setStartDateTime(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <div>
              <Label htmlFor="endDateTime" value="End Date and Time" />
              <input 
                type="datetime-local" 
                id="endDateTime"
                value={endDateTime}
                onChange={(e) => setEndDateTime(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
          </div> */}

          {/* Image Upload */}
          <div>
            <Label htmlFor="dropzone-file" value="Upload Image" />
            <FileInput 
              id="dropzone-file" 
              helperText="SVG, PNG, JPG or GIF (MAX. 800x400px)"
              onChange={handleImageUpload}
            />
          </div>

          {/* Description Editor */}
          <div>
            <Label value="Description" className="mb-2 block" />
            <DraftEditor 
              eventDescription={eventDescription}
              setEventDescription={setEventDescription}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button color="gray" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!eventDescription}
            >
              Create Post
            </Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default CreatePost;
