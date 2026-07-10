export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-100 bg-white py-4 px-6 text-center text-xs font-medium text-slate-400 font-sans mt-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
        <p>&copy; 2026 TeamSync Inc. All rights reserved.</p>
        <div className="flex gap-4">
          <span className="hover:text-slate-600 transition-colors cursor-pointer">Privacy Policy</span>
          <span className="hover:text-slate-600 transition-colors cursor-pointer">Terms of Service</span>
        </div>
      </div>
    </footer>
  );
}
