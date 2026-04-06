import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaChevronLeft, FaCheckCircle, FaSearch } from "react-icons/fa";

// Types
export type Indicator = {
  id: string; // e.g., "I1"
  title: string;
  description?: string;
  syllabusAnchor: string; // element id in the syllabus panel
};

export type IndicatorState = {
  yes: boolean | null; // YES or NO (null = unanswered)
  remarks: string;
  paired: boolean; // checked if the syllabus field matches this indicator
};

// Sample indicator list
const INDICATORS: Indicator[] = [
  {
    id: "I1",
    title: "Course Title matches and is clearly stated",
    syllabusAnchor: "syllabus-course-title",
  },
  {
    id: "I2",
    title: "Course Code matches template",
    syllabusAnchor: "syllabus-course-code",
  },
  {
    id: "I3",
    title: "Credit Units follow standard format",
    syllabusAnchor: "syllabus-credits",
  },
  {
    id: "I4",
    title: "Instructor name and contact details present",
    syllabusAnchor: "syllabus-instructor",
  },
  {
    id: "I5",
    title: "Consultation schedule is included",
    syllabusAnchor: "syllabus-consultation",
  },
  {
    id: "I6",
    title: "Course Description present and aligned",
    syllabusAnchor: "syllabus-description",
  },
  {
    id: "I7",
    title: "Course Outcomes are listed",
    syllabusAnchor: "syllabus-outcomes",
  },
  {
    id: "I8",
    title: "Course Outline has topics/assessments",
    syllabusAnchor: "syllabus-outline",
  },
];

const IndicatorBadge: React.FC<{
  id: string;
  active?: boolean;
  onClick?: () => void;
}> = ({ id, active, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "inline-flex items-center justify-center rounded-full border text-[10px] leading-none px-2 py-1 font-semibold " +
        (active
          ? "bg-yellow-300 border-yellow-600 text-black"
          : "bg-gray-200 border-gray-400 text-gray-800 hover:bg-gray-300")
      }
      title={`Indicator ${id}`}
    >
      {id}
    </button>
  );
};

// Simplified PairingHeader (progress indicators removed)
const PairingHeader: React.FC = () => {
  return (
    <div className="sticky top-0 z-40 w-full bg-gradient-to-r from-[#eef2ff] to-[#f8fafc] border-b p-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <button className="flex gap-2 items-center text-blue-700 hover:text-blue-500">
          <FaChevronLeft />
          <span className="font-medium">Back to Creating Reviewform Template</span>
        </button>
      </div>
      <div className="flex items-center gap-3">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700">
          Finish Review form template Setup
        </button>
      </div>
    </div>
  );
};

