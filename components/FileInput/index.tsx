interface FileInputProps {
  onChangeFileInput: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FileInput({ onChangeFileInput }: FileInputProps) {
  return (
    <label
      id="file-input"
      htmlFor="file-input"
      className="block mb-4 text-2xl text-center text-blue-950"
    >
      Upload File (.csv only)
      <input
        type="file"
        accept=".csv, text/csv"
        id="file-input"
        className="cursor-pointer block mt-5 p-1 w-full text-blue-950 text-sm rounded-lg leading-6 border border-blue-950 file:bg-blue-950 file:text-white file:font-semibold file:border-none file:px-4 file:py-1 file:mr-6 file:rounded-lg file:cursor-pointer hover:file:bg-blue-900"
        onChange={onChangeFileInput}
      />
    </label>
  );
}
