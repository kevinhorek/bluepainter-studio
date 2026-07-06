import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getMarketingPreview,
  generateMarketingCopy,
  IMAGE_SPECS,
  renderMarketingImage,
  downloadImage,
  downloadMarketingKitZip
} from '../utils/marketingKit';
import { MARKETING_FIELD_GROUPS, getFieldText, getFieldFileLabel } from '../data/marketingFields';
import { COPY_TONES } from '../utils/copyToneVariants';
import MarketingDeployButtons from './MarketingDeployButtons';

const GROUP_AI_TYPE = {
  brand: 'brand',
  hero: 'hero',
  features: 'feature-cards',
  pricing: 'pricing',
  seo: 'marketing-copy',
  content: 'marketing-copy'
};

function FieldRow({
  field,
  value,
  active,
  onSelect,
  onChange,
  onEditCanvas
}) {
  return (
    <div className={`mk-field-row ${active ? 'active' : ''}`}>
      <button type="button" className="mk-field-select" onClick={() => onSelect(field)}>
        <span className="mk-field-label">{field.label}</span>
        <span className="mk-field-source">{getFieldFileLabel(field.fileId)}</span>
      </button>
      {field.multiline ? (
        <textarea
          className="mk-field-input"
          value={value}
          rows={3}
          onChange={(e) => onChange(field, e.target.value)}
          onFocus={() => onSelect(field)}
        />
      ) : (
        <input
          type="text"
          className="mk-field-input"
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          onFocus={() => onSelect(field)}
        />
      )}
      <button type="button" className="mk-edit-canvas-btn" onClick={() => onEditCanvas(field)} title="Select on canvas">
        Canvas
      </button>
    </div>
  );
}

