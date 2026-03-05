import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Music2, Clock, LayoutGrid, X, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStudios, createStudio, getInvitations, acceptInvitation } from '../lib/api';
import type { Studio, Invitation } from '../lib/types';
import { ApiError } from '../lib/api';

export default function DashboardPage() {
  const [studios, setStudios] = useState<Studio[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const studioData = await getStudios();
      setStudios(studioData);
      try {
        const inviteData = await getInvitations();
        setInvitations(inviteData);
      } catch {
        // invitations endpoint may not exist yet
      }
    } catch (err) {
      console.error('Failed to load studios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAcceptInvitation = async (studioId: string) => {
    try {
      await acceptInvitation(studioId);
      setInvitations((prev) => prev.filter((i) => i.studioId !== studioId));
      fetchData();
    } catch (err) {
      console.error('Failed to accept invitation:', err);
    }
  };

  const handleCreateStudio = async (name: string, instrument: string) => {
    try {
      const studio = await createStudio({ name, instrument: instrument || undefined });
      setStudios((prev) => [...prev, studio]);
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to create studio:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Invitations */}
      {invitations.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            Pending Invitations
          </h2>
          {invitations.map((invite) => (
            <motion.div
              key={invite.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between bg-warm-50 border border-warm-200 rounded-xl px-4 py-3"
            >
              <div>
                <p className="font-semibold text-gray-800">{invite.studioName}</p>
                <p className="text-xs text-gray-500">
                  Invited as <span className="font-medium">{invite.role}</span>
                </p>
              </div>
              <button
                onClick={() => handleAcceptInvitation(invite.studioId)}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
              >
                <Check className="w-4 h-4" />
                Accept
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-gray-800">Your Studios</h1>
      </div>

      {/* Studios grid */}
      {studios.length === 0 && !loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto">
            <Music2 className="w-8 h-8 text-primary-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-700">No studios yet</p>
            <p className="text-sm text-gray-400">
              Create your first studio to start tracking practice
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-2xl font-bold shadow-md hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Studio
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {studios.map((studio, i) => (
              <motion.div
                key={studio.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/studios/${studio.id}`)}
                className="bg-white rounded-2xl shadow-md border border-primary-100/50 p-5 cursor-pointer hover:shadow-lg hover:border-primary-200 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-sm">
                    <Music2 className="w-5 h-5 text-white" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-400 transition-colors" />
                </div>
                <h3 className="font-bold text-gray-800 text-lg">{studio.name}</h3>
                {studio.instrument && (
                  <span className="inline-block mt-1 px-2.5 py-0.5 bg-teal-400/10 text-teal-500 text-xs font-semibold rounded-full">
                    {studio.instrument}
                  </span>
                )}
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <LayoutGrid className="w-3.5 h-3.5" />
                    {studio.role}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(studio.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Create studio card */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreateModal(true)}
            className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-primary-200 rounded-2xl text-primary-400 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50/50 transition-all min-h-[160px]"
          >
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <Plus className="w-6 h-6" />
            </div>
            <span className="font-bold">Create Studio</span>
          </motion.button>
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateStudioModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateStudio}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CreateStudioModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, instrument: string) => void;
}) {
  const [name, setName] = useState('');
  const [instrument, setInstrument] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), instrument.trim());
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-extrabold text-gray-800">Create Studio</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Studio Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Piano Practice"
              autoFocus
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Instrument
            </label>
            <input
              type="text"
              value={instrument}
              onChange={(e) => setInstrument(e.target.value)}
              placeholder="e.g., Piano, Violin, Guitar"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
