import { useState, useEffect, useCallback } from 'react';
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

export default function ChartBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Determine if editing or creating
  const isEditing = !!id && !window.location.pathname.includes('/charts/new');
  const studioIdFromUrl = window.location.pathname.match(/\/studios\/([^/]+)/)?.[1];

  const [title, setTitle] = useState(getDefaultTitle());
  const [minimumMinutes, setMinimumMinutes] = useState(20);
  const [items, setItems] = useState<LocalChartItem[]>([]);
  const [studioId, setStudioId] = useState(studioIdFromUrl || '');
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

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

  // Load existing chart
  useEffect(() => {
    if (!isEditing || !id) return;
    (async () => {
      try {
        const chart = await getChart(id);
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
      } catch (err) {
        console.error('Failed to load chart:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEditing]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.localId === active.id);
      const newIndex = prev.findIndex((i) => i.localId === over.id);
      const newItems = arrayMove(prev, oldIndex, newIndex);
      return newItems.map((item, idx) => ({ ...item, sortOrder: idx }));
    });
  };

  const handleAddItem = (config: ChartItemConfig, repetitions: number) => {
    if (!newItemCategory) return;
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
    setItems((prev) =>
      prev
        .filter((i) => i.localId !== localId)
        .map((item, idx) => ({ ...item, sortOrder: idx }))
    );
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
        navigate(`/studios/${studioId}`);
      } else if (studioId) {
        await createChart(studioId, payload);
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
        onClick={() => navigate(studioId ? `/studios/${studioId}` : -1 as any)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <h1 className="text-2xl font-extrabold text-gray-800">
        {isEditing ? 'Edit Chart' : 'New Practice Chart'}
      </h1>

      {/* Title */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Chart Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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
          onChange={(e) => setMinimumMinutes(Number(e.target.value))}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition shadow-sm"
        >
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
            onSave={handleAddItem}
            onClose={() => setNewItemCategory(null)}
          />
        )}
        {editingItem && (
          <ItemForm
            category={editingItem.category}
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
