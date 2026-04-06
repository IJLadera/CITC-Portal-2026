import { useState } from "react";
import { FaMessage } from "react-icons/fa6";
import type { SRFItem } from "../types/syllabus";

interface RemarkIconProps {
  checklistItems?: SRFItem[] | null;
  previousChecklistItems?: SRFItem[] | null;
  showPrevRevisions: boolean;
}

export default function RemarkIcon({
  checklistItems = [],
  previousChecklistItems = [],
  showPrevRevisions,
}: RemarkIconProps) {
  const [showBubble, setShowBubble] = useState(false);

  // Combine current and (optionally) previous review items
  const combinedItems = [
    ...(checklistItems || []),
    ...(showPrevRevisions ? previousChecklistItems || [] : []),
  ];

  // Filter only those with response === "no"
  const itemsWithRemarks = combinedItems.filter(
    (item) => item?.response?.toLowerCase() === "no"
  );

  if (itemsWithRemarks.length === 0) return null;

  return (
    <div className="absolute -top-2 -right-2">
      <div className="relative">
        {/* Icon Button */}
        <button
          onClick={() => setShowBubble(!showBubble)}
          className="text-red-600 hover:text-red-800 rounded-full transition z-20"
          title="View remarks"
        >
          <FaMessage size={22} />
        </button>

        {/* Remarks Bubble */}
        {showBubble && (
          <div className="absolute top-full right-0 mt-2 w-80 bg-white font-sans font- text-gray-800 p-4 rounded-lg shadow-2xl z-30 border border-gray-200">
            {/* Arrow */}
            <div className="absolute -top-2 right-4 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[8px] border-l-transparent border-r-transparent border-b-white"></div>

            <p className="text-left font-semibold text-red-600 mb-3 text-[16px]">
              Remarks ({itemsWithRemarks.length})
            </p>

            {/* Each remark item */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {itemsWithRemarks.map((item, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-md p-2 bg-gray-50 hover:bg-gray-100 transition"
                >
                  <p className="font-medium text-gray-500 text-sm mb-1">
                    {item.item.text}
                  </p>
                  <p className="text-gray-800 text-center rounded-lg text-sm border-2 hover:bg-gray-200 leading-snug">
                    {item.remarks || "No remarks provided."}
                  </p>
                </div>
              ))}
            </div>

            {/* Button */}
            <div className="flex justify-end mt-3">
              <button
                onClick={() => setShowBubble(false)}
                className="rounded-md bg-black text-white hover:bg-gray-800 px-4 py-1 text-[14px] transition"
              >
                OKAY
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
