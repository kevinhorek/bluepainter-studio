import html2canvas from 'html2canvas';

/** Capture the visible canvas page frame as a PNG blob. */
export async function captureCanvasPageFrame() {
  const el = document.getElementById('canvas-page-frame');
  if (!el) return null;

  const canvas = await html2canvas(el, {
    backgroundColor: null,
    scale: 2,
    logging: false,
    useCORS: true
  });

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}
