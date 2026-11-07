import React, { useState } from 'react';
import { Link2, Link2Off } from 'lucide-react';

interface SpacingBoxProps {
  label: string;
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  onChange: (values: { top?: string; right?: string; bottom?: string; left?: string }) => void;
  disabled?: boolean;
}

function parseValueUnit(val?: string): { num: string; unit: string } {
  if (!val) return { num: '', unit: 'px' };
  const match = val.trim().match(/^(-?\d*(?:\.\d+)?)(px|rem|em|%|vw|vh)?$/);
  if (!match) return { num: val, unit: 'px' };
  return { num: match[1] ?? '', unit: match[2] ?? 'px' };
}

export const SpacingBox: React.FC<SpacingBoxProps> = ({
  label,
  top = '',
  right = '',
  bottom = '',
  left = '',
  onChange,
  disabled = false,
}) => {
  const [isLinked, setIsLinked] = useState(
    Boolean(top && top === right && top === bottom && top === left)
  );

  const topParsed = parseValueUnit(top);
  const rightParsed = parseValueUnit(right);
  const bottomParsed = parseValueUnit(bottom);
  const leftParsed = parseValueUnit(left);

  const handleSingleChange = (side: 'top' | 'right' | 'bottom' | 'left', val: string) => {
    const formatted = val.trim() ? (isNaN(Number(val)) ? val : `${val}px`) : undefined;
    if (isLinked) {
      onChange({
        top: formatted,
        right: formatted,
        bottom: formatted,
        left: formatted,
      });
    } else {
      onChange({ [side]: formatted });
    }
  };

  return (
    <div className="figma-spacing-block">
      <div className="figma-section-header">
        <span className="figma-section-title">{label}</span>
        <button
          type="button"
          className={`figma-icon-btn ${isLinked ? 'is-active' : ''}`}
          title={isLinked ? 'Délier les 4 côtés' : 'Lier les 4 côtés'}
          aria-label={isLinked ? 'Délier les 4 côtés' : 'Lier les 4 côtés'}
          disabled={disabled}
          onClick={() => setIsLinked((prev) => !prev)}
        >
          {isLinked ? <Link2 size={13} /> : <Link2Off size={13} />}
        </button>
      </div>

      {isLinked ? (
        <div className="figma-spacing-linked-row">
          <span className="figma-input-label">Tous</span>
          <input
            type="number"
            className="figma-number-input"
            placeholder="0"
            value={topParsed.num}
            disabled={disabled}
            onChange={(e) => handleSingleChange('top', e.target.value)}
          />
          <span className="figma-input-unit">px</span>
        </div>
      ) : (
        <div className="figma-spacing-grid">
          {/* Top */}
          <div className="figma-spacing-field">
            <span className="figma-input-label">H</span>
            <input
              type="number"
              className="figma-number-input"
              placeholder="0"
              value={topParsed.num}
              disabled={disabled}
              onChange={(e) => handleSingleChange('top', e.target.value)}
            />
          </div>

          {/* Right */}
          <div className="figma-spacing-field">
            <span className="figma-input-label">D</span>
            <input
              type="number"
              className="figma-number-input"
              placeholder="0"
              value={rightParsed.num}
              disabled={disabled}
              onChange={(e) => handleSingleChange('right', e.target.value)}
            />
          </div>

          {/* Bottom */}
          <div className="figma-spacing-field">
            <span className="figma-input-label">B</span>
            <input
              type="number"
              className="figma-number-input"
              placeholder="0"
              value={bottomParsed.num}
              disabled={disabled}
              onChange={(e) => handleSingleChange('bottom', e.target.value)}
            />
          </div>

          {/* Left */}
          <div className="figma-spacing-field">
            <span className="figma-input-label">G</span>
            <input
              type="number"
              className="figma-number-input"
              placeholder="0"
              value={leftParsed.num}
              disabled={disabled}
              onChange={(e) => handleSingleChange('left', e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
