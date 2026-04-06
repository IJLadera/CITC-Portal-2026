/** Format a date string into MM.DD.YY */
export const formatEffectiveDate = (dateString?: string | null): string => {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return ""; // invalid date safeguard

  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);

  return `${mm}.${dd}.${yy}`;
};

/** Format revision number as two digits: 0 → "00", 1 → "01", 12 → "12" */
export const formatRevisionNo = (num?: number | null): string => {
  if (num === null || num === undefined) return "";
  return num.toString().padStart(2, "0");
};

export const formatListDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";

  // convert to 12-hour format
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 => 12
  const hourStr = String(hours).padStart(2, "0");

  return `${year}-${month}-${day}, ${hourStr}:${minutes} ${ampm}`;
}; 