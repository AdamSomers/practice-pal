import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Save } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getChart, createChart, updateChart } from '../lib/api';
import type { ChartCategory, ChartItemConfig } from '../lib/types';
import CategoryPicker from '../components/chart-builder/CategoryPicker';
import ItemForm from '../components/chart-builder/ItemForm';
import ChartItemCard from '../components/chart-builder/ChartItemCard';

interface LocalChartItem {
  localId: string;
  id?: string;
  category: ChartCategory;
  sortOrder: number;
  config: ChartItemConfig;
  repetitions: number;
}

function generateLocalId() {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getDefaultTitle(): string {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - now.getDay() + 1);
  return `Week of ${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

interface DraftState {
  title: string;
  minimumMinutes: number;
  items: LocalChartItem[];
  studioId: string;
  savedAt: number;
}

const DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function getDraftKey(isEditing: boolean, id?: string, studioId?: string): string {
  return isEditing && id ? `pp_chart_draft_${id}` : `pp_chart_draft_new_${studioId || 'unknown'}`;
}

function saveDraft(key: string, state: DraftState) {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // localStorage full or unavailable
  }
}

function loadDraft(key: string): DraftState | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const draft: DraftState = JSON.parse(raw);
    if (Date.now() - draft.savedAt > DRAFT_MAX_AGE_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

function clearDraft(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export default function ChartBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Determine if editing or creating
  const isEditing = !!id && !window.location.pathname.includes('/charts/new');
  const studioIdFromUrl = window.location.pathname.match(/\/studios\/([^/]+)/)?.[1];

  const [title, setTitle] = useState(getDefaultTitle());
  const [minimumMinutes, setMinimumMinutes] = useState(0);
  const [items, setItems] = useState<LocalChartItem[]>([]);
  const [studioId, setStudioId] = useState(studioIdFromUrl || '');
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const draftKeyRef = useRef(getDraftKey(isEditing, id, studioIdFromUrl || ''));
  const initialLoadDone = useRef(false);
  const userModified = useRef(false);

  // Modal state
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [editingItem, setEditingItem] = useState<{
    localId: string;
    category: ChartCategory;
    config: ChartItemConfig;
    repetitions: number;
  } | null>(null);
  const [newItemCategory, setNewItemCategory] = useState<ChartCategory | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Load existing chart, then check for draft
  useEffect(() => {
    if (!isEditing || !id) {
      // New chart: check for draft immediately
      const draft = loadDraft(draftKeyRef.current);
      if (draft && draft.items.length > 0) {
        setTitle(draft.title);
        setMinimumMinutes(draft.minimumMinutes);
        setItems(draft.items);
        if (draft.studioId) setStudioId(draft.studioId);
        userModified.current = true; // Draft restored = treat as modified
      }
      initialLoadDone.current = true;
      return;
    }
    (async () => {
      try {
        const chart = await getChart(id);
        const draftKey = getDraftKey(true, id);
        draftKeyRef.current = draftKey;

        // Check if draft exists and is newer than the chart
        const draft = loadDraft(draftKey);
        if (draft && draft.items.length > 0) {
          setTitle(draft.title);
          setMinimumMinutes(draft.minimumMinutes);
          setStudioId(draft.studioId || chart.studioId);
          setItems(draft.items);
          userModified.current = true; // Draft restored = treat as modified
        } else {
          setTitle(chart.title);
          setMinimumMinutes(chart.minimumPracticeMinutes);
          setStudioId(chart.studioId);
          setItems(
            (chart.items || [])
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((item) => ({
                localId: generateLocalId(),
                id: item.id,
                category: item.category,
                sortOrder: item.sortOrder,
                config: item.config,
                repetitions: item.repetitions,
              }))
          );
        }
      } catch (err) {
        console.error('Failed to load chart:', err);
      } finally {
        setLoading(false);
        initialLoadDone.current = true;
      }
    })();
  }, [id, isEditing]);

  // Auto-save draft on every change, but only after user has modified something
  useEffect(() => {
    if (!initialLoadDone.current || !userModified.current) return;
    saveDraft(draftKeyRef.current, {
      title,
      minimumMinutes,
      items,
      studioId,
      savedAt: Date.now(),
    });
  }, [title, minimumMinutes, items, studioId]);

  // Warn on browser refresh/close when there are unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (userModified.current) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const handleNavigateAway = useCallback(() => {
    if (userModified.current && items.length > 0) {
      setShowLeaveConfirm(true);
    } else {
      clearDraft(draftKeyRef.current);
      navigate(studioId ? `/studios/${studioId}` : -1 as any);
    }
  }, [navigate, studioId, items.length]);

  const handleDiscard = useCallback(() => {
    clearDraft(draftKeyRef.current);
    userModified.current = false;
    setShowLeaveConfirm(false);
    navigate(studioId ? `/studios/${studioId}` : -1 as any);
  }, [navigate, studioId]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    userModified.current = true;
    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.localId === active.id);
      const newIndex = prev.findIndex((i) => i.localId === over.id);
      const newItems = arrayMove(prev, oldIndex, newIndex);
      return newItems.map((item, idx) => ({ ...item, sortOrder: idx }));
    });
  };

  const handleAddItem = (config: ChartItemConfig, repetitions: number) => {
    if (!newItemCategory) return;
    userModified.current = true;
    setItems((prev) => [
      ...prev,
      {
        localId: generateLocalId(),
        category: newItemCategory,
        sortOrder: prev.length,
        config,
        repetitions,
      },
    ]);
    setNewItemCategory(null);
  };

  const handleEditItem = (config: ChartItemConfig, repetitions: number) => {
    if (!editingItem) return;
    userModified.current = true;
    setItems((prev) =>
      prev.map((item) =>
        item.localId === editingItem.localId
          ? { ...item, config, repetitions }
          : item
      )
    );
    setEditingItem(null);
  };

  const handleDeleteItem = (localId: string) => {
    userModified.current = true;
    setItems((prev) =>
      prev
        .filter((i) => i.localId !== localId)
        .map((item, idx) => ({ ...item, sortOrder: idx }))
    );
  };

  const handleDuplicateItem = (localId: string) => {
    userModified.current = true;
    setItems((prev) => {
      const source = prev.find((i) => i.localId === localId);
      if (!source) return prev;
      const copy: LocalChartItem = {
        ...source,
        localId: generateLocalId(),
        id: undefined,
        sortOrder: prev.length,
        config: { ...source.config },
      };
      return [...prev, copy];
    });
  };

  const handleSave = async () => {
    if (!title.trim() || items.length === 0) return;
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        minimumPracticeMinutes: minimumMinutes,
        items: items.map((item) => ({
          id: item.id,
          category: item.category,
          sortOrder: item.sortOrder,
          config: item.config,
          repetitions: item.repetitions,
        })),
      };

      if (isEditing && id) {
        await updateChart(id, payload);
        clearDraft(draftKeyRef.current);
        userModified.current = false;
        navigate(`/studios/${studioId}`);
      } else if (studioId) {
        await createChart(studioId, payload);
        clearDraft(draftKeyRef.current);
        userModified.current = false;
        navigate(`/studios/${studioId}`);
      }
    } catch (err) {
      console.error('Failed to save chart:', err);
    } finally {
      setSaving(false);
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
    <div className="space-y-6 max-w-2xl">
      {/* Back */}
      <button
        onClick={handleNavigateAway}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <h1 className="text-2xl font-extrabold text-gray-800">
        {isEditing ? 'Edit Chart' : 'New Practice Chart'}
      </h1>

      {/* Unsaved changes confirmation */}
      <AnimatePresence>
        {showLeaveConfirm && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center justify-between px-4 py-3 bg-warm-100 border border-warm-200 rounded-xl"
          >
            <p className="text-sm font-medium text-warm-600">You have unsaved changes</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="px-3 py-1.5 text-sm font-semibold text-gray-500 bg-white rounded-lg hover:bg-gray-100 transition-colors"
              >
                Keep editing
              </button>
              <button
                onClick={handleDiscard}
                className="px-3 py-1.5 text-sm font-semibold text-red-600 bg-white rounded-lg hover:bg-red-50 transition-colors"
              >
                Discard
              </button>
              <button
                onClick={() => { setShowLeaveConfirm(false); handleSave(); }}
                className="px-3 py-1.5 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Chart Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => { userModified.current = true; setTitle(e.target.value); }}
          placeholder="e.g., Week of Mar 4"
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition shadow-sm"
        />
      </div>

      {/* Minimum practice minutes */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Minimum Practice Time
        </label>
        <select
          value={minimumMinutes}
          onChange={(e) => { userModified.current = true; setMinimumMinutes(Number(e.target.value)); }}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition shadow-sm"
        >
          <option value={0}>No minimum</option>
          {[15, 20, 25, 30, 45, 60].map((min) => (
            <option key={min} value={min}>
              {min} minutes
            </option>
          ))}
        </select>
      </div>

      {/* Items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">
            Practice Items{' '}
            <span className="text-sm font-normal text-gray-400">
              ({items.length})
            </span>
          </h2>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-xl border-2 border-dashed border-gray-200 space-y-2">
            <p className="text-gray-400 font-medium">No items yet</p>
            <p className="text-xs text-gray-400">
              Add practice items to your chart
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((i) => i.localId)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                <AnimatePresence>
                  {items.map((item) => (
                    <SortableItem key={item.localId} id={item.localId}>
                      {(dragHandleProps) => (
                        <ChartItemCard
                          category={item.category}
                          config={item.config}
                          repetitions={item.repetitions}
                          onEdit={() =>
                            setEditingItem({
                              localId: item.localId,
                              category: item.category,
                              config: item.config,
                              repetitions: item.repetitions,
                            })
                          }
                          onDelete={() => handleDeleteItem(item.localId)}
                          onDuplicate={() => handleDuplicateItem(item.localId)}
                          dragHandleProps={dragHandleProps}
                        />
                      )}
                    </SortableItem>
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>
          </DndContext>
        )}

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setShowCategoryPicker(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-primary-200 rounded-xl text-primary-500 font-semibold hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50/50 transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Item
        </motion.button>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving || !title.trim() || items.length === 0}
        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary-600 text-white rounded-xl font-bold shadow-lg hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Save className="w-5 h-5" />
        {saving ? 'Saving...' : isEditing ? 'Update Chart' : 'Save Chart'}
      </button>

      {/* Modals */}
      <AnimatePresence>
        {showCategoryPicker && (
          <CategoryPicker
            onSelect={(category) => {
              setShowCategoryPicker(false);
              setNewItemCategory(category);
            }}
            onClose={() => setShowCategoryPicker(false)}
          />
        )}
        {newItemCategory && (
          <ItemForm
            category={newItemCategory}
            studioId={studioId}
            onSave={handleAddItem}
            onClose={() => setNewItemCategory(null)}
          />
        )}
        {editingItem && (
          <ItemForm
            category={editingItem.category}
            studioId={studioId}
            initialConfig={editingItem.config}
            initialRepetitions={editingItem.repetitions}
            onSave={handleEditItem}
            onClose={() => setEditingItem(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SortableItem({
  id,
  children,
}: {
  id: string;
  children: (dragHandleProps: Record<string, unknown>) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({ ...attributes, ...listeners })}
    </div>
  );
}
