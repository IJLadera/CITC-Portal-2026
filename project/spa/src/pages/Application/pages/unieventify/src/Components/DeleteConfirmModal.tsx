import { Button, Modal } from "flowbite-react";
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { TextField } from "@mui/material";

interface DeleteConfirmModalProps {
  name: string;
  openModal: boolean;
  setOpenModal: (value: boolean) => void;
  handleDelete: () => void;
  type: string;
  // original remark: string;
  remark: null | string;
  setRemark: (value: string) => void;
}

export function DeleteConfirmModal({
  name,
  openModal,
  setOpenModal,
  handleDelete,
  type,
  remark,
  setRemark,
}: DeleteConfirmModalProps) {
  return (
    <div>
      <Modal
        show={openModal}
        size="md"
        onClose={() => setOpenModal(false)}
        popup
      >
        <Modal.Header />
        <Modal.Body>
          <div className="text-center">
            <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
            <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
              Are you sure you want to {type} this {name}?
            </h3>
            {(type === "cancel" || type === "disapprove") && (
              <TextField
                multiline
                rows={4}
                fullWidth
                label="Remark"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                required
              />
            )}
            <div className="flex justify-center gap-4">
              <Button color="failure" onClick={handleDelete}>
                {"Yes, I'm sure"}
              </Button>
              <Button color="gray" onClick={() => setOpenModal(false)}>
                No, cancel
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}
