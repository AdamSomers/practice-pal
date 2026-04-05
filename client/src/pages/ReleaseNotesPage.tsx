import { ArrowLeft, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ReleaseNotesPage() {
  return (
    <div className="space-y-6">
      <Link
        to="/"
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Home
      </Link>

      <h1 className="text-2xl font-extrabold text-gray-800">Release Notes</h1>

      <div className="text-center py-12 space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto">
          <FileText className="w-7 h-7 text-primary-400" />
        </div>
        <p className="text-gray-500 font-medium">No releases yet</p>
        <p className="text-sm text-gray-400">
          Release notes will appear here as new versions are published.
        </p>
      </div>
    </div>
  );
}
