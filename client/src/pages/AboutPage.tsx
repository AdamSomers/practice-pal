import { ArrowLeft, Music } from 'lucide-react';
import { Link } from 'react-router-dom';

const releaseNotes = import.meta.glob('/../../release-notes/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

// Sort by filename descending (newest first)
const sortedNotes = Object.entries(releaseNotes)
  .sort(([a], [b]) => b.localeCompare(a))
  .map(([path, content]) => {
    const filename = path.split('/').pop()?.replace('.md', '') || '';
    return { version: filename, content };
  });

// Safe: content is from our own release-notes/*.md files imported at build time
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
      {sortedNotes.length > 0 ? (
        sortedNotes.map(({ version, content }) => (
          <div
            key={version}
            className="bg-white rounded-2xl shadow-md border border-gray-100 p-6"
          >
            <h2 className="text-lg font-bold text-gray-800 mb-2">{version}</h2>
            {/* Safe: content sourced from our own build-time markdown files, not user input */}
            <div
              dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
            />
          </div>
        ))
      ) : (
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 text-center py-8">
          <p className="text-gray-500 font-medium">No releases yet</p>
        </div>
      )}
    </div>
  );
}
