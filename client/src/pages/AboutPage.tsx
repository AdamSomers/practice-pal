import { ArrowLeft, Music } from 'lucide-react';
import { Link } from 'react-router-dom';
import v010 from '../../../release-notes/v0.1.0.md?raw';
import v011 from '../../../release-notes/v0.1.1.md?raw';
import v012 from '../../../release-notes/v0.1.2.md?raw';
import v013 from '../../../release-notes/v0.1.3.md?raw';
import v014 from '../../../release-notes/v0.1.4.md?raw';
import v020 from '../../../release-notes/v0.2.0.md?raw';

const sortedNotes = [
  { version: 'v0.2.0', content: v020 },
  { version: 'v0.1.4', content: v014 },
  { version: 'v0.1.3', content: v013 },
  { version: 'v0.1.2', content: v012 },
  { version: 'v0.1.1', content: v011 },
  { version: 'v0.1.0', content: v010 },
];

// Safe: content sourced from our own build-time markdown files, not user input
function renderMarkdown(md: string): string {
  return md
    .replace(/^# .+\n*/m, '')
    .replace(/^## (.+)$/gm, '<h3 class="font-bold text-gray-800 mt-4 mb-1">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-sm text-gray-600">$1</li>')
    .replace(/((?:<li[^]*?<\/li>\n?)+)/g, '<ul class="list-disc space-y-0.5 mb-2">$1</ul>')
    .replace(/^(?!<)(.+)$/gm, '<p class="text-sm text-gray-600">$1</p>')
    .replace(/\n{2,}/g, '\n');
}

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
      {sortedNotes.map(({ version, content }) => (
        <div
          key={version}
          className="bg-white rounded-2xl shadow-md border border-gray-100 p-6"
        >
          <h2 className="text-lg font-bold text-gray-800 mb-2">{version}</h2>
          {/* Safe: content from our own build-time markdown files */}
          <div
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        </div>
      ))}
    </div>
  );
}
