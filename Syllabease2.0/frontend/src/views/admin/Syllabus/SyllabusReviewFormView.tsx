import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { formatEffectiveDate, formatRevisionNo } from "@/utils/formatters";
import { FaChevronLeft, FaDownload } from "react-icons/fa";
import { Spinner, Button } from "flowbite-react";
import api from "../../../api";
import { PDFDocument, rgb } from "pdf-lib";
import jsPDF from "jspdf";
import html2canvas from "html2canvas"; 
import type { Chairperson } from "@/types/syllabus";

type YesNo = "yes" | "no";

interface ReviewItem {
  id: number;
  type: "part" | "indicator";
  text: string;
  response: YesNo | null;
  remarks: string;
  order: number;
}

interface ReviewField {
  id: number;
  label: string;
  field_type: "text" | "textarea" | "date";
  position: "header" | "footer";
  row: number;
  column: number;
  span_full?: boolean;
  is_required: boolean;
  value: string;
}

interface SRFFormTemplate {
  id: number;
  code_no: string;
  title: string;
  revision_no: number;
  effective_date?: string | null;
  description?: string | null;
  is_active: boolean;
  items: any[];
  fields: any[];
}

interface Syllabus {
  id: number;  
  chair: Chairperson;  
  dean_submitted_at?: string;
  chair_rejected_at?: string;
}

interface SRFForm {
  id: number;
  effective_date: string;
  review_date: string;
  reviewed_by_snapshot: string;
  action?: string;

  syllabus: Syllabus;
}

