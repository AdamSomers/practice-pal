import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Trash2,
  UserPlus,
  X,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getStudio,
  updateStudio,
  deleteStudio,
  getMembers,
  inviteMember,
  changeMemberRole,
  removeMember,
} from '../lib/api';
import type { Studio, Member, StudioRole } from '../lib/types';
import { useAuthStore } from '../stores/auth';
import { defaultCategories } from '../lib/rewardEmojis';

export default function StudioSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const [studio, setStudio] = useState<Studio | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [name, setName] = useState('');
  const [instrument, setInstrument] = useState('');
  const [rewardCats, setRewardCats] = useState<string[]>(defaultCategories);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<StudioRole>('editor');
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [studioData, membersData] = await Promise.all([
          getStudio(id),
          getMembers(id).catch(() => []),
        ]);
        setStudio(studioData);
        setName(studioData.name);
        setInstrument(studioData.instrument || '');
        setRewardCats((studioData.rewardCategories as string[]) || defaultCategories);
        setMembers(membersData);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const updated = await updateStudio(id, {
        name: name.trim(),
        instrument: instrument.trim() || undefined,
        rewardCategories: rewardCats,
      });
      setStudio(updated);
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async () => {
    if (!id || !inviteEmail.trim()) return;
    try {
      await inviteMember(id, { email: inviteEmail.trim(), role: inviteRole });
      const updated = await getMembers(id);
      setMembers(updated);
      setInviteEmail('');
      setShowInvite(false);
    } catch (err) {
      console.error('Failed to invite:', err);
    }
  };

  const handleRoleChange = async (userId: string, role: StudioRole) => {
    if (!id) return;
    try {
      await changeMemberRole(id, userId, role);
      setMembers((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, role } : m))
      );
    } catch (err) {
      console.error('Failed to change role:', err);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!id) return;
    try {
      await removeMember(id, userId);
      setMembers((prev) => prev.filter((m) => m.id !== userId));
    } catch (err) {
      console.error('Failed to remove member:', err);
    }
  };

  const handleDelete = async () => {
    if (!id || deleteConfirm !== studio?.name) return;
    try {
      await deleteStudio(id);
      navigate('/');
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!studio) {
    return <p className="text-center py-20 text-gray-500">Studio not found</p>;
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Back */}
      <button
        onClick={() => navigate(`/studios/${id}`)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to studio
      </button>

      <h1 className="text-2xl font-extrabold text-gray-800">Studio Settings</h1>

      {/* General */}
      <section className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-800">General</h2>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Studio Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition"
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
            placeholder="e.g., Piano"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </section>

      {/* Members */}
      <section className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Members</h2>
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary-100 text-primary-700 rounded-xl text-sm font-semibold hover:bg-primary-200 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Invite
          </button>
        </div>

        {/* Invite form */}
        <AnimatePresence>
          {showInvite && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 pb-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Email address"
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as StudioRole)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                >
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button
                  onClick={handleInvite}
                  className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700"
                >
                  Send
                </button>
                <button
                  onClick={() => setShowInvite(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Members list */}
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-bold text-sm shrink-0">
                {member.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-800 truncate">
                  {member.displayName}
                </p>
                <p className="text-xs text-gray-400 truncate">{member.email}</p>
              </div>
              {member.role === 'owner' ? (
                <span className="flex items-center gap-1 px-2.5 py-1 bg-warm-100 text-warm-500 text-xs font-bold rounded-full">
                  <Shield className="w-3 h-3" />
                  Owner
                </span>
              ) : (
                <>
                  <select
                    value={member.role}
                    onChange={(e) =>
                      handleRoleChange(member.id, e.target.value as StudioRole)
                    }
                    className="px-2 py-1 bg-gray-100 border-none rounded-lg text-xs font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-white rounded-2xl shadow-md border border-red-100 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-bold text-red-600">Danger Zone</h2>
        </div>
        <p className="text-sm text-gray-500">
          Deleting a studio is permanent and cannot be undone. All charts,
          sessions, and data will be lost.
        </p>
        {!showDelete ? (
          <button
            onClick={() => setShowDelete(true)}
            className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors"
          >
            Delete Studio
          </button>
        ) : (
          <div className="space-y-3 p-4 bg-red-50 rounded-xl">
            <p className="text-sm font-medium text-red-700">
              Type <span className="font-bold">{studio.name}</span> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-red-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowDelete(false);
                  setDeleteConfirm('');
                }}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteConfirm !== studio.name}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4 inline mr-1" />
                Delete Forever
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
