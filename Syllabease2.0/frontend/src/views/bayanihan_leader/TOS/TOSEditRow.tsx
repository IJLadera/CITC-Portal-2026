import React, { useEffect, useState } from "react";
import { Button } from "flowbite-react";
import { Info } from "lucide-react"; 
import type { TOS, TOSRows } from "../../../types/tos";
import { useNavigate, useParams } from "react-router-dom"; 
import api from "../../../api";
import { toast, ToastContainer } from "react-toastify";

export default function TOSEditRow() {
  const { tosId } = useParams<{ tosId: string }>();
  const role = localStorage.getItem("activeRole")?.toUpperCase();
  const [rows, setRows] = useState<TOSRows[]>([]);
  const [tos, setTos] = useState<TOS | null>(null); 

  const navigate = useNavigate();

  // Fetch current TOS and rows
  useEffect(() => {
    if (!tosId) return;
    api
      .get(`/tos/${tosId}/?role=${role}`)
      .then((res) => {
        setTos(res.data);
        setRows(res.data.tos_rows || []);
      })
      .catch((err) => console.error(err));
  }, [tosId, role]);

  const getHighlightClass = (value: number, expected: number) => {
    const diff = value - expected;
    if (Math.abs(diff) > 5) {
      return "text-red-600 font-bold border-2 border-red-600 bg-red-200";
    } 
    if (diff !== 0) {
      return "text-yellow-700 font-semibold border-2 border-yellow-500 bg-yellow-100";
    }
    return "";
  };

  const [totals, setTotals] = useState({
    totalHrs: 0,
    totalPer: 0,
    totalCol1: 0,
    totalCol2: 0,
    totalCol3: 0,
    totalCol4: 0,
    totalItems: 0,
    actualRowTotal: 0,
  });

  const calculateTotals = () => {
    let totalHrs = 0,
      totalPer = 0,
      totalCol1 = 0,
      totalCol2 = 0,
      totalCol3 = 0,
      totalCol4 = 0,
      totalItems = 0;

    rows.forEach((r) => {
      totalHrs += r.no_hours || 0;
      totalPer += r.percent || 0;
      totalCol1 += r.col1_value || 0;
      totalCol2 += r.col2_value || 0;
      totalCol3 += r.col3_value || 0;
      totalCol4 += r.col4_value || 0;
      totalItems += r.no_items || 0;
    });

    setTotals({
      totalHrs,
      totalPer,
      totalCol1,
      totalCol2,
      totalCol3,
      totalCol4,
      totalItems,
      actualRowTotal: totalCol1 + totalCol2 + totalCol3 + totalCol4,
    });
  };

  useEffect(() => {
    calculateTotals();
  }, [rows]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    rowId: number,
    field: keyof TOSRows
  ) => {
    let raw = e.target.value;

    // Allow empty input (when user backspaces everything)
    if (raw === "") {
      setRows(prev =>
        prev.map(row =>
          row.id === rowId ? { ...row, [field]: "" } : row
        )
      );
      return;
    }

    // Allow only digits (type="number" blocks letters but paste can still add them)
    if (!/^\d+$/.test(raw)) return;

    let value = parseInt(raw, 10);

    if (value < 0) value = 0;

    setRows(prev =>
      prev.map(row =>
        row.id === rowId ? { ...row, [field]: value } : row
      )
    );
  };
  
  const isDisabled = (colPercentage: number) => colPercentage === 0;

  const handleRestoreDefaults = () => {
    if (!tos || rows.length === 0) return;

    // -------------------------------
    // Helper: Biggest Remainder Method
    // -------------------------------
    const distribute = (values: number[], total: number): number[] => {
      const floored = values.map((v) => Math.floor(v));
      let leftover = total - floored.reduce((a, b) => a + b, 0);

      const decimals = values.map((v, i) => [i, v - Math.floor(v)] as [number, number]);
      decimals.sort((a, b) => b[1] - a[1]);

      for (let i = 0; i < leftover; i++) {
        floored[decimals[i % decimals.length][0]] += 1;
      }

      return floored;
    };

    // -------------------------------
    // Step 1: Compute GLOBAL expected column values
    // -------------------------------
    const colPercentages = [
      tos.col1_percentage,
      tos.col2_percentage,
      tos.col3_percentage,
      tos.col4_percentage,
    ];

    const rawGlobalTargets = colPercentages.map((pct) => (tos.total_items * pct) / 100);
    const globalExpected = distribute(rawGlobalTargets, tos.total_items);
    // globalExpected = [col1_expected, col2_expected, col3_expected, col4_expected]

    // -------------------------------
    // Step 2: Compute row percents + raw items
    // -------------------------------
    const totalHours = rows.reduce((sum, r) => sum + (r.no_hours || 0), 0);

    const rowData = rows.map((row) => {
      const rawPercent = totalHours ? ((row.no_hours || 0) / totalHours) * 100 : 0;
      const rawItems = (tos.total_items * rawPercent) / 100;
      return { row, rawPercent, rawItems };
    });

    const flooredPercents = distribute(rowData.map((r) => r.rawPercent), 100);
    const flooredItems = distribute(rowData.map((r) => r.rawItems), tos.total_items);

    // -------------------------------
    // Step 3: Build raw matrix for per-row per-column allocation
    // -------------------------------
    const nRows = rowData.length;
    const mCols = 4;
    const rawMatrix: number[][] = Array.from({ length: nRows }, (_, i) => {
      const rowItems = flooredItems[i];
      return colPercentages.map((pct) => (rowItems * pct) / 100);
    });

    // Floor the matrix
    const intMatrix = rawMatrix.map((row) => row.map((v) => Math.floor(v)));

    // Compute row sums and column sums
    const rowSum = intMatrix.map((row) => row.reduce((a, b) => a + b, 0));
    const colSum = Array.from({ length: mCols }, (_, j) => intMatrix.reduce((sum, row) => sum + row[j], 0));

    const targetRowSum = [...flooredItems];
    const targetColSum = [...globalExpected];

    // Build list of candidate cells with fractional parts
    const cellList: [number, number, number][] = [];
    for (let i = 0; i < nRows; i++) {
      for (let j = 0; j < mCols; j++) {
        cellList.push([rawMatrix[i][j] - intMatrix[i][j], i, j]);
      }
    }
    cellList.sort((a, b) => b[0] - a[0] || a[1] - b[1] || a[2] - b[2]);

    // Allocate leftover units iteratively
    let totalAssigned = intMatrix.flat().reduce((a, b) => a + b, 0);
    const totalTarget = tos.total_items;
    let madeProgress = true;

    while (totalAssigned < totalTarget && madeProgress) {
      madeProgress = false;
      for (const [_, i, j] of cellList) {
        if (totalAssigned >= totalTarget) break;
        if (rowSum[i] < targetRowSum[i] && colSum[j] < targetColSum[j]) {
          intMatrix[i][j] += 1;
          rowSum[i] += 1;
          colSum[j] += 1;
          totalAssigned += 1;
          madeProgress = true;
        }
      }
    }

    // Fallback allocation if still leftover
    if (totalAssigned < totalTarget) {
      for (let i = 0; i < nRows; i++) {
        for (let j = 0; j < mCols; j++) {
          while (totalAssigned < totalTarget && rowSum[i] < targetRowSum[i] && colSum[j] < targetColSum[j]) {
            intMatrix[i][j] += 1;
            rowSum[i] += 1;
            colSum[j] += 1;
            totalAssigned += 1;
          }
        }
      }
    }

    // -------------------------------
    // Step 4: Build restored rows
    // -------------------------------
    const restoredRows = rowData.map((r, i) => {
      return {
        ...r.row,
        percent: flooredPercents[i],
        no_items: flooredItems[i],
        col1_value: intMatrix[i][0],
        col2_value: intMatrix[i][1],
        col3_value: intMatrix[i][2],
        col4_value: intMatrix[i][3],
      };
    });

    setRows(restoredRows);
    toast.info("Values restored to default based on expected computation.");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tos) return;
    
    const prepareRowsForSubmit = () => {
      return rows.map(row => ({
        ...row,
        col1_value: Number(row.col1_value) || 0,
        col2_value: Number(row.col2_value) || 0,
        col3_value: Number(row.col3_value) || 0,
        col4_value: Number(row.col4_value) || 0,
      }));
    };

    const sanitizedRows = prepareRowsForSubmit();

    if (
      Math.abs(totals.actualRowTotal - tos.total_items) > 5 ||
      Math.abs(totals.totalItems - tos.total_items) > 5 ||
      Math.abs(totals.totalCol1 - tos.col1_expected) > 5 ||
      Math.abs(totals.totalCol2 - tos.col2_expected) > 5 ||
      Math.abs(totals.totalCol3 - tos.col3_expected) > 5 ||
      Math.abs(totals.totalCol4 - tos.col4_expected) > 5
    ) {
      toast.error("Cannot submit: Column totals or overall totals deviate more than ±5 from expected.");
      return;
    }

    // Check each row
    const invalidRow = sanitizedRows.find(
      (row) =>
        Math.abs(row.col1_value +row.col2_value + row.col3_value + row.col4_value - row.no_items) > 5
    );
    if (invalidRow) {
      toast.error(`Cannot submit: Row "${invalidRow.topic}" total deviates more than ±5 from expected.`);
      return;
    }

    api
      .put(`/tos/${tos.id}/update-rows/`, { rows: sanitizedRows })
      .then(() => {
        toast.success("Rows successfully updated!");
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to update rows.");
      });
    navigate(-1);
  };

  if (!tos) {
    return <p className="text-center mt-10">Loading...</p>;
  }

  return (
    <div className="flex flex-col flex-1 pt-14 px-6"> 
      <ToastContainer autoClose={4000} position="top-right" theme="colored" closeOnClick />

      <div className="flex items-center gap-3 border-l-4 border-green-400 bg-green-50 dark:bg-gray-700/60 w-[600px] rounded-lg mx-auto mb-6 p-4 shadow-sm">
        <Info className="h-6 w-6 text-green-400 shrink-0 font-bold" />
        <p className="text-gray-700 dark:text-gray-200 font-medium text-base leading-relaxed">
          The cells within the cognitive level are{" "}
          <span className="font-semibold">editable</span>.  
          Please enter{" "}
          <span className="underline decoration-green-400 font-medium">
            whole numbers only
          </span>.
        </p>
      </div>

      <div className="relative mt-2 w-[95%] flex flex-col bg-gradient-to-r from-white to-[#dbeafe] rounded-lg shadow-lg p-8 mx-auto ">
        <form onSubmit={handleSubmit}>
          <table className="w-full table-fixed border border-black bg-white text-base font-serif" style={{ fontFamily: "Times New Roman, serif" }}>
            <thead className="bg-gray-200">
              <tr>
                <th className="w-[25%] px-2 py-2 border border-black" rowSpan={3}>
                  Topics
                </th>
                <th className="w-[5%] px-2 py-2 border border-black" rowSpan={3}>
                  No. of <br /> Hours
                </th>
                <th className="w-[5%] px-2 py-2 border border-black" rowSpan={3}>
                  %
                </th>
                <th className="w-[5%] px-2 py-2 border border-black" rowSpan={3}>
                  No. of <br /> Test Items
                </th>
                <th
                  colSpan={4}
                  className="w-[45%] px-2 py-2 border border-black text-center"
                >
                  Cognitive Level
                </th>
                <th rowSpan={2} className="w-[10%] px-2 py-2 border border-black"></th>
              </tr>
              <tr>
                <th className="border border-black">Knowledge</th>
                <th className="border border-black">Comprehension</th>
                <th className="border border-black">Application / Analysis</th>
                <th className="border border-black">Synthesis / Evaluation</th>
              </tr>
              <tr>
                <th className="border border-black">{tos.col1_percentage}%</th>
                <th className="border border-black">{tos.col2_percentage}%</th>
                <th className="border border-black">{tos.col3_percentage}%</th>
                <th className="border border-black">{tos.col4_percentage}%</th>
                <th className="border border-black">Actual Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((row) => (
                  <tr key={row.id} className="">
                    <td className="border border-black px-2 text-center bg-gray-100">
                      {row.topic}
                    </td>
                    <td className="border border-black text-center bg-gray-100">
                      {row.no_hours}
                    </td>
                    <td className="border border-black text-center bg-gray-100">
                      {row.percent}
                    </td>
                    <td className="border border-black text-center bg-gray-100">
                      {row.no_items}
                    </td>
                    {/* Editable fields */}
                    <td className={`border border-black text-center py-2  ${
                          isDisabled(tos.col1_percentage) ? "bg-gray-200 cursor-not-allowed" : "hover:bg-gray-100"
                    }`}>
                      <input
                        type="number"
                        value={row.col1_value}
                        onChange={(e) => handleChange(e, row.id, "col1_value")}
                        className={`w-full text-center focus:outline-none ${
                          isDisabled(tos.col1_percentage) ? "bg-gray-200 cursor-not-allowed" : ""
                        }`}
                        min={0}
                        onWheel={(e) => e.currentTarget.blur()}
                        disabled={isDisabled(tos.col1_percentage)}
                      />
                    </td>
                    <td className={`border border-black text-center py-2  ${
                          isDisabled(tos.col2_percentage) ? "bg-gray-200 cursor-not-allowed" : "hover:bg-gray-100"
                    }`}>
                      <input
                        type="number"
                        value={row.col2_value}
                        onChange={(e) => handleChange(e, row.id, "col2_value")}
                        className={`w-full text-center focus:outline-none ${
                          isDisabled(tos.col2_percentage) ? "bg-gray-200 cursor-not-allowed" : ""
                        }`}
                        min={0}
                        onWheel={(e) => e.currentTarget.blur()} 
                        disabled={isDisabled(tos.col2_percentage)}
                      />
                    </td>
                    <td className={`border border-black text-center py-2  ${
                          isDisabled(tos.col3_percentage) ? "bg-gray-200 cursor-not-allowed" : "hover:bg-gray-100"
                    }`}>
                      <input
                        type="number"
                        value={row.col3_value}
                        onChange={(e) => handleChange(e, row.id, "col3_value")}
                        className={`w-full text-center focus:outline-none ${
                          isDisabled(tos.col3_percentage) ? "bg-gray-200 cursor-not-allowed" : ""
                        }`}
                        min={0}
                        onWheel={(e) => e.currentTarget.blur()}
                        disabled={isDisabled(tos.col3_percentage)}
                      />
                    </td>
                    <td className={`border border-black text-center py-2  ${
                          isDisabled(tos.col4_percentage) ? "bg-gray-200 cursor-not-allowed" : "hover:bg-gray-100"
                    }`}>
                      <input
                        type="number"
                        value={row.col4_value}
                        onChange={(e) => handleChange(e, row.id, "col4_value")}
                        className={`w-full text-center focus:outline-none ${
                          isDisabled(tos.col4_percentage) ? "bg-gray-200 cursor-not-allowed" : ""
                        }`}
                        min={0}
                        onWheel={(e) => e.currentTarget.blur()}
                        disabled={isDisabled(tos.col4_percentage)}
                      />
                    </td>
                    <td
                      className={`border border-black font-semibold underline text-center bg-gray-100 ${getHighlightClass(
                        Number(row.col1_value) + Number(row.col2_value) + Number(row.col3_value) + Number(row.col4_value),
                        row.no_items
                      )}`}
                    >
                      {Number(row.col1_value) + Number(row.col2_value) + Number(row.col3_value) + Number(row.col4_value)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="text-center border border-black py-2">
                    No data available
                  </td>
                </tr>
              )}

              {/* Totals Row */}
              <tr className="bg-gray-100 font-semibold">
                <td className="text-right px-2 py-2 border border-black">
                  Actual Total:
                </td>
                <td className="border border-black text-center">
                  {totals.totalHrs}
                </td>
                <td className="border border-black text-center">
                  {totals.totalPer}
                </td>
                <td
                  className={`border border-black text-center ${getHighlightClass(totals.totalItems, tos.total_items)}`}
                >
                  {totals.totalItems}
                </td>  
                <td
                  className={`border border-black underline text-center ${getHighlightClass(totals.totalCol1, tos.col1_expected)}`}
                >
                  {totals.totalCol1}
                </td>
                <td
                  className={`border border-black underline text-center ${getHighlightClass(totals.totalCol2, tos.col2_expected)}`}
                >
                  {totals.totalCol2}
                </td>
                <td
                  className={`border border-black underline text-center ${getHighlightClass(totals.totalCol3, tos.col3_expected)}`}
                >
                  {totals.totalCol3}
                </td>
                <td
                  className={`border border-black underline text-center ${getHighlightClass(totals.totalCol4, tos.col4_expected)}`}
                >
                  {totals.totalCol4}
                </td>
                <td
                  className={`border border-black underline text-center ${getHighlightClass(totals.actualRowTotal, tos.total_items)}`}
                >
                  {totals.actualRowTotal}
                </td>
              </tr>

              {/* Expected Totals Row */}
              <tr className="bg-gray-100 font-semibold">
                <td className="text-right px-2 py-2 border border-black">
                  Expected Total:
                </td>
                <td className="border border-black"></td>
                <td className="border border-black text-center">100</td>
                <td className="border border-black text-center">
                  {tos.total_items}
                </td>
                <td className="border border-black text-center">{tos.col1_expected}</td>
                <td className="border border-black text-center">{tos.col2_expected}</td>
                <td className="border border-black text-center">{tos.col3_expected}</td>
                <td className="border border-black text-center">{tos.col4_expected}</td>
                <td className="border border-black"></td>
              </tr>
            </tbody>
          </table>

          {/* Centered Update button */}
          <div className="flex justify-between items-center gap-4 mt-6">
            <Button
              type="button"
              color="purple"
              className="shadow-lg hover:scale-105 transition text-md px-5"
              onClick={handleRestoreDefaults}
            >
              Restore Values to Default
            </Button>

            <Button
              type="submit"
              color="blue"
              className="shadow-lg hover:scale-105 transition text-md px-5"
            >
              Update TOS Values
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
