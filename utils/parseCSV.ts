export interface CSVRow {
  [key: string]: unknown;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());

  return result;
}

export function parseCSV<T extends CSVRow[]>(
  csvString: string,
  rowNumber: number = 100
): T {
  const lines = csvString.split("\n").filter((line) => line.trim() !== "");

  if (lines.length === 0) {
    throw new Error("CSV data is empty.");
  }

  const headers = lines[0].split(",").map((header) => header.trim());

  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length && i <= rowNumber; i++) {
    const values = parseCSVLine(lines[i]);

    if (values.length !== headers.length) {
      throw new Error(
        `Row ${i} has a different number of columns than the header.`
      );
    }

    const obj: CSVRow = {};

    headers.forEach((header, index) => {
      obj[header] = values[index] || "";
    });

    console.log("Parsed Row:", obj);

    rows.push(obj);
  }

  return rows as T;
}
