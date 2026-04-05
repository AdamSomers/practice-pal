import { ArrowLeft, Music, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <Link
        to="/"
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Home
      </Link>

      {/* About */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md">
            <Music className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-800">PracticePal</h1>
            <p className="text-sm text-gray-400">Music practice tracker</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          PracticePal helps music students, parents, and teachers stay on top of practice.
          Teachers create weekly practice charts with scales, arpeggios, repertoire, and more.
          Students complete timed practice sessions with checkboxes, earn rewards, and track
          their progress over time.
        </p>
      </div>

      {/* Release Notes */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Release Notes</h2>
        <div className="text-center py-8 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7 text-primary-400" />
          </div>
          <p className="text-gray-500 font-medium">No releases yet</p>
          <p className="text-sm text-gray-400">
            Release notes will appear here as new versions are published.
          </p>
        </div>
      </div>
    </div>
  );
}
