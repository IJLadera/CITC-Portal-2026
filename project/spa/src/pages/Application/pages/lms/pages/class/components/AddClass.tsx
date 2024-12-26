import { Label, Modal, Select, Button } from "flowbite-react";
import { useState } from "react";
import { FaPlus } from "react-icons/fa6";

export default function AddClass () {

    const [show, setShow] = useState(false)

    return (
        <>
            <a href="/" onClick={(event) => { event.preventDefault(); }}>
                <div className="h-56 w-auto border-4 rounded-md border-slate-300 border-dashed">
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <FaPlus className="h-10 w-10" />
                    </div>
                </div>
            </a>
            <Modal show={show}>
                <Modal.Header>
                    Add Class
                </Modal.Header>
                <Modal.Body>
                    <div className="flex flex-col gap-4 mb-5">
                        <Label>Department: </Label>
                        <Select>
                        </Select>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button>Save</Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}