export default function MarketingKitModal({
  isOpen,
  onClose,
  nodesByFile,
  activeFieldId,
  onSelectField,
  onUpdateField,
  onEditOnCanvas,
  onCaptureScreenshot,
  screenshotBlob,
  useScreenshot,
  onToggleScreenshot,
  onExported,
  onCopyToast,
  onOpenMarketingPage,
  onOpenAI
}) {
  const [tab, setTab] = useState('customize');
  const [toneId, setToneId] = useState('default');
  const [downloading, setDownloading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [imagePreviews, setImagePreviews] = useState({});

  const ctx = useMemo(() => getMarketingPreview(nodesByFile).ctx, [nodesByFile]);
  const copy = useMemo(() => generateMarketingCopy(ctx, toneId), [ctx, toneId]);

  const screenshotForExport = useScreenshot ? screenshotBlob : null;

  const loadImages = useCallback(async () => {
    const previews = {};
    for (const spec of IMAGE_SPECS) {
      const blob = await renderMarketingImage(ctx, copy, {
        width: spec.width,
        height: spec.height,
        variant: spec.id,
        screenshotBlob: screenshotForExport
      });
      previews[spec.id] = URL.createObjectURL(blob);
    }
    setImagePreviews((prev) => {
      Object.values(prev).forEach(URL.revokeObjectURL);
      return previews;
    });
  }, [ctx, copy, screenshotForExport]);

  useEffect(() => {
    if (!isOpen) return;
    if (tab === 'export') loadImages();
    return () => {
      setImagePreviews((prev) => {
        Object.values(prev).forEach(URL.revokeObjectURL);
        return {};
      });
    };
  }, [isOpen, tab, loadImages]);

  const handleFieldChange = (field, text) => {
    onUpdateField(field.fileId, field.nodeId, { text });
  };

  const handleCapture = async () => {
    setCapturing(true);
    try {
      await onCaptureScreenshot?.();
    } finally {
      setCapturing(false);
    }
  };

  const handleDownloadKit = async () => {
    setDownloading(true);
    try {
      const result = await downloadMarketingKitZip(
        nodesByFile,
        `${ctx.brandName.toLowerCase().replace(/\s+/g, '-')}-marketing`,
        { toneId, screenshotBlob: screenshotForExport }
      );
      onExported?.(result);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadImage = async (spec) => {
    const blob = await renderMarketingImage(ctx, copy, {
      width: spec.width,
      height: spec.height,
      variant: spec.id,
      screenshotBlob: screenshotForExport
    });
    await downloadImage(blob, spec.filename);
    onCopyToast?.(`${spec.label} downloaded`);
  };

  if (!isOpen) return null;

  return (
    <>
      <button type="button" className="mk-panel-backdrop" onClick={onClose} aria-label="Close marketing kit" />
      <aside className="mk-panel">
        <div className="mk-panel-header">
          <div>
            <h2>Marketing kit</h2>
            <p className="mk-subtitle">Customize on canvas, then export</p>
          </div>
          <button type="button" className="detail-drawer-close" onClick={onClose}>×</button>
        </div>

        <div className="mk-tabs">
          <button type="button" className={`mk-tab ${tab === 'customize' ? 'active' : ''}`} onClick={() => setTab('customize')}>Customize</button>
          <button type="button" className={`mk-tab ${tab === 'export' ? 'active' : ''}`} onClick={() => setTab('export')}>Export</button>
        </div>

        <div className="mk-panel-body">
          {tab === 'customize' && (
            <>
              <button type="button" className="mk-open-page-btn" onClick={onOpenMarketingPage}>
                Open MarketingPage on canvas →
              </button>

              <button type="button" className="mk-ai-full-btn" onClick={() => onOpenAI?.('full-marketing')}>
                ✨ AI Generate full landing
              </button>

              <div className="mk-tone-row">
                <label className="export-label">
                  Copy tone
                  <select value={toneId} onChange={(e) => setToneId(e.target.value)}>
                    {COPY_TONES.map((t) => (
                      <option key={t.id} value={t.id}>{t.label} — {t.description}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mk-screenshot-row">
                <label className="mk-checkbox">
                  <input type="checkbox" checked={useScreenshot} onChange={(e) => onToggleScreenshot?.(e.target.checked)} />
                  Include app screenshot in social images
                </label>
                <button type="button" className="mk-copy-btn" onClick={handleCapture} disabled={capturing}>
                  {capturing ? 'Capturing…' : 'Capture dashboard'}
                </button>
              </div>

              {MARKETING_FIELD_GROUPS.map((group) => (
                <div key={group.id} className="mk-field-group">
                  <div className="mk-field-group-head">
                    <span className="export-preview-label">{group.label}</span>
                    {onOpenAI && GROUP_AI_TYPE[group.id] && (
                      <button
                        type="button"
                        className="mk-ai-group-btn"
                        onClick={() => onOpenAI(GROUP_AI_TYPE[group.id])}
                      >
                        ✨ AI
                      </button>
                    )}
                  </div>
                  {group.fields.map((field) => (
                    <FieldRow
                      key={field.id}
                      field={field}
                      value={getFieldText(nodesByFile, field)}
                      active={activeFieldId === field.id}
                      onSelect={onSelectField}
                      onChange={handleFieldChange}
                      onEditCanvas={onEditOnCanvas}
                    />
                  ))}
                </div>
              ))}
            </>
          )}

          {tab === 'export' && (
            <>
              <p className="export-modal-lead">
                Export uses your canvas values{toneId !== 'default' ? ` (${COPY_TONES.find((t) => t.id === toneId)?.label} tone)` : ''}.
              </p>

              <div className="mk-images-grid">
                {IMAGE_SPECS.map((spec) => (
                  <div key={spec.id} className="mk-image-card">
                    {imagePreviews[spec.id] ? (
                      <img src={imagePreviews[spec.id]} alt={spec.label} />
                    ) : (
                      <div className="mk-image-placeholder">Generating…</div>
                    )}
                    <div className="mk-image-meta">
                      <span>{spec.label}</span>
                      <span className="mk-image-dims">{spec.width}×{spec.height}</span>
                    </div>
                    <button type="button" className="mk-copy-btn" onClick={() => handleDownloadImage(spec)}>Download PNG</button>
                  </div>
                ))}
              </div>

              <div className="mk-export-actions">
                <MarketingDeployButtons
                  nodesByFile={nodesByFile}
                  toneId={toneId}
                  onNotify={onCopyToast}
                />
                <button type="button" className="export-download-btn" onClick={handleDownloadKit} disabled={downloading}>
                  {downloading ? 'Building kit…' : 'Download full marketing kit (.zip)'}
                </button>
                <pre className="export-commands">{`cd landing
npx vercel --prod`}</pre>
                <p className="export-modal-note">Zip includes static landing, React site, copy, blog, press release, and social images.</p>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
