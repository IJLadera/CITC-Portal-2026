import { Button, Label, Modal, Select } from "flowbite-react";
import AddClass from "./components/AddClass";
import { useState } from "react";

export default function Class () {

    const [show, setShow] = useState(false)

    return (
        <div className="max-h-screen">
            <div className="grid grid-cols-4 gap-4">
                <AddClass onClick={() => setShow(true)} />
            </div>
            <Modal show={show} onClose={() => setShow(false)}>
                <Modal.Header>
                    Add Class
                </Modal.Header>
                <Modal.Body>
                    <div className="flex flex-col gap-4 mb-5">
                        <Label>Department: </Label>
                        <Select>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-4 mb-5">
                        <Label>School Year: </Label>
                        <Select>
                        </Select>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button>Save</Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}