export default function SyllabusReviewFormView() {
  const { syllabusId } = useParams<{ syllabusId: string }>();
  const activeRole = localStorage.getItem("activeRole");
  const role = activeRole?.toUpperCase();
  const navigate = useNavigate();

  const [items, setItems] = useState<ReviewItem[]>([]);
  const [fields, setFields] = useState<ReviewField[]>([]);
  const [template, setTemplate] = useState<SRFFormTemplate | null>(null);
  const [reviewForm, setReviewForm] = useState<SRFForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!syllabusId) return;
    setLoading(true);

    api
      .get(`/syllabus-review-form/by-syllabus/${syllabusId}/?role=${role}`)
      .then((res) => {
        const data = res.data;
        const formTemplate = data.form_template;
        const checklistItems = data.checklist_items || [];
        const fieldValues = data.field_values || [];

        setReviewForm(data);
        setTemplate(formTemplate);

        const mappedItems: ReviewItem[] = formTemplate.items.map((item: any) => {
          const matchingResponse = checklistItems.find((ci: any) => ci.item === item.id);
          return {
            id: item.id,
            type: item.type,
            text: item.text,
            order: item.order,
            response: matchingResponse?.response || null,
            remarks: matchingResponse?.remarks || "",
          };
        });
        setItems(mappedItems);

        const mappedFields: ReviewField[] = formTemplate.fields.map((f: any) => {
          const matchingValue = fieldValues.find((fv: any) => fv.field === f.id);
          return {
            id: f.id,
            label: f.label,
            field_type: f.field_type || "text",
            position: f.position || "header",
            row: f.row || 0,
            column: f.column || 0,
            span_full: f.span_full || false,
            is_required: f.is_required || false,
            value: matchingValue?.value || "",
          };
        });
        setFields(mappedFields);
      })
      .catch((err) => console.error("Error fetching review form:", err))
      .finally(() => setLoading(false));
  }, [syllabusId]);

  const renderFieldSection = (position: "header" | "footer") => {
    const sectionFields = fields.filter((f) => f.position === position);
    if (sectionFields.length === 0) return null;

    const grouped = sectionFields.reduce<Record<number, ReviewField[]>>((acc, field) => {
      acc[field.row] = acc[field.row] || [];
      acc[field.row].push(field);
      return acc;
    }, {});

    return (
      <div className="mt-6">
        {Object.keys(grouped)
          .sort((a, b) => +a - +b)
          .map((rowKey) => {
            const rowFields = grouped[+rowKey].sort((a, b) => a.column - b.column);
            return (
              <div key={rowKey} className="grid grid-cols-2 gap-x-60 mb-4">
                {rowFields.map((f) => {
                  const isFull = f.field_type === "textarea" || f.span_full;
                  if (f.field_type === "textarea") {
                    return (
                      <div key={f.id} className="col-span-2 text-sm">
                        <label className="font-medium text-gray-800 block mb-1">
                          {f.label} {f.is_required && <span className="text-red-600 ml-0.5">*</span>}
                        </label>
                        <div className="border border-gray-400 rounded-md bg-gray-50 p-2 min-h-16">
                          <p className="text-gray-700 whitespace-pre-wrap">
                            {f.value || ""}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={f.id}
                      className={`col-span-${isFull ? "2" : "1"} text-sm flex items-center flex-wrap`}
                    >
                      <label className="font-medium text-gray-800 whitespace-nowrap mr-2">
                        {f.label}:{" "}
                      </label>
                      <div
                        className="relative inline-block min-w-[100px] max-w-[300px]"
                        style={{ borderBottom: "1px solid #333", paddingBottom: "0.1rem" }}
                      >
                        <span className="text-gray-800 font-medium whitespace-pre-line wrap-break-word">
                          {f.value || ""}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
      </div>
    );
  };

  const handleDownloadPDF = async () => {
    if (!formRef.current) return;

    // DOM refs
    const headerEl = formRef.current.querySelector(".header-section") as HTMLElement;
    const titleEl = formRef.current.querySelector(".syllabus-title") as HTMLElement;

    // // TEMP modifications for screenshot
    // if (headerEl) headerEl.style.display = "none";
    // if (titleEl) titleEl.style.display = "block";

    const originalLineHeight = formRef.current.style.lineHeight;
    formRef.current.style.setProperty("line-height", "1", "important");

    try {  
      setIsDownloading(true);

      // ---------------------------------------------------
      // 1️⃣ Capture header-section (via querySelector)
      // ---------------------------------------------------
      const headerCanvas = await html2canvas(
        document.querySelector(".header-section") as HTMLElement,
        { scale: 2, useCORS: true }
      ); 
      const headerImg = headerCanvas.toDataURL("image/png", 0.8);

      // Validate PNG signature
      if (!headerImg.startsWith("data:image/png;base64,iVBORw0KGgo")) {
        console.error("Invalid header PNG:", headerImg.slice(0, 50));
        throw new Error("Header PNG corrupted (CORS or hidden element).");
      }

      // 2️⃣ THEN temporarily hide stuff
      headerEl.style.display = "none";
      titleEl.style.display = "block";

      // Create a PDF just to embed header page
      const headerPdf = new jsPDF("p", "mm", "letter");
      const pdfWidth = headerPdf.internal.pageSize.getWidth();
      const headerHeight =
        (headerCanvas.height * (pdfWidth - 20)) / headerCanvas.width;

      headerPdf.addImage(headerImg, "PNG", 10, 10, pdfWidth - 20, headerHeight);

      const headerPdfBytes = headerPdf.output("arraybuffer"); 

      // ---------------------------------------------------
      // 2️⃣ Capture full page content
      // ---------------------------------------------------
      const canvas = await html2canvas(formRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/jpeg", 0.8);
      
      const contentPdf = new jsPDF("p", "mm", "letter"); 
      const pdfHeight = contentPdf.internal.pageSize.getHeight();

      const marginTop = headerHeight + 12;
      const marginBottom = 20;
      const printableWidth = pdfWidth - 20;

      const imgProps = contentPdf.getImageProperties(imgData); 
      const imgHeight = (imgProps.height * printableWidth) / imgProps.width;

      // Create paginated image slices
      let yOffset = 0; // canvas pixel offset 
      const pageHeightPx =
        (pdfHeight - marginTop - marginBottom) *
        (canvas.height / imgHeight);

      while (yOffset < canvas.height) {
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = Math.min(pageHeightPx, canvas.height - yOffset);

        const ctx = pageCanvas.getContext("2d")!;
        ctx.drawImage(
          canvas,
          0,
          yOffset,
          canvas.width,
          pageCanvas.height,
          0,
          0,
          canvas.width,
          pageCanvas.height
        );

        const pageImg = pageCanvas.toDataURL("image/jpeg", 0.85);
        const pageImgHeight = (pageCanvas.height * printableWidth) / canvas.width;

        contentPdf.addImage(pageImg, "JPEG", 10, marginTop, printableWidth, pageImgHeight);

        yOffset += pageHeightPx;

        if (yOffset < canvas.height) contentPdf.addPage();
      }

      const contentPdfBytes = contentPdf.output("arraybuffer");
  
      // 3️⃣ MERGE: overlay header on every content page
      const finalPdf = await PDFDocument.create(); 
      const headerDoc = await PDFDocument.load(headerPdfBytes);
      const contentDoc = await PDFDocument.load(contentPdfBytes);

      const [headerPage] = await headerDoc.copyPages(headerDoc, [0]);
      const contentPages = await contentDoc.copyPages(contentDoc, contentDoc.getPageIndices());

      const embeddedHeader = await finalPdf.embedPage(headerPage);
      const embeddedContentPages = await Promise.all(
        contentPages.map((p) => finalPdf.embedPage(p))
      );
 
      // ---------------------------------------------------
      // 4️⃣ Add pages + overlay header + content + page numbers
      // ---------------------------------------------------
      const totalPages = embeddedContentPages.length;

      // 4️⃣ Draw each page with dynamic page numbers
      embeddedContentPages.forEach((cPage, i) => {
        const page = finalPdf.addPage([embeddedHeader.width, embeddedHeader.height]);

        // Draw the header
        page.drawPage(embeddedHeader);

        // Draw the content over the header
        page.drawPage(cPage, { x: 0, y: 0 });

        // Page number top-right
        const text = `${i + 1} of ${totalPages}`;
        const fontSize = 7.5;
        const rightMargin = 33;
        const topMargin = 80;

        page.drawText(text, {
          x: embeddedHeader.width - rightMargin - text.length * (fontSize * 0.5),
          y: embeddedHeader.height - topMargin,
          size: fontSize,
        });
      }); 
      const finalPdfBytes = await finalPdf.save(); 

      // ---------------------------------------------------
      // 5️⃣ Download merged PDF
      // ---------------------------------------------------
      const blob = new Blob([new Uint8Array(finalPdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob); 

      const a = document.createElement("a");
      a.href = url;
      a.download = `${template?.title || "syllabus"}_review.pdf`;
      a.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF generation error:", error);
    } finally {
      // Restore elements
      if (headerEl) headerEl.style.display = "";
      if (titleEl) titleEl.style.display = "";
      formRef.current.style.lineHeight = originalLineHeight || "";
      setIsDownloading(false);
    }
  };

  return (
    <>
      <style>{`body { line-height: 0.5 !important; }`}</style>
    
      <div className="w-full flex flex-col min-h-screen mt-10">
        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="flex flex-col items-center space-y-3">
              <Spinner size="xl" color="purple" aria-label="Loading syllabus..." />
              <span className="text-white text-lg font-semibold">Loading syllabus...</span>
            </div>
          </div>
        )}

        {!reviewForm && !loading && (
          <div className="p-10 text-center text-red-500">Review Form not found.</div>
        )}

        <div className="flex justify-between items-center pl-10 py-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex gap-2 items-center p-2 rounded-full text-white bg-transparent hover:bg-white/10 hover:text-gray-200 transition"
          >
            <FaChevronLeft size={22} /> Back to Syllabus
          </button>

          <Button
            color="blue"
            className="flex gap-2 items-center"
            disabled={isDownloading}
            onClick={handleDownloadPDF}
          >
            <FaDownload size={18} className={isDownloading ? "opacity-20" : ""} />
            {isDownloading ? "Downloading..." : "Download Review Form PDF"}
          </Button>
        </div>

        <main className="flex flex-1 max-w-5xl mx-auto justify-center bg-white rounded-lg p-8 px-12">
          <div
            ref={formRef}
            className="w-full bg-white px-2 flex flex-col justify-between min-h-[297mm]"
          >
            {/* Header Section */} 
            <div className="header-section p2-4">
              <div className="flex justify-center items-start">
                <div className="flex justify-between items-start w-full max-w-5xl">
                  <div className="flex items-start space-x-4 w-full">
                    <img src="/assets/ustplogo.png" alt="USTP Logo" className="w-25 h-auto" />
                    <div className="">
                      <h1 className="text-lg font-bold uppercase leading-tight p-2 text-center">
                        University of Science and Technology of Southern Philippines
                      </h1>
                      <p className="text-sm text-center">
                        Alubijid | Balubal | Cagayan de Oro | Claveria | Jasaan | Oroquieta | Panaon | Villanueva
                      </p>
                    </div>
                  </div>
                  <table className="text-xs text-center border border-gray-400">
                    <thead>
                      <tr className="bg-[#001f5f] text-white">
                        <th colSpan={3} className="border border-gray-400 px-3 py-0.5 text-xs font-bold">Document Code No.</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={3} className="border border-gray-400 text-sm font-bold py-0.5 text-gray-700">FM-USTP-ACAD-01</td>
                      </tr>
                      <tr className="bg-[#001f5f] text-white">
                        <td className="border border-gray-400 px-1.5 py-0.5 text-nowrap">Rev. No.</td>
                        <td className="border border-gray-400 px-1.5 py-0.5 text-nowrap">Effective Date</td>
                        <td className="border border-gray-400 px-1.5 py-0.5 text-nowrap">Page No.</td>
                      </tr>
                      <tr className="text-black">
                        <td className="border border-gray-400 px-1.5 py-1">{formatRevisionNo(template?.revision_no)}</td>
                        <td className="border border-gray-400 px-1.5 py-1">{formatEffectiveDate(reviewForm?.effective_date)}</td>
                        <td className="border border-gray-400 px-1.5 py-1"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="syllabus-title">
              <h1 className="text-3xl font-bold text-[#1A0A52]">SYLLABUS REVIEW FORM</h1>
            </div>

            {renderFieldSection("header")}

            {/* Review Table */}
            <div className="relative overflow-visible">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-[#A1A1A1] text-center">
                      <th className="w-[70%] border px-3 py-2 font-semibold">INDICATORS</th>
                      <th className="w-[7%] border px-3 py-2 text-center font-semibold">YES</th>
                      <th className="w-[7%] border px-3 py-2 text-center font-semibold">NO</th>
                      <th className="w-[26%] border px-3 py-2 font-semibold">REMARKS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-500 italic">(No entries)</td>
                      </tr>
                    ) : (
                      items.map((item) =>
                        item.type === "part" ? (
                          <tr key={item.id} className="bg-[#c6c6c6] font-semibold text-gray-800">
                            <td colSpan={4} className="border px-3 py-2">{item.text}</td>
                          </tr>
                        ) : (
                          <tr key={item.id} className="hover:bg-gray-50 transition">
                            <td className="border bg-[#c6c6c6] px-3 py-3 w-[70%] wrap-break-word">{item.text}</td>
                            <td className="border px-3 py-3 text-center w-[7%]">{item.response === "yes" ? "✓" : ""}</td>
                            <td className="border px-3 py-3 text-center w-[7%]">{item.response === "no" ? "✓" : ""}</td>
                            <td className="border px-3 py-2 w-[26%] min-w-[150px] align-top">
                              <p className="whitespace-pre-wrap wrap-break-word text-gray-800 leading-snug">{item.remarks?.trim() || ""}</p>
                            </td>
                          </tr>
                        )
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {renderFieldSection("footer")}

            {/* Reviewed Info */} 
            <div className="mt-8 space-y-6 reviewed-info"  style={{ lineHeight: 1 }} >
              <div>
                <p className="mb-4">Reviewed by:</p>
                <div className="mb-8 relative w-80"> 
                  {(reviewForm?.syllabus.dean_submitted_at || reviewForm?.syllabus.chair_rejected_at) && reviewForm?.syllabus.chair.signature && (
                    <img
                      src={reviewForm?.syllabus.chair.signature}
                      alt="Chairperson's Signature"
                      className="h-14 object-contain absolute left-2/5 -translate-x-1/2 -top-10 opacity-90"
                    />
                  )}
                  <p className="font-bold">{reviewForm?.reviewed_by_snapshot}</p>
                  <div className="border-t border-black w-80"></div>
                  <p className="italic text-sm">Program Chairman/Unit Coordinator</p>
                </div>
                <div>
                  <p className="font-bold">{reviewForm?.review_date}</p>
                  <div className="border-t border-black w-80"></div>
                  <p className="italic text-sm">Date of review</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
