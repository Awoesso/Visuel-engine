import React, { useState, useId, useRef } from 'react';
import type { ElementStyles } from '@dsk/core';
import {
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Image as ImageIcon,
  Palette,
  Sparkles,
  Upload,
  Link as LinkIcon,
} from 'lucide-react';

interface FillEditorProps {
  styles: ElementStyles;
  onChange: (updatedStyles: Partial<ElementStyles>) => void;
  disabled?: boolean;
}

type FillType = 'solid' | 'gradient' | 'image';

const PRESET_COLORS = [
  '#000000',
  '#ffffff',
  '#0d99ff',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#64748b',
  '#1e293b',
  '#f1f5f9',
  '#e2e8f0',
];

const PRESET_GRADIENTS = [
  'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
  'linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%)',
  'linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)',
  'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
  'radial-gradient(circle, #38bdf8 0%, #1e1b4b 100%)',
];

const PRESET_IMAGES = [
  { label: 'Texture Abstraite', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80' },
  { label: 'Dégradé Sombre', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80' },
  { label: 'Architecture Minimaliste', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80' },
];

export const FillEditor: React.FC<FillEditorProps> = ({ styles, onChange, disabled = false }) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FillType>('solid');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [gradientAngle, setGradientAngle] = useState('135deg');
  const [gradientColor1, setGradientColor1] = useState('#6366f1');
  const [gradientColor2, setGradientColor2] = useState('#a855f7');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const popoverId = useId();

  // Detect current active fill
  const currentBgColor = styles.backgroundColor ?? '';
  const currentBgImage = styles.backgroundImage ?? '';
  const hasFill = Boolean(currentBgColor || currentBgImage);
  const isImageFill = currentBgImage.startsWith('url(');
  const isGradientFill = currentBgImage.includes('-gradient(');
  const isVisible = (styles.opacity ?? 1) > 0;

  // Active hex representation
  let displayHex = 'FAFAFA';
  if (currentBgColor) {
    displayHex = currentBgColor.replace('#', '').toUpperCase();
  } else if (isGradientFill) {
    displayHex = 'GRADIENT';
  } else if (isImageFill) {
    displayHex = 'IMAGE';
  }

  // Handle color change
  const handleColorChange = (hex: string) => {
    onChange({
      backgroundColor: hex,
      backgroundImage: undefined,
    });
  };

  // Handle opacity change
  const handleOpacityChange = (pct: number) => {
    const clamped = Math.max(0, Math.min(100, pct));
    onChange({ opacity: clamped / 100 });
  };

  // Toggle visibility
  const toggleVisibility = () => {
    if (isVisible) {
      onChange({ opacity: 0 });
    } else {
      onChange({ opacity: 1 });
    }
  };

  // Remove fill
  const removeFill = () => {
    onChange({
      backgroundColor: undefined,
      backgroundImage: undefined,
      backgroundSize: undefined,
      backgroundPosition: undefined,
    });
    setPopoverOpen(false);
  };

  // Add default fill if none
  const addDefaultFill = () => {
    onChange({
      backgroundColor: '#FFFFFF',
      opacity: 1,
    });
    setActiveTab('solid');
    setPopoverOpen(true);
  };

  // Apply gradient
  const applyGradient = (gradString: string) => {
    onChange({
      backgroundColor: undefined,
      backgroundImage: gradString,
    });
  };

  // Apply custom gradient
  const applyCustomGradient = (angle: string, c1: string, c2: string) => {
    const grad = `linear-gradient(${angle}, ${c1} 0%, ${c2} 100%)`;
    onChange({
      backgroundColor: undefined,
      backgroundImage: grad,
    });
  };

  // Apply image
  const applyImage = (url: string, size: string = 'cover', position: string = 'center') => {
    onChange({
      backgroundColor: undefined,
      backgroundImage: `url("${url}")`,
      backgroundSize: size,
      backgroundPosition: position,
    });
  };

  // Handle local file upload (converted to safe Data URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image valide.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl === 'string') {
        applyImage(dataUrl, 'cover', 'center');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="figma-fill-section">
      <div className="figma-section-header">
        <span className="figma-section-title">Fill</span>
        <div className="figma-section-actions">
          {!hasFill && (
            <button
              type="button"
              className="figma-icon-btn"
              title="Ajouter un remplissage"
              aria-label="Ajouter un remplissage"
              disabled={disabled}
              onClick={addDefaultFill}
            >
              <Plus size={14} />
            </button>
          )}
        </div>
      </div>

      {hasFill ? (
        <div className="figma-fill-row">
          {/* Color/Gradient/Image preview swatch */}
          <button
            type="button"
            className="figma-fill-swatch-btn"
            title="Modifier le remplissage"
            aria-label="Modifier le remplissage"
            disabled={disabled}
            onClick={() => setPopoverOpen((prev) => !prev)}
            style={{
              background: currentBgImage
                ? currentBgImage
                : currentBgColor || '#FAFAFA',
              backgroundSize: styles.backgroundSize || 'cover',
              backgroundPosition: styles.backgroundPosition || 'center',
            }}
          />

          {/* Hex / Type input */}
          <div className="figma-fill-info">
            {isGradientFill ? (
              <span className="figma-fill-label">Dégradé</span>
            ) : isImageFill ? (
              <span className="figma-fill-label">Image</span>
            ) : (
              <div className="figma-hex-input-wrap">
                <span className="figma-hex-prefix">#</span>
                <input
                  type="text"
                  className="figma-hex-input"
                  maxLength={6}
                  value={displayHex}
                  disabled={disabled}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^0-9a-fA-F]/g, '');
                    if (clean.length === 6) {
                      handleColorChange(`#${clean}`);
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Opacity */}
          <div className="figma-opacity-wrap">
            <input
              type="number"
              className="figma-opacity-input"
              min={0}
              max={100}
              value={Math.round((styles.opacity ?? 1) * 100)}
              disabled={disabled}
              onChange={(e) => handleOpacityChange(Number(e.target.value))}
            />
            <span className="figma-opacity-unit">%</span>
          </div>

          {/* Visibility toggle */}
          <button
            type="button"
            className={`figma-icon-btn ${!isVisible ? 'is-off' : ''}`}
            title={isVisible ? 'Masquer le remplissage' : 'Afficher le remplissage'}
            aria-label={isVisible ? 'Masquer le remplissage' : 'Afficher le remplissage'}
            disabled={disabled}
            onClick={toggleVisibility}
          >
            {isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
          </button>

          {/* Delete fill */}
          <button
            type="button"
            className="figma-icon-btn figma-icon-btn-danger"
            title="Supprimer le remplissage"
            aria-label="Supprimer le remplissage"
            disabled={disabled}
            onClick={removeFill}
          >
            <Trash2 size={13} />
          </button>
        </div>
      ) : (
        <div className="figma-empty-fill">
          <span>Aucun remplissage</span>
          <button
            type="button"
            className="figma-add-fill-btn"
            disabled={disabled}
            onClick={addDefaultFill}
          >
            <Plus size={12} />
            <span>Ajouter</span>
          </button>
        </div>
      )}

      {/* Popover de configuration de remplissage Figma */}
      {popoverOpen && (
        <div className="figma-fill-popover" id={popoverId} role="dialog" aria-label="Éditeur de remplissage">
          <div className="figma-fill-tabs">
            <button
              type="button"
              className={`figma-fill-tab ${activeTab === 'solid' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('solid')}
            >
              <Palette size={13} />
              <span>Couleur</span>
            </button>
            <button
              type="button"
              className={`figma-fill-tab ${activeTab === 'gradient' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('gradient')}
            >
              <Sparkles size={13} />
              <span>Dégradé</span>
            </button>
            <button
              type="button"
              className={`figma-fill-tab ${activeTab === 'image' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('image')}
            >
              <ImageIcon size={13} />
              <span>Image</span>
            </button>
          </div>

          <div className="figma-fill-popover-content">
            {/* SOLID TAB */}
            {activeTab === 'solid' && (
              <div className="figma-solid-picker">
                <div className="figma-native-picker-row">
                  <input
                    type="color"
                    className="figma-color-circle"
                    value={currentBgColor && /^#[0-9a-f]{6}$/i.test(currentBgColor) ? currentBgColor : '#ffffff'}
                    onChange={(e) => handleColorChange(e.target.value)}
                  />
                  <div className="figma-color-value-display">
                    <code>{currentBgColor || '#FFFFFF'}</code>
                  </div>
                </div>

                <div className="figma-palette-label">Nuancier rapide</div>
                <div className="figma-palette-grid">
                  {PRESET_COLORS.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      className="figma-palette-swatch"
                      style={{ backgroundColor: hex }}
                      title={hex}
                      onClick={() => handleColorChange(hex)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* GRADIENT TAB */}
            {activeTab === 'gradient' && (
              <div className="figma-gradient-picker">
                <div className="figma-gradient-preview" style={{ background: currentBgImage || PRESET_GRADIENTS[0] }} />

                <div className="figma-gradient-stops">
                  <label className="figma-color-stop">
                    <span>Début</span>
                    <input
                      type="color"
                      value={gradientColor1}
                      onChange={(e) => {
                        setGradientColor1(e.target.value);
                        applyCustomGradient(gradientAngle, e.target.value, gradientColor2);
                      }}
                    />
                  </label>
                  <label className="figma-color-stop">
                    <span>Fin</span>
                    <input
                      type="color"
                      value={gradientColor2}
                      onChange={(e) => {
                        setGradientColor2(e.target.value);
                        applyCustomGradient(gradientAngle, gradientColor1, e.target.value);
                      }}
                    />
                  </label>
                  <label className="figma-color-stop">
                    <span>Angle</span>
                    <select
                      value={gradientAngle}
                      onChange={(e) => {
                        setGradientAngle(e.target.value);
                        applyCustomGradient(e.target.value, gradientColor1, gradientColor2);
                      }}
                    >
                      <option value="90deg">90° (Haut → Bas)</option>
                      <option value="135deg">135° (Diagonal)</option>
                      <option value="180deg">180° (Gauche → Droite)</option>
                      <option value="45deg">45° (Diagonal inversé)</option>
                    </select>
                  </label>
                </div>

                <div className="figma-palette-label">Dégradés prédéfinis</div>
                <div className="figma-gradient-presets">
                  {PRESET_GRADIENTS.map((grad, i) => (
                    <button
                      key={i}
                      type="button"
                      className="figma-gradient-preset-btn"
                      style={{ background: grad }}
                      title={grad}
                      onClick={() => applyGradient(grad)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* IMAGE TAB */}
            {activeTab === 'image' && (
              <div className="figma-image-picker">
                {isImageFill && (
                  <div
                    className="figma-image-preview"
                    style={{
                      backgroundImage: currentBgImage,
                      backgroundSize: styles.backgroundSize || 'cover',
                      backgroundPosition: styles.backgroundPosition || 'center',
                    }}
                  />
                )}

                <div className="figma-image-controls">
                  <div className="figma-control-row">
                    <span className="figma-control-label">Ajustement</span>
                    <select
                      className="figma-select"
                      value={styles.backgroundSize || 'cover'}
                      onChange={(e) =>
                        onChange({ backgroundSize: e.target.value })
                      }
                    >
                      <option value="cover">Cover (Remplir)</option>
                      <option value="contain">Contain (Ajuster)</option>
                      <option value="100% 100%">Fill (Étirer)</option>
                      <option value="auto">Taille réelle</option>
                    </select>
                  </div>

                  <div className="figma-upload-btn-wrap">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                    />
                    <button
                      type="button"
                      className="figma-action-button"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={13} />
                      <span>Importer une image</span>
                    </button>
                  </div>

                  <div className="figma-url-input-wrap">
                    <div className="figma-url-field">
                      <LinkIcon size={12} />
                      <input
                        type="url"
                        placeholder="https://... URL de l'image"
                        value={customImageUrl}
                        onChange={(e) => setCustomImageUrl(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      className="figma-apply-btn"
                      disabled={!customImageUrl.trim()}
                      onClick={() => {
                        if (customImageUrl.trim()) {
                          applyImage(customImageUrl.trim());
                          setCustomImageUrl('');
                        }
                      }}
                    >
                      OK
                    </button>
                  </div>

                  <div className="figma-palette-label">Galerie d’inspiration</div>
                  <div className="figma-image-presets">
                    {PRESET_IMAGES.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        className="figma-image-preset-item"
                        title={img.label}
                        onClick={() => applyImage(img.url)}
                      >
                        <img src={img.url} alt={img.label} loading="lazy" />
                        <span>{img.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="figma-fill-popover-footer">
            <button
              type="button"
              className="figma-popover-close-btn"
              onClick={() => setPopoverOpen(false)}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
