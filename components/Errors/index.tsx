interface ErrorsProps {
  errors: string[];
}

export function Errors({ errors }: ErrorsProps) {
  return (
    <div className="mb-4 p-4 border rounded-lg border-red-700 bg-red-100">
      <h4 className="mb-2 font-bold text-red-700">
        Errors in Freight Shipment Data:
      </h4>
      <ul className="mb-4 text-red-700">
        {errors.map((error, index) => (
          <li key={index}>{error}</li>
        ))}
      </ul>
    </div>
  );
}
