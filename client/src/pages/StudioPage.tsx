import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Music2,
  Plus,
  Play,
  Settings,
  Users,
  BarChart3,
  Award,
  Clock,
  LayoutGrid,
  Pencil,
  Printer,
  FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getStudio,
  getCharts,
  getMembers,
  getMasteredItems,
} from '../lib/api';
import type {
  Studio,
  PracticeChart,
  Member,
  MasteredItem,
} from '../lib/types';

type Tab = 'charts' | 'progress' | 'members' | 'mastery';

export default function StudioPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [studio, setStudio] = useState<Studio | null>(null);
  const [charts, setCharts] = useState<PracticeChart[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [mastered, setMastered] = useState<MasteredItem[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('charts');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const studioData = await getStudio(id);
        setStudio(studioData);
        const [chartsData, membersData] = await Promise.all([
          getCharts(id).catch(() => []),
          getMembers(id).catch(() => []),
        ]);
        setCharts(chartsData);
        setMembers(membersData);
        getMasteredItems(id)
          .then(setMastered)
          .catch(() => setMastered([]));
      } catch (err) {
        console.error('Failed to load studio:', err);
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

  if (!studio) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Studio not found</p>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'charts', label: 'Charts', icon: <FileText className="w-4 h-4" /> },
    { key: 'progress', label: 'Progress', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'members', label: 'Members', icon: <Users className="w-4 h-4" /> },
    { key: 'mastery', label: 'Mastery', icon: <Award className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-gray-800">{studio.name}</h1>
            {studio.instrument && (
              <span className="px-3 py-1 bg-teal-400/10 text-teal-500 text-xs font-bold rounded-full">
                {studio.instrument}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">
            {members.length} member{members.length !== 1 ? 's' : ''}
          </p>
        </div>
        {studio.role === 'owner' && (
          <Link
            to={`/studios/${id}/settings`}
            className="p-2.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
          >
            <Settings className="w-5 h-5" />
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              if (tab.key === 'progress') {
                navigate(`/studios/${id}/progress`);
                return;
              }
              setActiveTab(tab.key);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'charts' && (
          <ChartsTab
            key="charts"
            studioId={id!}
            charts={charts}
            navigate={navigate}
          />
        )}
        {activeTab === 'members' && (
          <MembersTab key="members" members={members} />
        )}
        {activeTab === 'mastery' && (
          <MasteryTab key="mastery" mastered={mastered} />
        )}
      </AnimatePresence>
    </div>
  );
}

function ChartsTab({
  studioId,
  charts,
  navigate,
}: {
  studioId: string;
  charts: PracticeChart[];
  navigate: ReturnType<typeof useNavigate>;
}) {
  const sortedCharts = [...charts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-3"
    >
      <button
        onClick={() => navigate(`/studios/${studioId}/charts/new`)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl font-bold shadow-md hover:bg-primary-700 transition-colors"
      >
        <Plus className="w-5 h-5" />
        Create Chart
      </button>

      {sortedCharts.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7 text-primary-400" />
          </div>
          <p className="text-gray-500 font-medium">No practice charts yet</p>
          <p className="text-sm text-gray-400">
            Create your first chart to start practicing
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedCharts.map((chart, i) => (
            <motion.div
              key={chart.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 truncate">{chart.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(chart.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <LayoutGrid className="w-3 h-3" />
                      {chart.itemCount ?? chart.items?.length ?? 0} items
                    </span>
                    <span>{chart.minimumPracticeMinutes ? `${chart.minimumPracticeMinutes} min` : 'No min'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/charts/${chart.id}/practice`);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-teal-500 text-white rounded-xl text-sm font-semibold hover:bg-teal-600 transition-colors shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Practice
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/charts/${chart.id}/print`);
                    }}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Print chart"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/charts/${chart.id}/edit`);
                    }}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function MembersTab({ members }: { members: Member[] }) {
  const roleColors: Record<string, string> = {
    owner: 'bg-warm-100 text-warm-500',
    editor: 'bg-primary-100 text-primary-600',
    viewer: 'bg-gray-100 text-gray-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-2"
    >
      {members.length === 0 ? (
        <p className="text-center py-8 text-gray-400">No members</p>
      ) : (
        members.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-3 bg-white rounded-xl shadow-sm border border-gray-100 p-4"
          >
            <div className="w-10 h-10 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-bold text-sm shrink-0">
              {member.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 truncate">
                {member.displayName}
              </p>
              <p className="text-xs text-gray-400 truncate">{member.email}</p>
            </div>
            <span
              className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                roleColors[member.role] || roleColors.viewer
              }`}
            >
              {member.role}
            </span>
            {!member.acceptedAt && (
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-warm-100 text-warm-500 rounded-full">
                Pending
              </span>
            )}
          </div>
        ))
      )}
    </motion.div>
  );
}

function MasteryTab({ mastered }: { mastered: MasteredItem[] }) {
  const categoryLabels: Record<string, string> = {
    scales: 'Scales',
    arpeggios: 'Arpeggios',
    cadences: 'Cadences',
    repertoire: 'Repertoire',
    sight_reading: 'Sight Reading',
    theory: 'Theory',
    other: 'Other',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-2"
    >
      {mastered.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-warm-100 flex items-center justify-center mx-auto">
            <Award className="w-7 h-7 text-warm-400" />
          </div>
          <p className="text-gray-500 font-medium">No mastered items yet</p>
          <p className="text-sm text-gray-400">
            Items will appear here as you master them
          </p>
        </div>
      ) : (
        mastered.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 bg-white rounded-xl shadow-sm border border-gray-100 p-4"
          >
            <div className="w-8 h-8 rounded-lg bg-warm-100 flex items-center justify-center">
              <Award className="w-4 h-4 text-warm-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 truncate">
                {item.description}
              </p>
              <p className="text-xs text-gray-400">
                {categoryLabels[item.category] || item.category}
              </p>
            </div>
            <span className="text-xs text-gray-400">
              {new Date(item.masteredAt).toLocaleDateString()}
            </span>
          </div>
        ))
      )}
    </motion.div>
  );
}
