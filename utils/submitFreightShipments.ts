export interface FreightShipment extends Record<string, unknown> {
  shipment_id: string;
  origin_address: string;
  destination_address: string;
  mode: "air" | "sea" | "road" | "rail";
  weight_kg: number;
  progress_status: "pending" | "success" | "error";
  error_message?: string;
  results?: string;
}

function submitSingleShipment(
  shipment: FreightShipment,
  apiKey: string,
  baseUrl: string
): Promise<FreightShipment> {
  // Simulated API call to submit a single shipment
}

export async function submitFreightShipments(
  shipments: FreightShipment[],
  onProgress?: (updatedShipments: FreightShipment[]) => void
): Promise<FreightShipment[]> {
  const apiKey = process.env.NEXT_PUBLIC_CLIMATIQ_API_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_CLIMATIQ_API_BASE_URL;

  if (!apiKey || !baseUrl) {
    throw new Error(
      "Climatiq API credentials not found in environment variables"
    );
  }

  const results: FreightShipment[] = [];

  for (const shipment of shipments) {
    const updatedShipment = await submitSingleShipment(
      { ...shipment, progress_status: "pending" },
      apiKey,
      baseUrl
    );
    results.push(updatedShipment);

    if (onProgress) {
      onProgress([...results]);
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}
