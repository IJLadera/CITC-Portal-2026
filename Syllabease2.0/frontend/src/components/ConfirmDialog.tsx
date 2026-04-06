import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  doubleConfirm?: boolean;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  doubleConfirm = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (doubleConfirm && step === 1) {
      setStep(2);
      return;
    }
    try {
      setLoading(true);
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
      setStep(1);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 bg-opacity-40 flex items-center justify-center z-60"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="bg-white rounded-sm shadow-xl p-6 w-[90%] max-w-sm text-center"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              {step === 2 ? "Please confirm again" : title}
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              {step === 2
                ? "This is your final confirmation. Proceed with this action?"
                : message}
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  if (step === 2) setStep(1);
                  else onClose();
                }}
                disabled={loading}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
              >
                {cancelText}
              </button>

              <button
                onClick={handleConfirm}
                disabled={loading}
                className={`px-4 py-2 rounded-lg text-white transition ${
                  step === 2
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-green-500 hover:bg-green-600"
                } disabled:opacity-60`}
              >
                {loading ? "Processing..." : confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
