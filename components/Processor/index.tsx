"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { FileInput } from "../FileInput";
import { parseCSV } from "@/utils/parseCSV";
import { isIdUnique } from "@/utils/isIdUnique";
import {
  AllCommunityModule,
  CellValueChangedEvent,
  ColDef,
  ModuleRegistry,
  themeAlpine,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { Errors } from "../Errors";

// In real life, we should only register the modules we actually use
ModuleRegistry.registerModules([AllCommunityModule]);

interface FreightShipment extends Record<string, unknown> {
  shipment_id: string;
  origin_address: string;
  destination_address: string;
  mode: "air" | "sea" | "road" | "rail";
  weight_kg: number;
  progress_status: "pending" | "success" | "error";
  error_message?: string;
  results?: string;
}

const MAX_ROWS = 100;

export function Processor() {
  const gridRef = useRef<AgGridReact<FreightShipment>>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [freightShipmentData, setFreightShipmentData] = useState<
    FreightShipment[]
  >([]);
  const [
    freightShipmentDataValidationErrors,
    setFreightShipmentDataValidationErrors,
  ] = useState<string[]>([]);
  const [validationMap, setValidationMap] = useState<Map<string, Set<string>>>(
    new Map()
  );

  const columnDefs = useMemo<ColDef<FreightShipment>[]>(
    () => [
      {
        field: "shipment_id",
        headerName: "Shipment ID",
        editable: true,
        filter: true,
        sortable: true,
        cellEditor: "agTextCellEditor",
        maxWidth: 150,
        cellClassRules: {
          "bg-red-100 border-2 border-red-500": (params) => {
            const rowId = `${params.node.rowIndex}`;
            const fieldErrors = validationMap.get(rowId);
            return fieldErrors?.has("shipment_id") || false;
          },
        },
      },
      {
        field: "origin_address",
        headerName: "Origin Address",
        editable: true,
        filter: true,
        sortable: true,
        cellEditor: "agLargeTextCellEditor",
        cellEditorPopup: true,
      },
      {
        field: "destination_address",
        headerName: "Destination Address",
        editable: true,
        filter: true,
        sortable: true,
        cellEditor: "agLargeTextCellEditor",
        cellEditorPopup: true,
      },
      {
        field: "mode",
        headerName: "Mode",
        editable: true,
        filter: true,
        sortable: true,
        maxWidth: 100,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: {
          values: ["air", "sea", "road", "rail"],
        },
        cellClassRules: {
          "bg-red-100 border-2 border-red-500": (params) => {
            const rowId = `${params.node.rowIndex}`;
            const fieldErrors = validationMap.get(rowId);
            return fieldErrors?.has("mode") || false;
          },
        },
      },
      {
        field: "weight_kg",
        headerName: "Weight (kg)",
        editable: true,
        filter: true,
        sortable: true,
        cellEditor: "agNumberCellEditor",
        cellEditorParams: {
          min: 0.0,
        },
        maxWidth: 150,
        type: "numericColumn",
        valueParser: (params) => {
          const newValue = parseFloat(params.newValue);
          return isNaN(newValue) ? null : newValue;
        },
        cellClassRules: {
          "bg-red-100 border-2 border-red-500": (params) => {
            const rowId = `${params.node.rowIndex}`;
            const fieldErrors = validationMap.get(rowId);
            return fieldErrors?.has("weight_kg") || false;
          },
        },
      },
      {
        field: "progress_status",
        headerName: "Progress Status",
        editable: false,
        filter: true,
        sortable: true,
      },
      {
        field: "results",
        headerName: "Results",
        editable: false,
        filter: true,
        sortable: false,
      },
      {
        field: "error_message",
        headerName: "Error Message",
        editable: false,
        filter: true,
        sortable: false,
      },
    ],
    [validationMap]
  );

  const validateFreightData = useCallback((data: FreightShipment[]) => {
    const errors: string[] = [];
    const newValidationMap = new Map<string, Set<string>>();
    const validModes = ["air", "sea", "road", "rail"];

    const shipmentIds = data.map((row) => row.shipment_id).filter((id) => id);
    const duplicates = new Set<string>();

    if (!isIdUnique(shipmentIds)) {
      const idCounts = new Map<string, number>();

      shipmentIds.forEach((id) => {
        idCounts.set(id, (idCounts.get(id) || 0) + 1);
      });

      idCounts.forEach((count, id) => {
        if (count > 1) {
          duplicates.add(id);
        }
      });

      errors.push(
        `Duplicate shipment IDs found: ${Array.from(duplicates).join(", ")}`
      );
    }

    data.forEach((row, index) => {
      const rowId = `${index}`;
      const rowNum = index + 1;
      const rowErrors = new Set<string>();

      if (duplicates.has(row.shipment_id)) {
        rowErrors.add("shipment_id");
      }

      if (row.mode && !validModes.includes(row.mode)) {
        rowErrors.add("mode");
        errors.push(
          `Row ${rowNum}: Invalid mode "${
            row.mode
          }". Must be one of: ${validModes.join(", ")}`
        );
      }

      if (row.weight_kg !== undefined && row.weight_kg !== null) {
        const weight = Number(row.weight_kg);
        if (isNaN(weight) || weight < 0.0) {
          rowErrors.add("weight_kg");
          errors.push(
            `Row ${rowNum}: Invalid weight "${row.weight_kg}". Must be a number >= 0.0`
          );
        }
      }

      if (rowErrors.size > 0) {
        newValidationMap.set(rowId, rowErrors);
      }
    });

    setValidationMap(newValidationMap);
    setFreightShipmentDataValidationErrors(errors);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.name.endsWith(".csv")) {
      alert("Please upload a valid CSV file.");

      event.target.value = "";

      return;
    }

    setIsParsing(true);
    setParsingError(null);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parseData = parseCSV<FreightShipment[]>(text, MAX_ROWS);

        console.log("type", typeof parseData[0].weight_kg);

        console.log("Parsed Data:", parseData);

        setFreightShipmentData(parseData);
        validateFreightData(parseData);
        setIsParsing(false);
      } catch (error) {
        setParsingError("An error occurred while parsing the CSV file.");
        setIsParsing(false);

        console.error("CSV Parsing Error:", error);
      }
    };

    reader.onerror = () => {
      setParsingError("An error occurred while reading the CSV file.");
      setIsParsing(false);

      console.error("File Reading Error:", reader.error);
    };

    reader.readAsText(file);
  };

  const handleShipmentProcessing = () => {
    // TODO: Implement validation before submission to API
    // TODO: Implement submission to API
    console.log("Processing shipments...", freightShipmentData);
    console.log({
      true: freightShipmentDataValidationErrors.length > 0,
      isSubmitting,
    });
    gridRef.current!.api.setGridOption("columnDefs", columnDefs);
  };

  const isProcessingDisabled =
    freightShipmentData.length < 1 ||
    freightShipmentDataValidationErrors.length > 0 ||
    isSubmitting;

  return (
    <div className="flex flex-col w-full">
      <FileInput onChangeFileInput={handleFileUpload} />

      {isParsing && (
        <p className="mb-4 text-blue-950 text-center">Parsing file...</p>
      )}
      {parsingError && <p className="mb-4 text-red-700">{parsingError}</p>}
      {freightShipmentData.length > 0 && (
        <div className="w-full h-[600px] mb-4 ag-theme-alpine">
          <AgGridReact<FreightShipment>
            ref={gridRef}
            columnDefs={columnDefs}
            rowData={freightShipmentData}
            theme={themeAlpine}
            onCellValueChanged={(
              event: CellValueChangedEvent<FreightShipment>
            ) => {
              const changedField = event.column.getColId();
              const validatedFields = ["shipment_id", "mode", "weight_kg"];

              if (
                validatedFields.includes(changedField) &&
                event.rowIndex !== null
              ) {
                const updatedData = [...freightShipmentData];
                updatedData[event.rowIndex] = event.data;
                validateFreightData(updatedData);
              }
            }}
          />
        </div>
      )}
      {freightShipmentDataValidationErrors.length > 0 && (
        <Errors errors={freightShipmentDataValidationErrors} />
      )}

      <button
        className="cursor-pointer px-4 py-2 bg-blue-950 text-white rounded-lg hover:bg-blue-900 disabled:bg-blue-200"
        type="button"
        disabled={isProcessingDisabled}
        onClick={handleShipmentProcessing}
      >
        Process Shipments
      </button>
    </div>
  );
}
