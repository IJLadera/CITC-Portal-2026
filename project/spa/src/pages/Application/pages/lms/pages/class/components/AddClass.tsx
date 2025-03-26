import { Label, Modal, Select, Button } from "flowbite-react";
import { useState } from "react";
import { FaPlus } from "react-icons/fa6";

interface ButtonProps {
    onClick: () => void
}

export default function AddClass({ onClick }: ButtonProps) {

    const [show, setShow] = useState(false)

    return (
        <>
            <a href="/" onClick={(event) => { event.preventDefault(); onClick() }}>
                <div className="h-56 w-auto border-4 rounded-md border-slate-300 border-dashed">
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <FaPlus className="h-10 w-10" />
                    </div>
                </div>
            </a>
        </>
    )
}