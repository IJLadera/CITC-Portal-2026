import React, { useEffect, useState } from "react";
import { LineChart, lineElementClasses } from "@mui/x-charts/LineChart";
import Cookies from "js-cookie";
import http from "../../../../../../../../http";


export default function EventStatisticsChart() {
  const [uData, setUData] = useState([]);
  const [xLabels, setXLabels] = useState([]);
  const token = Cookies.get("auth_token");

  useEffect(() => {
    // Fetch the event statistics data from the API
    http
      .get("events/statistics/created", {
        headers: {
          Authorization: `Token ${token}`,
        },
      })
      .then((response: any) => {
        const data = response.data.statistics;
        const months = data.map((item: any) => item.month);
        const counts = data.map((item: any) => item.count);

        setXLabels(months);
        setUData(counts);
      })
      .catch((error: any) => {
        console.error("Error fetching data:", error);
      });
  }, [token]);

  return (
    <LineChart
      width={500}
      height={300}
      series={[{ data: uData, label: "Events", area: true, showMark: false }]}
      xAxis={[{ scaleType: "point", data: xLabels }]}
      sx={{
        [`& .${lineElementClasses.root}`]: {
          display: "none",
        },
      }}
    />
  );
}
