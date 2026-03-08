import { useState, useEffect, useRef } from 'react';
import type { RepertoirePiece } from '../../lib/types';
import { getRepertoirePieces } from '../../lib/api';

interface PieceComboboxProps {
  studioId: string;
  piece: string;
  composer: string;
  onPieceChange: (piece: string) => void;
  onComposerChange: (composer: string) => void;
}

export default function PieceCombobox({
  studioId,
  piece,
  composer,
  onPieceChange,
  onComposerChange,
}: PieceComboboxProps) {
  const [knownPieces, setKnownPieces] = useState<RepertoirePiece[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!studioId) return;
    getRepertoirePieces(studioId)
      .then(setKnownPieces)
      .catch(() => setKnownPieces([]));
  }, [studioId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = piece.trim()
    ? knownPieces.filter(
        (p) =>
          p.piece.toLowerCase().includes(piece.toLowerCase()) ||
          (p.composer && p.composer.toLowerCase().includes(piece.toLowerCase()))
      )
    : knownPieces;

  const selectPiece = (p: RepertoirePiece) => {
    onPieceChange(p.piece);
    onComposerChange(p.composer || '');
    setShowDropdown(false);
    setHighlightIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || filtered.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault();
      selectPiece(filtered[highlightIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  return (
    <div ref={wrapperRef} className="space-y-4">
      {/* Piece Title */}
      <div className="relative">
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Piece Title
        </label>
        <input
          ref={inputRef}
          type="text"
          value={piece}
          onChange={(e) => {
            onPieceChange(e.target.value);
            setShowDropdown(true);
            setHighlightIndex(-1);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder="e.g., Fur Elise"
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition"
        />

        {showDropdown && filtered.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
            {filtered.map((p, i) => (
              <li
                key={`${p.piece}-${p.composer}`}
                onMouseDown={() => selectPiece(p)}
                onMouseEnter={() => setHighlightIndex(i)}
                className={`px-4 py-2.5 cursor-pointer transition-colors ${
                  i === highlightIndex
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="font-medium">{p.piece}</span>
                {p.composer && (
                  <span className="text-gray-400 ml-2 text-sm">
                    {p.composer}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Composer */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Composer
        </label>
        <input
          type="text"
          value={composer}
          onChange={(e) => onComposerChange(e.target.value)}
          placeholder="e.g., Beethoven"
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition"
        />
      </div>
    </div>
  );
}
