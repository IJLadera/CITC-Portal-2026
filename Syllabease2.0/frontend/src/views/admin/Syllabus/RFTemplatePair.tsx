import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaChevronLeft, FaCheckCircle } from "react-icons/fa"; 
import api from "../../../api";  
import { toast } from "react-toastify";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function RFTemplatePairUI() {
  const location = useLocation();
  const navigate = useNavigate();
  const reviewTemplate = location.state; // from previous page 
  const [items, setItems] = useState<any[]>(reviewTemplate?.items || []);

  const predefinedSections = [
    { key: "format", label: "Format" },
    { key: "header_1", label: "Header 1" },
    { key: "header_2", label: "Header 2" },
    { key: "section_1", label: "Section 1" },
    { key: "section_2", label: "Section 2" },
    { key: "section_3", label: "Section 3" },
    { key: "section_4", label: "Section 4" },
    { key: "side_section", label: "Side Section" },
    { key: "course_description", label: "Course Description" },
    { key: "course_outcomes", label: "Course Outcomes" },
    { key: "course_outlines", label: "Course Outlines" },
    { key: "course_requirements", label: "Course Requirements" },
  ];

  // Handle indicator drop into syllabus section
  const handleDragEnd = (result: any) => {
    const { destination, draggableId } = result;
    if (!destination) return;

    const sectionKey = destination.droppableId.replace("section-", "");

    setItems(prev =>
      prev.map(it =>
        it.id === draggableId ? { ...it, syllabus_section: sectionKey } : it
      )
    );
  };

  const handleSaveMapping = async () => {
    try {
      const payload = { ...reviewTemplate, items };
      await api.post("/review-templates/", payload);
      toast.success("✅ Review Form Template setup complete!");
      navigate("/admin/syllabus/review-form-template/");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save mapped review form template.");
    }
  }; 

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 w-full bg-gradient-to-r from-[#eef2ff] to-[#f8fafc] border-b p-3 flex items-center justify-between gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex gap-2 items-center text-blue-700 hover:text-blue-400 hover:bg-blue-50"
        >
          <FaChevronLeft />
          <span className="font-medium">Back to Creating Review Form Template</span>
        </button>

        <button
          onClick={handleSaveMapping}
          className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-400"
        >
          Finish Review Form Template Setup
        </button>
      </div> 
      
      {/* Instruction / Note */}
      <div className="p-4 bg-gradient-to-r from-[#eef2ff] to-[#f8fafc] flex justify-center">
        <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 text-sm text-yellow-800 rounded max-w-xl text-center">
          <span className="font-semibold">Instructions:</span> <br />
          <b>Drag the indicators</b> from the list below and <b>drop them</b>
          <br />into the respective <b>Syllabus Section</b> on the left to assign them.
          <br />
          Assigned indicators will show a{" "}
          <FaCheckCircle className="inline-flex text-green-600 align-text-bottom" />{" "}
          next to the section title.
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex flex-col md:flex-row">
          {/* Left: Syllabus Panel */}
          <div className="md:w-1/2 w-full bg-white shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-3 text-gray-700">
              Syllabus Sections
            </h2> 

            {predefinedSections.map(sec => (
              <Droppable droppableId={`section-${sec.key}`} key={sec.key}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`rounded-lg p-3 mb-3 border transition ${
                      snapshot.isDraggingOver
                        ? "bg-blue-50 border-blue-400"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-800">{sec.label}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-800">
                        {sec.key}
                      </span>
                    </div>

                    <ul className="pl-3 mt-2 space-y-1 text-sm">
                      {items
                        .filter((i) => i.syllabus_section === sec.key)
                        .map((i) => (
                          <li
                            key={i.id}
                            className="bg-blue-100 text-blue-800 rounded px-2 py-1"
                          >
                            {i.text}
                          </li>
                        ))}
                    </ul>

                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </div>

          {/* RIGHT: Review Form Indicators as Table */}
          <div className="md:w-1/2 w-full bg-white border-l">
            <div className="p-4 ">
              {/* Review Form Header */}
              <div className="py-2"> 
                <div className="flex justify-center items-start mb-4">
                  <div className="flex justify-between items-start w-full max-w-5xl">
                    {/* LEFT: Logo + Campus Info */}
                    <div className="flex items-start space-x-4 w-[70%]">
                      <div>
                        <img src="/assets/ustplogo.png" alt="USTP Logo" className="w-30 h-auto" />
                      </div>
                      <div>
                        <h1 className="text-sm font-bold uppercase leading-tight ml-11 p-2 text-center">
                          University of Science and Technology of Southern Philippines
                        </h1>
                        <p className="text-xs text-center mt-1 ml-11">
                          Alubijid | Balubal | Cagayan de Oro | Claveria | Jasaan | Oroquieta | Panaon | Villanueva
                        </p>
                      </div>
                    </div>
                    {/* RIGHT: Document Info Table */}
                    <table className="text-xs text-center border border-gray-400 ml-20">
                      <thead>
                        <tr className="bg-[#001f5f] text-white">
                          <th colSpan={3} className="border border-gray-400 px-3 py-1 text-xs font-semibold">
                            Document Code No.
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td colSpan={3} className="border border-gray-400 py-1 text-sm font-bold text-gray-700">
                            FM-USTP-ACAD-01
                          </td>
                        </tr>
                        <tr className="bg-[#001f5f] text-white">
                          <td className="border border-gray-400 px-1.5 py-1 font-medium text-nowrap">Rev. No.</td>
                          <td className="border border-gray-400 px-1.5 py-1 font-medium text-nowrap">Effective Date</td>
                          <td className="border border-gray-400 px-1.5 py-1 font-medium text-nowrap">Page No.</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 px-1.5 py-1"></td>
                          <td className="border border-gray-400 px-1.5 py-1">{reviewTemplate.effective_date}</td>
                          <td className="border border-gray-400 px-1.5 py-1">#</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-6">
                  <h1 className="text-3xl font-bold text-[#1A0A52]">{reviewTemplate.title}</h1>
                </div>  
              </div>  

              <Droppable droppableId="indicators-pool">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="overflow-x-auto">
                    <table className="w-full table-fixed border border-gray-300 text-sm">
                      <thead>
                        <tr className="bg-gray-300 text-center">
                          <th className="w-[70%] border px-3 py-2 font-semibold">INDICATORS</th>
                          <th className="w-[7%] border px-3 py-2 font-semibold">YES</th>
                          <th className="w-[7%] border px-3 py-2 font-semibold">NO</th>
                          <th className="w-[26%] border px-3 py-2 font-semibold">REMARKS</th>
                        </tr>
                      </thead>

                      <tbody>
                        {items.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-gray-500 italic">
                              (No entries)
                            </td>
                          </tr>
                        ) : (
                          items.map((item, idx) => {
                            if (item.type === "part") {
                              // Part row (non-draggable)
                              return (
                                <tr key={item.id} className="bg-gray-400 font-semibold text-gray-800">
                                  <td colSpan={4} className="border px-3 py-2">{item.text}</td>
                                </tr>
                              );
                            }

                            // Indicator row (draggable)
                            return (
                              <Draggable key={item.id} index={idx} draggableId={item.id}>
                                {(prov) => (
                                  <tr
                                    ref={prov.innerRef}
                                    {...prov.draggableProps}
                                    {...prov.dragHandleProps}
                                    className="hover:bg-gray-50 transition cursor-grab"
                                  >
                                    {/* Indicator text */}
                                    <td className="border px-3 py-2 flex justify-between items-center">
                                      {item.text}
                                      {item.syllabus_section && (
                                        <span className="flex items-center gap-1 text-xs text-green-700 ml-2">
                                          <FaCheckCircle className="text-green-600" />
                                          <span>
                                            {predefinedSections.find(s => s.key === item.syllabus_section)?.label}
                                          </span>
                                        </span>
                                      )}
                                    </td>

                                    {/* YES / NO / Remarks (empty for now) */}
                                    <td className="border px-3 py-2 text-center w-[7%]"></td>
                                    <td className="border px-3 py-2 text-center w-[7%]"></td>
                                    <td className="border px-3 py-2 w-[26%]"></td>
                                  </tr>
                                )}
                              </Draggable>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div> 
        </div>
      </DragDropContext>

      {/* Floating Legend */}
      <div className="fixed bottom-4 right-4 bg-white border rounded-xl shadow-lg p-3 text-xs space-y-2">
        <div className="font-semibold">Legend</div>
        <div className="flex items-center gap-2">
          <FaCheckCircle className="text-green-600" />
          <span>Paired / Matched Indicator</span>
        </div>
        <div className="flex items-center gap-2 text-indigo-700">
          <span className="inline-block w-3 h-3 bg-indigo-100 rounded-full"></span>
          <span>Header Sections</span>
        </div>
        <div className="flex items-center gap-2 text-green-700">
          <span className="inline-block w-3 h-3 bg-green-100 rounded-full"></span>
          <span>Main Sections</span>
        </div>
        <div className="flex items-center gap-2 text-yellow-700">
          <span className="inline-block w-3 h-3 bg-yellow-100 rounded-full"></span>
          <span>Course Info Sections</span>
        </div>
      </div> 
    </div>
  );
}