const SyllabusPanel: React.FC<{
  activeAnchor: string | null;
  onBadgeClick: (anchor: string) => void;
}> = ({ activeAnchor, onBadgeClick }) => {
  return (
    <div className="h-[calc(100vh-64px)] overflow-auto border-r border-gray-300 p-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start space-x-4 w-[70%]">
          <img src="/assets/ustplogo.png" alt="USTP Logo" className="w-16 h-auto" />
          <div>
            <h1 className="text-[13px] font-bold uppercase leading-tight text-center">
              University of Science and Technology of Southern Philippines
            </h1>
            <p className="text-[11px] mt-1">
              Alubijid | Balubal | Cagayan de Oro | Claveria | Jasaan | Oroquieta | Panaon | Villanueva
            </p>
          </div>
        </div>
        <table className="text-[10px] text-center border border-gray-400">
          <thead>
            <tr className="bg-[#001f5f] text-white">
              <th colSpan={3} className="border border-gray-400 px-3 py-1 font-semibold">
                Document Code No.
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={3} className="border border-gray-400 py-1 font-bold text-gray-700">
                FM-USTP-ACAD-01
              </td>
            </tr>
            <tr className="bg-[#001f5f] text-white">
              <td className="border border-gray-400 px-2 py-1">Rev. No.</td>
              <td className="border border-gray-400 px-2 py-1">Effective Date</td>
              <td className="border border-gray-400 px-2 py-1">Page No.</td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-1">1</td>
              <td className="border border-gray-400 px-2 py-1">2025-11-08</td>
              <td className="border border-gray-400 px-2 py-1">1</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Main Syllabus box */}
      <div className="border-2 border-black">
        {/* Description Row */}
        <div className="grid grid-cols-3 border-b-2 border-black">
          <div className="col-span-1 border-r-2 border-black p-2 flex items-center justify-between">
            <span className="font-semibold">Description</span>
            <IndicatorBadge
              id="I1"
              active={activeAnchor === "syllabus-course-title"}
              onClick={() => onBadgeClick("syllabus-course-title")}
            />
          </div>
          <div className="col-span-2 p-2 text-[12px]">
            <span className="font-bold underline" id="syllabus-course-title">
              Syllabus
            </span>
            <br />
            Course Title: <b>Introduction to Computing</b>{" "}
            <IndicatorBadge
              id="I1"
              active={activeAnchor === "syllabus-course-title"}
              onClick={() => onBadgeClick("syllabus-course-title")}
            />
            <br />
            Course Code: <b id="syllabus-course-code">IT111</b>{" "}
            <IndicatorBadge
              id="I2"
              active={activeAnchor === "syllabus-course-code"}
              onClick={() => onBadgeClick("syllabus-course-code")}
            />
            <br />
            Credits: <b id="syllabus-credits">3 Units (3 hrs lecture, 3 hrs laboratory)</b>{" "}
            <IndicatorBadge
              id="I3"
              active={activeAnchor === "syllabus-credits"}
              onClick={() => onBadgeClick("syllabus-credits")}
            />
          </div>
        </div>

        {/* Two columns: Left long panel + Right info */}
        <div className="grid grid-cols-3">
          {/* Left panel */}
          <div className="col-span-1 border-r-2 border-black p-3 space-y-6">
            <div>
              <h3 className="font-bold">USTP Vision</h3>
              <p>
                The University is a nationally recognized Science and Technology University providing the vital link
                between education and the economy.
              </p>
            </div>

            <div>
              <h3 className="font-bold">USTP Mission</h3>
              <ul className="list-disc ml-5 text-[12px]">
                <li>Bring the world of work (industry) into the actual higher education and training of students.</li>
                <li>Offer entrepreneurs the opportunity to maximize their business potentials through services from product conceptualization to commercialization.</li>
                <li>Contribute to national development through technological solutions.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold">Program Outcomes</h3>
              <ol className="list-decimal ml-5 text-[12px]">
                <li>Apply knowledge of computing.</li>
                <li>Use current tools and techniques.</li>
                <li>Analyze complex computing problems.</li>
                <li>Design and evaluate systems.</li>
                <li>Communicate effectively.</li>
              </ol>
            </div>
          </div>

          {/* Right panel */}
          <div className="col-span-2 p-3 space-y-3">
            <div className="space-y-1 text-[12px]">
              <p id="syllabus-instructor">
                <b>Instructor:</b> Engr. Juan Carlos Valdevieso — sample@ustp.edu.ph{" "}
                <IndicatorBadge
                  id="I4"
                  active={activeAnchor === "syllabus-instructor"}
                  onClick={() => onBadgeClick("syllabus-instructor")}
                />
              </p>
              <p id="syllabus-consultation">
                <b>Consultation Schedule:</b> Wednesday 9:30–11:00 AM{" "}
                <IndicatorBadge
                  id="I5"
                  active={activeAnchor === "syllabus-consultation"}
                  onClick={() => onBadgeClick("syllabus-consultation")}
                />
              </p>
            </div>

            <div className="border-t border-black pt-3" id="syllabus-description">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">I. Course Description</h3>
                <IndicatorBadge
                  id="I6"
                  active={activeAnchor === "syllabus-description"}
                  onClick={() => onBadgeClick("syllabus-description")}
                />
              </div>
              <p className="text-[12px] mt-1">
                This course introduces fundamental concepts in the field of Human Computer Interaction and will introduce students
                to basic notions such as interaction paradigms, human factors, design processes, and evaluation methods.
              </p>
            </div>

            <div id="syllabus-outcomes">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">II. Course Outcomes (CO)</h3>
                <IndicatorBadge
                  id="I7"
                  active={activeAnchor === "syllabus-outcomes"}
                  onClick={() => onBadgeClick("syllabus-outcomes")}
                />
              </div>
              <table className="w-full border border-black mt-2 text-center text-[11px]">
                <thead>
                  <tr>
                    <th className="border border-black p-1">CO</th>
                    <th className="border border-black p-1">a</th>
                    <th className="border border-black p-1">b</th>
                    <th className="border border-black p-1">c</th>
                    <th className="border border-black p-1">d</th>
                    <th className="border border-black p-1">e</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black p-1">CO1</td>
                    <td className="border border-black p-1">I</td>
                    <td className="border border-black p-1">E</td>
                    <td className="border border-black p-1">D</td>
                    <td className="border border-black p-1">E</td>
                    <td className="border border-black p-1">D</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div id="syllabus-outline">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">III. Course Outline</h3>
                <IndicatorBadge
                  id="I8"
                  active={activeAnchor === "syllabus-outline"}
                  onClick={() => onBadgeClick("syllabus-outline")}
                />
              </div>
              <table className="w-full border border-black mt-2 text-[11px]">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-black p-1">Allocated Time</th>
                    <th className="border border-black p-1">Course Topics</th>
                    <th className="border border-black p-1">ILO</th>
                    <th className="border border-black p-1">Suggested Readings</th>
                    <th className="border border-black p-1">Activities</th>
                    <th className="border border-black p-1">Assessment</th>
                    <th className="border border-black p-1">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-1 border-black">MIDTERM EXAMINATION</td>
                    <td className="border p-1 border-black"></td>
                    <td className="border p-1 border-black"></td>
                    <td className="border p-1 border-black"></td>
                    <td className="border p-1 border-black"></td>
                    <td className="border p-1 border-black"></td>
                    <td className="border p-1 border-black"></td>
                  </tr>
                  <tr>
                    <td className="border p-1 border-black">FINAL EXAMINATION</td>
                    <td className="border p-1 border-black"></td>
                    <td className="border p-1 border-black"></td>
                    <td className="border p-1 border-black"></td>
                    <td className="border p-1 border-black"></td>
                    <td className="border p-1 border-black"></td>
                    <td className="border p-1 border-black"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReviewPanel: React.FC<{
  indicators: Indicator[];
  state: Record<string, IndicatorState>;
  setState: (id: string, next: Partial<IndicatorState>) => void;
  onJump: (anchor: string) => void;
}> = ({ indicators, state, setState, onJump }) => {
  const [filter, setFilter] = useState<string>("");

  const filtered = useMemo(() => {
    if (!filter.trim()) return indicators;
    const q = filter.toLowerCase();
    return indicators.filter((it) =>
      [it.id, it.title, it.description].join(" ").toLowerCase().includes(q)
    );
  }, [filter, indicators]);

  return (
    <div className="h-[calc(100vh-64px)] overflow-auto p-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[#1A0A52] mb-2">SYLLABUS REVIEW FORM</h1>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block font-semibold text-sm mb-1">Title</label>
            <input type="text" defaultValue="Syllabus Review Form" className="border rounded px-3 py-2 w-full" />
          </div>
          <div>
            <label className="block font-semibold text-sm mb-1">Effective Date</label>
            <input type="date" className="border rounded px-3 py-2 w-full" />
          </div>
          <div className="col-span-2">
            <label className="block font-semibold text-sm mb-1">Description</label>
            <textarea className="w-full border p-2 resize-none rounded-md" rows={2} placeholder="Enter form description..." />
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 bg-gray-50 border rounded">
          <FaSearch />
          <input
            className="flex-1 outline-none bg-transparent"
            placeholder="Search indicators (e.g., title, I#)"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <p className="mb-3 text-sm">
        <span className="font-semibold">Directions:</span> Check <b>YES</b> if an indicator is observed in the syllabus and <b>NO</b> if otherwise. Use
        <b> Pair</b> to confirm that the highlighted syllabus field matches the indicator. Provide remarks to improve the content and alignment of the syllabus.
      </p>

      <table className="w-full border border-gray-300 text-sm mb-24">
        <thead>
          <tr className="bg-[#A1A1A1] text-center">
            <th className="w-[46%] border px-3 py-2 font-semibold">INDICATORS</th>
            <th className="w-[8%] border px-3 py-2 font-semibold">YES</th>
            <th className="w-[8%] border px-3 py-2 font-semibold">NO</th>
            <th className="w-[14%] border px-3 py-2 font-semibold">PAIR</th>
            <th className="w-[24%] border px-3 py-2 font-semibold">REMARKS</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((it) => {
            const s = state[it.id];
            return (
              <tr key={it.id} className="hover:bg-yellow-50">
                <td className="border px-3 py-2">
                  <div className="flex items-start gap-2">
                    <IndicatorBadge id={it.id} onClick={() => onJump(it.syllabusAnchor)} />
                    <div>
                      <div className="font-medium">{it.title}</div>
                      {it.description ? (
                        <div className="text-xs text-gray-600">{it.description}</div>
                      ) : null}
                    </div>
                  </div>
                </td>

                {/* YES (disabled) */}
                <td className="border px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={s.yes === true}
                    disabled
                    aria-label={`Yes for ${it.id}`}
                  />
                </td>

                {/* NO (disabled) */}
                <td className="border px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={s.yes === false}
                    disabled
                    aria-label={`No for ${it.id}`}
                  />
                </td>

                {/* PAIR */}
                <td className="border px-3 py-2 text-center">
                  <button
                    onClick={() => setState(it.id, { paired: !s.paired })}
                    className={
                      "inline-flex items-center gap-2 px-3 py-1 rounded-full border " +
                      (s.paired ? "bg-green-100 border-green-500" : "bg-white hover:bg-gray-100")
                    }
                    aria-label={`Pair ${it.id}`}
                  >
                    <FaCheckCircle className={s.paired ? "text-green-600" : "text-gray-400"} />
                    <span className="text-xs font-medium">{s.paired ? "Paired" : "Mark Pair"}</span>
                  </button>
                </td>

                {/* REMARKS */}
                <td className="border px-3 py-2">
                  <input
                    type="text"
                    placeholder="Add remarks"
                    className="w-full border rounded px-2 py-1"
                    value={s.remarks}
                    onChange={(e) => setState(it.id, { remarks: e.target.value })}
                    aria-label={`Remarks for ${it.id}`}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const PairingLayout: React.FC = () => {
  const [active, setActive] = useState<string | null>(null);

  const [states, setStates] = useState<Record<string, IndicatorState>>(() => {
    const base: Record<string, IndicatorState> = {};
    for (const ind of INDICATORS) {
      base[ind.id] = { yes: null, remarks: "", paired: false };
    }
    return base;
  });

  const setState = (id: string, next: Partial<IndicatorState>) => {
    setStates((prev) => ({ ...prev, [id]: { ...prev[id], ...next } }));
  };

  const onJump = (anchor: string) => {
    setActive(anchor);
    const el = document.getElementById(anchor);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <PairingHeader />

      <div className="flex flex-col md:flex-row">
        {/* Left: Syllabus (50%) */}
        <div className="md:w-1/2 w-full bg-white shadow-sm">
          <SyllabusPanel activeAnchor={active} onBadgeClick={onJump} />
        </div>

        {/* Right: Review (50%) */}
        <div className="md:w-1/2 w-full bg-white shadow-sm border-l border-gray-200">
          <ReviewPanel indicators={INDICATORS} state={states} setState={setState} onJump={onJump} />
        </div>
      </div>

      {/* Floating legend */}
      <div className="fixed bottom-4 right-4 bg-white border rounded-xl shadow-lg p-3 text-xs space-y-2">
        <div className="font-semibold">Legend</div>
        <div className="flex items-center gap-2">
          <IndicatorBadge id="I#" />
          <span>Indicator badge (click to jump)</span>
        </div>
        <div className="flex items-center gap-2">
          <FaCheckCircle className="text-green-600" />
          <span>Paired / Matched</span>
        </div>
      </div>
    </div>
  );
};

export default PairingLayout;
