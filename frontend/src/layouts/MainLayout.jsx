import Navbar from "../components/Navbar";

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="px-4 md:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
