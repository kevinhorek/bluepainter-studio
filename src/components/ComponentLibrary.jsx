import { WORKSPACE_FILES, LIBRARY_FILE_IDS } from '../data/workspaceFiles';

export default function ComponentLibrary({
  isPageFile,
  componentLibrary,
  onInsertComponent,
  onOpenComponentFile
}) {
  return (
    <div className="component-library">
      <p className="component-library-lead">
        {isPageFile
          ? 'Drag a component onto the page canvas, or click Insert.'
          : 'Open a page file (e.g. DashboardPage.tsx) to place components on a layout.'}
      </p>
      <div className="component-library-list">
        {LIBRARY_FILE_IDS.map((fileId) => {
          const file = WORKSPACE_FILES[fileId];
          const previewNodes = componentLibrary?.[fileId];
          const hasPreview = Boolean(previewNodes);

          return (
            <div
              key={fileId}
              className={`component-library-item ${isPageFile ? '' : 'component-library-item-disabled'}`}
              draggable={isPageFile}
              onDragStart={(e) => {
                if (!isPageFile) return;
                e.dataTransfer.setData('componentRef', fileId);
                e.dataTransfer.effectAllowed = 'copy';
              }}
            >
              <div className="component-library-item-head">
                <span className="component-library-item-icon">◆</span>
                <div>
                  <div className="component-library-item-name">{file.componentName}</div>
                  <div className="component-library-item-file">{file.label}</div>
                </div>
              </div>
              <p className="component-library-item-desc">
                {fileId === 'pricing' && 'Pricing card with CTA and feature list.'}
                {fileId === 'hero' && 'Hero banner with headline and primary button.'}
              </p>
              <div className="component-library-item-actions">
                <button
                  type="button"
                  className="component-library-insert"
                  disabled={!isPageFile}
                  onClick={() => onInsertComponent?.(fileId)}
                >
                  Insert
                </button>
                <button
                  type="button"
                  className="component-library-edit"
                  onClick={() => onOpenComponentFile?.(fileId)}
                >
                  Edit source
                </button>
              </div>
              {!hasPreview && (
                <span className="component-library-missing">Preview unavailable</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
