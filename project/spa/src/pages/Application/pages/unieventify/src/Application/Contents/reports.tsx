import React, { useEffect, useState } from "react";
import http from "../../../../../../../http";
import Cookies from "js-cookie";
import StatCard from "../../Components/eventComponents/Graph/StatCard";
import BarChartComponent from "../../Components/eventComponents/Graph/BarChart";
import DesignationPieChart from "../../Components/eventComponents/Graph/PieChartComponents";
import colors from "../../Components/colors";
import { Box, Typography, Select, MenuItem, Button, CircularProgress } from "@mui/material";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../../images/logo.png";

interface Semester {
  id: number;
  semesterName: string;
  schoolYear: {
    schoolYearName: string;
  };
}

interface Event {
  id: number;
  name: string;
  category: string;
  type: string;
  status: string;
  startDateTime: string;
  endDateTime: string;
  created_by: string;
}

interface Statistic {
  month: string;
  count: number;
  events: Event[];
}

interface Category {
  category: string;
  total_count: number;
  statistics: Statistic[];
}

interface Department {
  department: string;
  total_count: number;
  statistics: Statistic[];
}

interface PieChartData {
  designation: string;
  count: number;
}

const Reports: React.FC = () => {
  const [data, setData] = useState<Category[]>([]);
  const [dataDepartment, setDataDepartment] = useState<Department[]>([]);
  const [barChartData, setBarChartData] = useState<Statistic[]>([]);
  const [createdData, setCreatedData] = useState<Statistic[]>([]);
  const [cancelledData, setCancelledData] = useState<Statistic[]>([]);
  const [pieChartData, setPieChartData] = useState<PieChartData[]>([]);
  const [pieChartTotalCount, setPieChartTotalCount] = useState(0);
  const [role, setRole] = useState<number | string>("");
  const [selectedSemester, setSelectedSemester] = useState<number | string>("");
  const [semesterOptions, setSemesterOptions] = useState<{ id: number; label: string }[]>([]);
  const [semesterData, setSemesterData] = useState<Semester[]>([]);
  const token = Cookies.get("auth_token");
  const [statistics, setStatistics] = useState<Statistic[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [createdEvents, setCreatedEvents] = useState<Statistic[]>([]);
  const [canceledEvents, setCanceledEvents] = useState<Statistic[]>([]);
  const [admin, setAdmin] = useState<boolean>(false);

  useEffect(() => {
    // Fetch semester data for the dropdown
    http
      .get("unieventify/semester/", {
        headers: {
          Authorization: `Token ${token}`,
        },
      })
      .then((response) => {
        setSemesterData(response.data);
        const semesterOptions = response.data.map((semester: Semester) => {
          return {
            id: semester.id,
            label: `${semester.semesterName} (${semester.schoolYear.schoolYearName})`,
          };
        });
        setSemesterOptions(semesterOptions);
      })
      .catch((error) => console.error("Error fetching semester data:", error));
    // Fetch event statistics
    http
      .get("unieventify/events/statistics/byCategories", {
        headers: {
          Authorization: `Token ${token}`,
        },
      })
      .then((response) => {
        setData(response.data);
        setCategories(response.data);
      })
      .catch((error) => console.error("Error fetching data:", error));

    http
      .get("unieventify/events/statistics/byDepartment", {
        headers: {
          Authorization: `Token ${token}`,
        },
      })
      .then((response) => {
        setDataDepartment(response.data);
        setDepartments(response.data);
      })
      .catch((error) => console.error("Error fetching data:", error));

    http
      .get("unieventify/events/statistics/", {
        headers: {
          Authorization: `Token ${token}`,
        },
      })
      .then((response) => {
        const transformedData = response.data.statistics.map((item: any) => ({
          month: formatMonth(item.month),
          count: item.count,
          events: item.events,
        }));
        setBarChartData(transformedData);
        setStatistics(response.data.statistics);
      })
      .catch((error) => console.error("Error fetching data:", error));

    http
      .get("unieventify/events/statistics/created", {
        headers: {
          Authorization: `Token ${token}`,
        },
      })
      .then((response) => {
        const transformedData = response.data.statistics.map((item: any) => ({
          month: item.month,
          count: item.count,
          events: item.events,
        }));
        setCreatedData(transformedData);
        setCreatedEvents(response.data.statistics);
      })
      .catch((error) => console.error("Error fetching data:", error));

    http
      .get("unieventify/events/statistics/cancelled", {
        headers: {
          Authorization: `Token ${token}`,
        },
      })
      .then((response) => {
        const transformedData = response.data.statistics.map((item: any) => ({
          month: item.month,
          count: item.count,
          events: item.events,
        }));
        setCancelledData(transformedData);
        setCanceledEvents(response.data.statistics);
      })
      .catch((error) => console.error("Error fetching data:", error));

    http
      .get("unieventify/designation-count/", {
        headers: {
          Authorization: `Token ${token}`,
        },
      })
      .then((response) => {
        setPieChartData(response.data);
        const total = response.data.reduce((sum: number, item: PieChartData) => sum + item.count, 0);
        setPieChartTotalCount(total);
      })
      .catch((error) => console.error("Error fetching data:", error));

    http
      .get("auth/users/me/", {
        headers: {
          Authorization: `Token ${token}`,
        },
      })
      .then((response) => {
        setRole("Admin");
        setAdmin(response.data.is_staff);
      });
  }, [token]);

  // Function to export data to Excel
  const exportToExcel = () => {
    // Event Data for Excel
    const eventSheetData = data.map((item) => ({
      Category: item.category,
      "Total Count": item.total_count,
      Months: item.statistics
        .map((stat) => `${stat.month} (${stat.count})`)
        .join(", "),
    }));

    const eventSheetDataDepartment = dataDepartment.map((item) => ({
      Department: item.department,
      "Total Count": item.total_count,
      Months: item.statistics
        .map((stat) => `${stat.month} (${stat.count})`)
        .join(", "),
    }));

    // Bar Chart Data for Excel
    const barChartSheetData = barChartData.map((item) => ({
      Month: item.month,
      "Event Count": item.count,
      "Event Names": item.events.map((event) => event.name).join(", "),
    }));

    // Created Events Data for Excel
    const createdDataSheet = createdData.map((item) => ({
      Month: item.month,
      "Created Count": item.count,
      "Event Names": item.events.map((event) => event.name).join(", "),
    }));

    // Cancelled Events Data for Excel
    const cancelledDataSheet = cancelledData.map((item) => ({
      Month: item.month,
      "Cancelled Count": item.count,
      "Event Names": item.events.map((event) => event.name).join(", "),
    }));

    // User Data (Pie Chart) for Excel
    const userSheetData = pieChartData.map((item) => ({
      Designation: item.designation,
      Count: item.count,
    }));

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Function to add styled sheets
    const addStyledSheet = (data: any[], sheetName: string) => {
      const ws = XLSX.utils.json_to_sheet(data);

      // Add custom titles and headers
      XLSX.utils.sheet_add_aoa(ws, [[sheetName]], { origin: "A1" });
      ws["!cols"] = [{ wch: 30 }, { wch: 15 }, { wch: 50 }]; // Adjust column widths
      ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }]; // Merge title cells
      ws["A1"].s = {
        font: { bold: true, sz: 14 },
        alignment: { horizontal: "center" },
      }; // Style title
      ws["!freeze"] = { xSplit: 0, ySplit: 2 }; // Freeze panes
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    };

    // Add styled sheets
    addStyledSheet(eventSheetData, "Event Statistics");
    addStyledSheet(eventSheetDataDepartment, "Event Statistics by Department");
    addStyledSheet(barChartSheetData, "Bar Chart Data");
    addStyledSheet(createdDataSheet, "Created Events");
    addStyledSheet(cancelledDataSheet, "Cancelled Events");
    addStyledSheet(userSheetData, "User Designations");

    // Write the workbook to an Excel file
    XLSX.writeFile(wb, "event_report.xlsx");
  };

  // Function to export data to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica");
    doc.setTextColor(0, 0, 0); // Set font color to black

    // Title Page Layout
    doc.addImage(logo, "PNG", 70, 10, 70, 70); // Add College logo at top

    // Set font size and center-align the college name below the logo
    doc.setFontSize(22);
    doc.text("College of Information Technology", 105, 90, { align: "center" }); // Start below logo

    // Set font size and center-align the report title
    doc.setFontSize(24);
    doc.text("Comprehensive Event Report", 105, 120, { align: "center" }); // Start below the college name

    // Add the current date below the title
    const currentDate = new Date().toLocaleDateString();
    doc.setFontSize(12);
    doc.text(`Generated on: ${currentDate}`, 105, 150, { align: "center" }); // Start below the title

    // Table of Contents
    doc.addPage();
    doc.setFontSize(20);

    // Center-align the title
    const title = "Table of Contents";
    const titleWidth = doc.getTextWidth(title); // Get the width of the text
    const pageWidth = doc.internal.pageSize.width; // Get the page width
    const titleX = (pageWidth - titleWidth) / 2; // Calculate the X position to center the text
    doc.text(title, titleX, 20); // Draw the title at the calculated position

    doc.setFontSize(14);

    // Center-align each entry in the table of contents
    const entries = [
      "Summary",
      "Event Statistics",
      "Canceled Events",
      "Created Events",
      "Event Categories",
      "Departments",
    ];

    let yPosition = 30; // Start position for the entries

    entries.forEach((entry) => {
      const entryWidth = doc.getTextWidth(entry); // Get the width of each entry
      const entryX = (pageWidth - entryWidth) / 2; // Calculate the X position to center the entry
      doc.text(entry, entryX, yPosition); // Draw the entry at the calculated position
      yPosition += 10; // Increment the Y position for the next entry
    });

    // Event Statistics Section
    doc.addPage();
    doc.setFontSize(16);
    doc.text("Event Statistics", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text("Details of the event statistics", 105, 30, { align: "center" });

    statistics.forEach((stat, index) => {
      const { month, count, events } = stat;
      doc.setFontSize(14);

      const eventData = events?.map((event) => [
        event.id,
        event.name,
        event.category,
        event.type,
        event.status,
        new Date(event.startDateTime).toLocaleString(),
        new Date(event.endDateTime).toLocaleString(),
        event.created_by,
      ]);

      autoTable(doc, {
        startY: 50 + index * 80,
        head: [
          [
            "ID",
            "Name",
            "Category",
            "Type",
            "Status",
            "Start",
            "End",
            "Created By",
          ],
        ],
        body: eventData,
        theme: "striped",
        headStyles: { fillColor: "black", fontSize: 12, fontStyle: "bold" },
        styles: { fontSize: 10, cellPadding: 4 },
        tableWidth: "auto",
      });
    });

    // Canceled Events Section
    doc.addPage();
    doc.setFontSize(16);
    doc.text("Canceled Events", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text("Details of the canceled events.", 105, 30, { align: "center" });

    canceledEvents.forEach((stat) => {
      const { events } = stat;
      const canceledEventData = events?.map((event) => [
        event.id,
        event.name,
        event.category,
        event.type,
        "Canceled",
        new Date(event.startDateTime).toLocaleString(),
        new Date(event.endDateTime).toLocaleString(),
        event.created_by,
      ]);

      autoTable(doc, {
        startY: 40,
        head: [
          [
            "ID",
            "Name",
            "Category",
            "Type",
            "Status",
            "Start",
            "End",
            "Created By",
          ],
        ],
        body: canceledEventData,
        theme: "striped",
        headStyles: { fillColor: "black", fontSize: 12, fontStyle: "bold" },
        styles: { fontSize: 10, cellPadding: 4 },
        tableWidth: "auto",
      });
    });

    // Created Events Section
    doc.addPage();
    doc.setFontSize(16);
    doc.text("Created Events", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text("Details of the created events.", 105, 30, { align: "center" });

    createdEvents.forEach((stat) => {
      const { events } = stat;
      const createdEventData = events?.map((event) => [
        event.id,
        event.name,
        event.category,
        event.type,
        "Created",
        new Date(event.startDateTime).toLocaleString(),
        new Date(event.endDateTime).toLocaleString(),
        event.created_by,
      ]);

      autoTable(doc, {
        startY: 40,
        head: [
          [
            "ID",
            "Name",
            "Category",
            "Type",
            "Status",
            "Start",
            "End",
            "Created By",
          ],
        ],
        body: createdEventData,
        theme: "striped",
        headStyles: { fillColor: "black", fontSize: 12, fontStyle: "bold" },
        styles: { fontSize: 10, cellPadding: 4 },
        tableWidth: "auto",
      });
    });

    // Categories Section
    doc.addPage();
    doc.setFontSize(16);
    doc.text("Event Categories", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text("List of all event categories.", 105, 30, { align: "center" });

    categories.forEach((stat) => {
      const { category, statistics } = stat;
      // Add category title
      doc.setFontSize(15);
      doc.text(`${category}`, 14, yPosition);
      statistics.forEach((stat) => {
        const { events } = stat;
        const categoryData = events?.map((event) => [
          event.id,
          event.name,
          event.created_by,
        ]);

        // Add table below the category title
        const table = autoTable(doc, {
          startY: yPosition + 10, // Start after the category title
          head: [["ID", "Name", "Created By"]],
          body: categoryData,
          theme: "striped",
          headStyles: { fillColor: "black", fontSize: 12, fontStyle: "bold" },
          styles: { fontSize: 10, cellPadding: 4 },
          tableWidth: "auto",
        });

        // Update the Y position for the next category, considering table height
        // yPosition = table.finalY + 10; // Adjust Y for the next section
        yPosition += 10;
      });
    });

    // Departments Section
    doc.addPage();
    doc.setFontSize(16);
    doc.text("Departments", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text("List of all departments and their events.", 105, 30, {
      align: "center",
    });

    departments.forEach((stat) => {
      const { department, statistics } = stat;
      
      // Add department title
      doc.setFontSize(15);
      doc.text(`${department}`, 14, yPosition);
    
      statistics.forEach((stat) => {
        const { events } = stat;
        const departmentData = events?.map((event) => [
          event.id,
          event.name,
          event.created_by,
        ]);
    
        // Add table below the department title
        autoTable(doc, {
          startY: yPosition + 10, // Start after the department title
          head: [["ID", "Name", "Created By"]],
          body: departmentData,
          theme: "striped",
          headStyles: { fillColor: "black", fontSize: 12, fontStyle: "bold" },
          styles: { fontSize: 10, cellPadding: 4 },
          tableWidth: "auto",
        });
    
        // Manually update the Y position for the next department
        // yPosition += doc.internal.pageSize.height - doc.lastPosition.y - 10; // Calculate new Y position
        yPosition += 10;
      });
    });

    // Save PDF
    doc.save("full_report.pdf");
  };

  // Filter data based on selected semester
  const filterDataBySemester = (data: any[]) => {
    if (!selectedSemester) return data;

    // Find the selected semester object by id
    const selectedSemesterObj = semesterData.find(
      (semester) => semester.id === selectedSemester
    );

    if (!selectedSemesterObj) return data;

    const { semesterName, schoolYear } = selectedSemesterObj;

    // Apply the filter to all statistics
    return data.map((item) => {
      // Ensure item.statistics is an array before calling filter
      if (item.statistics && Array.isArray(item.statistics)) {
        return {
          ...item,
          statistics: item.statistics.filter(
            (stat: any) =>
              stat.semesterInfo &&
              stat.semesterInfo.semester === semesterName &&
              stat.semesterInfo.schoolYear === schoolYear.schoolYearName
          ),
        };
      }
      return item; // Return the item as is if statistics is not present or not an array
    });
  };

  const filteredData = filterDataBySemester(data);
  const filteredDepartmentData = filterDataBySemester(dataDepartment);
  const filteredBarChartData = filterDataBySemester(barChartData);
  const filteredCreatedData = filterDataBySemester(createdData);
  const filteredCancelledData = filterDataBySemester(cancelledData);

  if (
    !(
      data &&
      dataDepartment &&
      barChartData &&
      createdData &&
      cancelledData &&
      pieChartData &&
      role &&
      semesterOptions
    )
  )
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <CircularProgress />
      </Box>
    );

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h4">Events Analytics and Graph</Typography>
      {/* Export buttons */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button
          variant="contained"
          onClick={exportToExcel}
          sx={{ mr: 1, backgroundColor: colors.yellow }}
        >
          Export to Excel
        </Button>
        <Button
          variant="contained"
          onClick={exportToPDF}
          sx={{ backgroundColor: colors.darkblue }}
        >
          Export to PDF
        </Button>
      </Box>

      {/* Dropdown to filter by semester and school year */}
      <Select
        value={selectedSemester}
        onChange={(e) => setSelectedSemester(e.target.value)}
        displayEmpty
        sx={{ my: 2, mb: 2 }}
      >
        <MenuItem value="">All Semesters</MenuItem>
        {semesterOptions.map((option, index) => (
          <MenuItem key={index} value={option.id}>
            {option.label} {/* This should be a string */}
          </MenuItem>
        ))}
      </Select>

      <Box>
        <StatCard data={filteredData} type="category" />
      </Box>
      <Box>
        <StatCard data={filteredDepartmentData} type="department" />
      </Box>
      <Box className="grid grid-cols-1 lg:grid-cols-2">
        <BarChartComponent
          data={filteredBarChartData}
          label="All Events"
          color={colors.yellow}
        />
        <BarChartComponent
          data={filteredCreatedData}
          label="Created Events"
          color={colors.darkblue}
        />
      </Box>
      <Box className="grid grid-cols-1 lg:grid-cols-2">
        <BarChartComponent
          data={filteredCancelledData}
          label="Cancelled Events"
          color={colors.yellow}
        />
      </Box>
      {admin ? (
        <Box>
          <Typography variant="h4">Users Analytics and Graph</Typography>
          <Box>
            <DesignationPieChart
              data={pieChartData}
              totalCount={pieChartTotalCount}
            />
          </Box>
        </Box>
      ) : (
        <Box></Box>
      )}
    </Box>
  );
}


const formatMonth = (month: string) => {
  if (!month) return "No Data"; // Handle undefined or empty month values
  const [year, monthNumber] = month.split("-");
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${months[parseInt(monthNumber, 10) - 1]} ${year}`;
};


export default Reports;
