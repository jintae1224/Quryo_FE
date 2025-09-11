import { SqlQueryResponse } from "@/types/sql";

export const exportToCSV = (data: SqlQueryResponse): string => {
  if (!data.data || data.data.length === 0) {
    return "";
  }

  const headers = Object.keys(data.data[0]);
  const csvRows = [
    headers.join(","), // Header row
    ...data.data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value ?? "");
        return stringValue.includes(",") ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
      }).join(",")
    )
  ];

  return csvRows.join("\n");
};

export const downloadCSV = (data: SqlQueryResponse, filename: string = "query-results") => {
  const csvContent = exportToCSV(data);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportToJSON = (data: SqlQueryResponse): string => {
  return JSON.stringify(data.data, null, 2);
};

export const downloadJSON = (data: SqlQueryResponse, filename: string = "query-results") => {
  const jsonContent = exportToJSON(data);
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
  const link = document.createElement("a");
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.json`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};