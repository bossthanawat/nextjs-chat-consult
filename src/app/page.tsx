import ChatSection from "./ChatSection";

export default function Home() {
  return (
    <div className="container mt-20">
      <h3 className="text-xl md:text-3xl font-medium">Chat Consultant</h3>
      <div className="mt-4 mx-auto w-full bg-white border [box-shadow:5px_5px_rgb(82_82_82)] rounded-lg overflow-hidden p-2">
        <ChatSection />
      </div>
    </div>
  );
}
