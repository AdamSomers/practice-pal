import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { getChart } from '../lib/api';
import { CATEGORIES } from '../components/chart-builder/CategoryPicker';
import { getItemLabel } from '../components/chart-builder/ChartItemCard';
import type { PracticeChart, ChartItem, ChartCategory, ChartItemConfig } from '../lib/types';

function getItemDetails(category: ChartCategory, config: ChartItemConfig): string[] {
  const details: string[] = [];

  switch (category) {
    case 'scales':
    case 'arpeggios':
      if (config.key) details.push(`Key: ${config.key}`);
      if (config.type) details.push(`Type: ${config.type.replace(/_/g, ' ')}`);
      if (config.bpm) details.push(`BPM: ${config.bpmMax ? `${config.bpm}-${config.bpmMax}` : config.bpm}`);
      break;
    case 'cadences':
      if (config.key) details.push(`Key: ${config.key}`);
      if (config.type) details.push(`Type: ${config.type}`);
      break;
    case 'repertoire':
      if (config.piece) details.push(`Piece: ${config.piece}`);
      if (config.composer) details.push(`Composer: ${config.composer}`);
      if (config.movement) details.push(`Movement: ${config.movement}`);
      if (config.measures) details.push(`Measures: ${config.measures}`);
      if (config.bpm) details.push(`BPM: ${config.bpmMax ? `${config.bpm}-${config.bpmMax}` : config.bpm}`);
      break;
    case 'sight_reading':
      if (config.description) details.push(config.description);
      if (config.key) details.push(`Key: ${config.key}`);
      break;
    case 'theory':
    case 'other':
      if (config.label) details.push(config.label);
      if (config.description) details.push(config.description);
      break;
    case 'technique':
      if (config.label) details.push(config.label);
      if (config.description) details.push(config.description);
      if (config.bpm) details.push(`BPM: ${config.bpm}`);
      break;
  }

  if (config.modifiers && config.modifiers.length > 0) {
    details.push(`Modifiers: ${config.modifiers.join(', ')}`);
  }
  if (config.notes) {
    details.push(`Notes: ${config.notes}`);
  }

  return details;
}

export default function PrintableChartPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [chart, setChart] = useState<(PracticeChart & { items: ChartItem[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const data = await getChart(id);
        setChart(data);
      } catch (err) {
        console.error('Failed to load chart:', err);
        setError('Failed to load chart');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !chart) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-gray-500">{error || 'Chart not found'}</p>
        <button
          onClick={() => navigate(-1)}
          className="text-primary-600 font-semibold hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const sortedItems = [...(chart.items || [])].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <>
      <style>{`
        @media print {
          /* Hide app shell */
          nav, aside, header,
          [data-print-hide] {
            display: none !important;
          }
          /* Reset background */
          body, html {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          /* Reset layout padding */
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          /* Page breaks */
          .print-item {
            break-inside: avoid;
          }
        }
      `}</style>

      <div className="max-w-3xl mx-auto">
        {/* Action buttons (hidden in print) */}
        <div className="flex items-center gap-3 mb-6" data-print-hide>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>

        {/* Chart header */}
        <div className="mb-8 border-b-2 border-gray-200 pb-4">
          <h1 className="text-2xl font-extrabold text-gray-800">{chart.title}</h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
            <span>Created: {new Date(chart.createdAt).toLocaleDateString()}</span>
            {chart.minimumPracticeMinutes > 0 && (
              <span>Minimum: {chart.minimumPracticeMinutes} minutes</span>
            )}
            <span>{sortedItems.length} item{sortedItems.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Chart items */}
        <div className="space-y-5">
          {sortedItems.map((item) => {
            const catInfo = CATEGORIES.find((c) => c.key === item.category);
            const label = getItemLabel(item.category, item.config);
            const details = getItemDetails(item.category, item.config);

            return (
              <div
                key={item.id}
                className="print-item border border-gray-200 rounded-xl p-4"
              >
                {/* Item header */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-gray-400">
                    {catInfo?.label || item.category}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 capitalize mb-1">
                  {label}
                </h3>

                {/* Config details */}
                {details.length > 0 && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mb-3">
                    {details.map((detail, idx) => (
                      <span key={idx}>{detail}</span>
                    ))}
                  </div>
                )}

                {/* Checkbox grid */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {Array.from({ length: item.repetitions }, (_, i) => (
                    <div
                      key={i}
                      className="w-11 h-11 border-2 border-gray-300 rounded-md flex items-center justify-center text-xs text-gray-300 font-semibold"
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer (visible in print) */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
          PracticePal
        </div>
      </div>
    </>
  );
}
