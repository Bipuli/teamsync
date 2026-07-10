import { Link } from "react-router-dom";
import { HelpCircle, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
      <div className="text-center max-w-md space-y-5 bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-500 border border-slate-100">
          <HelpCircle className="h-8 w-8" />
        </div>
        <div className="space-y-1.5">
          <h2 className="font-display text-xl font-bold text-slate-900 tracking-tight">
            Page Not Found
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            The link you followed may be broken or the resource has been relocated.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
}
