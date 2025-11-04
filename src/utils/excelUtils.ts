import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export interface ExcelData {
  data: Record<string, any>[];
  headers: string[];
  fileName: string;
}

/**
 * Parse Excel/CSV file and return structured data
 */
export const parseExcelFile = async (file: File): Promise<ExcelData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length === 0) {
          reject(new Error("File is empty or invalid"));
          return;
        }

        // First row as headers
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];

        // Convert to object array
        const dataArray = rows.map((row) => {
          const obj: Record<string, any> = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || "";
          });
          return obj;
        });

        resolve({
          data: dataArray,
          headers,
          fileName: file.name,
        });
      } catch (error) {
        reject(new Error(`Failed to parse file: ${error}`));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsBinaryString(file);
  });
};

/**
 * Export data to Excel file
 */
export const exportToExcel = (
  data: Record<string, any>[],
  fileName: string = "exported_data.xlsx",
  sheetName: string = "Data"
) => {
  if (data.length === 0) {
    throw new Error("No data to export");
  }

  try {
    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Set column widths
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(key.length, 15), // Minimum width of 15 characters
    }));
    worksheet["!cols"] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
      cellStyles: true,
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    // Download file
    saveAs(blob, fileName);

    return true;
  } catch (error) {
    console.error("Excel export error:", error);
    throw new Error(
      `Failed to export Excel file: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Export data to CSV file
 */
export const exportToCSV = (
  data: Record<string, any>[],
  fileName: string = "exported_data.csv"
) => {
  if (data.length === 0) {
    throw new Error("No data to export");
  }

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header] || "";
          const escapedValue = String(value).replace(/"/g, '""');
          return `"${escapedValue}"`;
        })
        .join(",")
    ),
  ];

  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });

  saveAs(blob, fileName);
};

/**
 * Compare two datasets and find differences
 */
export const compareDatasets = (
  data1: Record<string, any>[],
  data2: Record<string, any>[],
  keyField?: string
): {
  common: Record<string, any>[];
  onlyInFirst: Record<string, any>[];
  onlyInSecond: Record<string, any>[];
  differences: Array<{
    field: string;
    row1: any;
    row2: any;
    index1: number;
    index2: number;
  }>;
} => {
  const result = {
    common: [] as Record<string, any>[],
    onlyInFirst: [] as Record<string, any>[],
    onlyInSecond: [] as Record<string, any>[],
    differences: [] as Array<{
      field: string;
      row1: any;
      row2: any;
      index1: number;
      index2: number;
    }>,
  };

  if (keyField) {
    // Compare using key field
    const map1 = new Map(
      data1.map((item, index) => [
        item[keyField],
        { ...item, _index: index } as Record<string, any>,
      ])
    );
    const map2 = new Map(
      data2.map((item, index) => [
        item[keyField],
        { ...item, _index: index } as Record<string, any>,
      ])
    );

    // Find common items
    for (const [key, item1] of map1) {
      const item2 = map2.get(key);
      if (item2) {
        result.common.push(item1);

        // Check for differences
        const fields = new Set([...Object.keys(item1), ...Object.keys(item2)]);
        for (const field of fields) {
          if (
            field !== keyField &&
            field !== "_index" &&
            item1[field] !== item2[field]
          ) {
            result.differences.push({
              field,
              row1: item1[field],
              row2: item2[field],
              index1: item1._index,
              index2: item2._index,
            });
          }
        }
      } else {
        result.onlyInFirst.push(item1);
      }
    }

    // Find items only in second dataset
    for (const [key, item2] of map2) {
      if (!map1.has(key)) {
        result.onlyInSecond.push(item2);
      }
    }
  } else {
    // Simple comparison without key field
    result.onlyInFirst = [...data1];
    result.onlyInSecond = [...data2];
  }

  return result;
};

/**
 * Merge two datasets
 */
export const mergeDatasets = (
  data1: Record<string, any>[],
  data2: Record<string, any>[],
  keyField?: string
): Record<string, any>[] => {
  if (!keyField) {
    return [...data1, ...data2];
  }

  const merged = new Map();

  // Add data from first dataset
  data1.forEach((item) => {
    merged.set(item[keyField], { ...item, _index: 0 });
  });

  // Add or update with data from second dataset
  data2.forEach((item) => {
    const existing = merged.get(item[keyField]);
    if (existing) {
      // Merge objects, with second dataset taking precedence
      const { _index, ...existingData } = existing;
      merged.set(item[keyField], { ...existingData, ...item, _index: 1 });
    } else {
      merged.set(item[keyField], { ...item, _index: 1 });
    }
  });

  return Array.from(merged.values());
};

/**
 * Filter data based on criteria
 */
export const filterData = (
  data: Record<string, any>[],
  filters: Record<string, any>
): Record<string, any>[] => {
  return data.filter((row) => {
    return Object.entries(filters).every(([field, value]) => {
      if (value === null || value === undefined || value === "") {
        return true;
      }

      const cellValue = row[field];
      if (typeof value === "string") {
        return String(cellValue).toLowerCase().includes(value.toLowerCase());
      }

      return cellValue === value;
    });
  });
};

/**
 * Sort data by field
 */
export const sortData = (
  data: Record<string, any>[],
  field: string,
  direction: "asc" | "desc" = "asc"
): Record<string, any>[] => {
  return [...data].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];

    if (aVal === bVal) return 0;

    const comparison = aVal < bVal ? -1 : 1;
    return direction === "asc" ? comparison : -comparison;
  });
};
