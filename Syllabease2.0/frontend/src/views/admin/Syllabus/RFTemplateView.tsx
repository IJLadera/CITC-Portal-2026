import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { formatEffectiveDate, formatRevisionNo } from "@/utils/formatters";
import { FaChevronLeft } from "react-icons/fa";
import api from "../../../api";

// Interfaces/Types
type FieldType = "text" | "textarea" | "date";

interface ReviewFormField {
  id: number;
  label: string;
  field_type: FieldType;
  is_required: boolean;
  position: "header" | "footer";
  row: number;
  column: number; 
  span_full?: boolean;
} 

interface ReviewItem {
  id: number;
  type: "part" | "indicator";
  text: string;
  order: number;
}

interface RFTemplate {
  id: number;
  title: string;
  revision_no: number;
  effective_date?: string | null;
  description?: string | null;
  is_active: boolean;
  
  items: ReviewItem[];
  fields: ReviewFormField[]; 
}

export default function RFTemplateView() { 
  const { rfId } = useParams<{ rfId: string }>();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<RFTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  /** ✅ Fetch template details */
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const res = await api.get(`/review-templates/${rfId}/`);
        setTemplate(res.data);
      } catch (err) {
        console.error("Failed to load template:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, [rfId]);

    // ✅ Improved: render fields inline with underlines or boxes like a real document
  const renderFieldSection = (position: "header" | "footer") => {
    if (!template?.fields) return null;

    const sectionFields = template.fields.filter((f) => f.position === position);
    if (sectionFields.length === 0) return null;

    const grouped = sectionFields.reduce<Record<number, ReviewFormField[]>>((acc, field) => {
      acc[field.row] = acc[field.row] || [];
      acc[field.row].push(field);
      return acc;
    }, {});

    return (
      <div className="mt-6">
        {Object.keys(grouped)
          .sort((a, b) => +a - +b)
          .map((rowKey: any) => {
            const rowFields = grouped[rowKey].sort((a, b) => a.column - b.column);

            return (
              <div
                key={rowKey}
                className="grid grid-cols-2 gap-x-8 mb-4"
              >
                {rowFields.map((f) => {
                  const isFull = f.field_type === "textarea" || f.span_full;

                  // Handle textarea fields (full width)
                  if (f.field_type === "textarea") {
                    return (
                      <div key={f.id} className="col-span-2 text-sm">
                        <label className="font-medium text-gray-800 block mb-1">
                          {f.label}
                          {f.is_required && <span className="text-red-600 ml-0.5">*</span>}
                        </label>
                        <div className="border border-gray-400 rounded-md h-20 bg-gray-50"></div>
                      </div>
                    );
                  }

                  // Handle text/date fields (inline underline)
                  return (
                    <div
                      key={f.id}
                      className={`col-span-${isFull ? "2" : "1"} text-sm flex items-center flex-wrap`}
                    >
                      <label className="font-medium text-gray-800 whitespace-nowrap mr-2">
                        {f.label}:
                        {f.is_required && <span className="text-red-600 ml-0.5">*</span>}
                      </label>
                      <div
                        className="flex-1 border-b border-gray-700"
                        style={{
                          height: "1.2rem",
                          minWidth: "100px",
                        }}
                      ></div>
                    </div>
                  );
                })}
              </div>
            );
          })}
      </div>
    );
  };

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Loading...</div>;
  }

  if (!template) {
    return <div className="p-10 text-center text-red-500">Template not found.</div>;
  }

  return (
    <div className="w-full flex flex-col min-h-screen bg-gray-100">
      {/* Top Buttons */}
      <div className="flex justify-between items-center px-10 py-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex gap-2 items-center p-2 rounded-full text-blue-700 bg-transparent hover:bg-white/10 hover:text-blue-400 transition"
        >
          <FaChevronLeft size={22} color="#1C64F2" />
          Back to Template List
        </button>
      </div>

      <main className="flex justify-center flex-1 py-10 px-4">
        <div className="w-full max-w-5xl bg-white rounded-lg shadow-md border border-gray-200 p-8">
          
          {/* Document Header */}
          <div className="px-6 py-4"> 
            <div className="flex justify-center items-start mb-4">
              <div className="flex justify-between items-start w-full max-w-5xl">
                {/* LEFT: Logo + Campus Info */}
                <div className="flex items-start space-x-4 w-[70%]">
                  <div>
                    <img src="/assets/ustplogo.png" alt="USTP Logo" className="w-30 h-auto" />
                  </div>
                  <div>
                    <h1 className="text-md font-bold uppercase leading-tight ml-11 p-2 text-center">
                      University of Science and Technology of Southern Philippines
                    </h1>
                    <p className="text-sm mt-1 ml-11">
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
                      <td className="border border-gray-400 px-1.5 py-1">{formatRevisionNo(template.revision_no)}</td>
                      <td className="border border-gray-400 px-1.5 py-1">{formatEffectiveDate(template.effective_date)}</td>
                      <td className="border border-gray-400 px-1.5 py-1">#</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6">
              <h1 className="text-3xl font-bold text-[#1A0A52]">{template.title.toUpperCase()}</h1>
            </div>  
          </div> 

          <div className="mt-6 px-6">
            {renderFieldSection("header")}
          </div>

          {/* Indicator Table */}
          <div className="px-6 relative overflow-visible">
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-[#A1A1A1] text-center">
                    <th className="w-[60%] border px-3 py-2 font-semibold">
                      INDICATORS
                    </th>
                    <th className="w-[10%] border px-3 py-2 text-center font-semibold">
                      YES
                    </th>
                    <th className="w-[10%] border px-3 py-2 text-center font-semibold">
                      NO
                    </th>
                    <th className="w-[20%] border px-3 py-2 font-semibold">
                      REMARKS
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {template.items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500">
                        (No entries)
                      </td>
                    </tr>
                  ) : (
                    template.items.map((item) => (
                      <tr
                        key={item.id}
                        className={`${
                          item.type === "part"
                            ? "bg-[#c6c6c6] font-semibold"
                            : ""
                        }`}
                      >
                        <td
                          className="border px-3 py-3 align-top bg-[#c6c6c6]"
                          colSpan={item.type === "part" ? 4 : 1}
                        >
                          <span>{item.text}</span>
                        </td>
                        
                        {item.type === "indicator" && (
                          <td className="border px-3 py-3 text-center">
                              <input type="checkbox" disabled />
                          </td> 
                        )}
                        {item.type === "indicator" && (
                          <td className="border px-3 py-3 text-center">
                              <input type="checkbox" disabled />
                          </td> 
                        )} 
                        {item.type === "indicator" && (
                          <td className="border px-3 py-3">
                              <input
                                disabled
                                className="w-full border rounded px-2 py-1 bg-gray-100"
                                placeholder="Remarks"
                              />
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div> 

          <div className="mt-6 px-6">
            {renderFieldSection("footer")}
          </div> 

          {/* Review Form Bottom Information */}
          <div className="mt-2 px-6 text-sm font-medium">    
            <p className="mb-4">Reviewed by:</p> 
            <div className="mb-8">
              <p className="font-bold"></p>
              <div className="border-t border-black w-80"></div>
              <p className="italic">Program Chairman/Unit Coordinator</p>
            </div>

            <div>
              <p className="font-bold"></p>
              <div className="border-t border-black w-80"></div>
              <p className="italic">Date of review</p>
            </div> 
          </div>

          {/* Footer Info */}
          <div className="mt-10 text-sm text-gray-600 px-6">
            <p>
              <strong>Status:</strong> {template.is_active ? "Active" : "Inactive"}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
