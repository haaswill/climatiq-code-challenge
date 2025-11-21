import { Processor } from "@/components/Processor";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-blue-200 font-sans">
      <header className="absolute top-0 left-0 w-full p-4 bg-blue-950 text-white text-center text-3xl font-bold">
        Climatiq Freight Shipment Processor
      </header>
      <main className="flex min-h-screen w-full max-w-6xl flex-col items-center justify-between py-32 px-16 bg-white sm:items-start">
        <div className="flex w-full items-center justify-center">
          <Processor />
        </div>
      </main>
    </div>
  );
}
