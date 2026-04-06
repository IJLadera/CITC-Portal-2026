import React, { useEffect, useState, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../api";

type CourseOutline = {
  id: number;
  row_no?: number;
  syllabus_term: string;

  allotted_hour: number;
  allotted_time?: string;
  intended_learning?: string;
  topics: string;
  suggested_readings?: string;
  learning_activities?: string;
  assessment_tools?: string;
  grading_criteria?: string;
  remarks?: string;

  cotcos: { course_outcome: number }[];
};

function SortableRow({ outline, index }: { outline: CourseOutline; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: outline.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition, 
  };

  const truncateCell = (text: string | undefined, width: string = "w-32") => (
    <div className={`${width} truncate`} title={text}>
      {text}
    </div>
  );

  return (
    <tr ref={setNodeRef} style={style} {...attributes} {...listeners} 
      className={`border cursor-pointer ${
        isDragging ? "bg-sky-100" : "hover:bg-slate-100"
      }`}
    >
      <td className="p-2 text-center cursor-move">
        <i className="fa fa-sort" /> {index + 1}
      </td>
      <td className="p-2">
        {outline.allotted_hour} hrs
        <div>{outline.allotted_time}</div>
      </td>
      <td className="p-2">{truncateCell(outline.intended_learning)}</td>
      <td className="p-2">{truncateCell(outline.topics)}</td>
      <td className="p-2">{truncateCell(outline.suggested_readings)}</td>
      <td className="p-2">{truncateCell(outline.learning_activities)}</td>
      <td className="p-2">{truncateCell(outline.assessment_tools)}</td>
      <td className="p-2">{truncateCell(outline.grading_criteria)}</td>
      <td className="p-2">{truncateCell(outline.remarks)}</td>
    </tr>
  );
}

export default function COTReorder() {
  const { syllabusId, term } = useParams<{ syllabusId: string; term: string }>();
  const activeRole = localStorage.getItem("activeRole");
  const role = activeRole?.toUpperCase();
  const navigate = useNavigate();

  const [outlines, setOutlines] = useState<CourseOutline[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Fetch outlines
  useEffect(() => {
    if (!syllabusId || !term) return;
    api
      .get("/course-outlines/", {
        params: { syllabus_id: syllabusId, syllabus_term: term },
      })
      .then((res) => {
        const normalized = res.data.map((outline: any) => ({
          ...outline,
          cotcos: (outline.course_outcomes || []).map((co: any) => ({
            course_outcome: co.course_outcome_id,
          })),
        }));
        setOutlines(normalized);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [syllabusId, term]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = outlines.findIndex((item) => item.id === active.id);
    const newIndex = outlines.findIndex((item) => item.id === over.id);

    const reordered = arrayMove(outlines, oldIndex, newIndex);
    setOutlines(reordered);

    try {
      await api.post("/course-outlines/reorder/", {
        order: reordered.map((item, idx) => ({
          id: item.id,
          position: idx + 1,
        })),
      });
    } catch (error) {
      console.error("Error saving order:", error);
    }
  };

  // Filter + paginate
  const filteredOutlines = useMemo(() => {
    if (!searchQuery) return outlines;
    return outlines.filter((o) =>
      Object.values(o).some((val) =>
        String(val ?? "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [outlines, searchQuery]);

  const total = filteredOutlines.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, total);
  const paginatedOutlines = filteredOutlines.slice(start, end);

  if (loading) return <p>Loading...</p>;

  const noDataLink = `/${activeRole}/syllabus/${syllabusId}/view/course-outlines/${term}`;

  return (
    <div className="m-auto p-8 bg-slate-100 mt-12 shadow-lg bg-gradient-to-r from-white to-blue-100 rounded-lg w-11/12">
      <img
        className="w-[500px] m-auto mb-8"
        src={
          term?.toLowerCase() === "finals"
            ? "/assets/Re-Order Final Course Outline.png"
            : "/assets/Re-Order Midterm Course Outline.png"
        }
        alt="Reorder Course Outline"
      />

      {/* Search */}
      <div className="mb-4 flex justify-end">
        <input
          type="text"
          placeholder="Search course outlines..."
          className="border rounded p-2 w-1/4 bg-white"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {outlines.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-lg mb-4">No data available, please add course outlines.</p>
          <button
            className="text-blue-600 underline"
            onClick={() => navigate(noDataLink)}
          >
            Go to Add Course Outlines
          </button>
        </div>
      ) : filteredOutlines.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-lg">No course outlines match.</p>
        </div>
      ) : (
        <>
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={paginatedOutlines.map((o) => o.id)} strategy={verticalListSortingStrategy}>
              <table className="table-auto border-collapse w-full bg-white rounded border shadow">
                <thead>
                  <tr className="bg-gray-100 border">
                    <th className="p-2">#</th>
                    <th className="p-2">Allotted Time</th>
                    <th className="p-2">Intended Learning Outcome</th>
                    <th className="p-2">Topics</th>
                    <th className="p-2">Suggested Readings</th>
                    <th className="p-2">Teaching Learning Activities</th>
                    <th className="p-2">Assessment Tools</th>
                    <th className="p-2">Grading Criteria</th>
                    <th className="p-2">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOutlines.map((outline, index) => (
                    <SortableRow key={outline.id} outline={outline} index={start + index} />
                  ))}
                </tbody>
              </table>
            </SortableContext>
          </DndContext>

          {/* Pagination controls */}
          <div className="flex justify-between items-center mt-8">
            <p className="text-sm">
              Showing {start + 1} - {end} of {total} <span className="font-bold">Course Outlines</span>
            </p>
            <div className="flex items-center space-x-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>
              <p>
                {page}/{totalPages}
              </p>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      <hr className="my-6" />
      <p className="text-sm">
        Drag and drop the table rows and <span className="font-semibold">CLICK DONE</span> to
        check the updated order.
      </p>

      <div className="mt-6 flex justify-end">
        <button
          className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
          onClick={() => navigate(`/${activeRole}/syllabus/${syllabusId}/view`)}
        >
          Done
        </button>
      </div>
    </div>
  );
}
