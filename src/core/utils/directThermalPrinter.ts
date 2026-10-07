/**
 * Direct Thermal Label Printing Utility
 * Sends pure 100mm x 100mm label HTML directly to an isolated print frame
 * Eliminates parent window overhead, CSS collisions, and ensures immediate spooler response.
 */

export const printThermalElementDirect = (
  elementId: string,
  title: string = 'Label-Thermal-100x100'
): Promise<void> => {
  return new Promise((resolve) => {
    const sourceEl = document.getElementById(elementId);
    if (!sourceEl) {
      console.warn(`[ThermalPrint] Element #${elementId} not found`);
      window.focus();
      window.print();
      resolve();
      return;
    }

    // Clone all stylesheets from parent document
    const styleNodes = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
    const stylesHtml = styleNodes.map((node) => node.outerHTML).join('\n');

    // Create an isolated hidden iframe
    const iframe = document.createElement('iframe');
    iframe.id = 'direct-thermal-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '100mm';
    iframe.style.height = '100mm';
    iframe.style.border = 'none';
    iframe.style.zIndex = '-9999';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      window.focus();
      window.print();
      resolve();
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          ${stylesHtml}
          <style>
            @page {
              size: 100mm 100mm !important;
              margin: 0mm !important;
            }
            *, *::before, *::after {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box !important;
              box-shadow: none !important;
              text-shadow: none !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              color: black !important;
              width: 100mm !important;
              min-width: 100mm !important;
              max-width: 100mm !important;
              overflow: visible !important;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            }
            .print-page-wrapper {
              display: block !important;
              width: 100mm !important;
              height: 100mm !important;
              min-width: 100mm !important;
              min-height: 100mm !important;
              max-width: 100mm !important;
              max-height: 100mm !important;
              margin: 0 auto !important;
              padding: 0 !important;
              page-break-before: auto !important;
              break-before: auto !important;
              page-break-after: always !important;
              break-after: page !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              box-sizing: border-box !important;
              overflow: hidden !important;
            }
            .print-page-wrapper:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }
            .thermal-label-page {
              width: 100mm !important;
              height: 100mm !important;
              min-width: 100mm !important;
              min-height: 100mm !important;
              max-width: 100mm !important;
              max-height: 100mm !important;
              margin: 0 !important;
              padding: 3mm !important;
              box-sizing: border-box !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              overflow: hidden !important;
              border: 2px solid black !important;
              border-radius: 0 !important;
              background: transparent !important;
            }
            .no-print {
              display: none !important;
            }
          </style>
        </head>
        <body>
          ${sourceEl.innerHTML}
        </body>
      </html>
    `);
    doc.close();

    // Give browser small frame to render images (like QR codes & Logos) then trigger print
    setTimeout(() => {
      try {
        const frameWin = iframe.contentWindow;
        if (frameWin) {
          let cleaned = false;
          const cleanup = () => {
            if (cleaned) return;
            cleaned = true;
            try {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
            } catch (e) {
              console.error('Error cleaning up print frame:', e);
            }
            resolve();
          };

          frameWin.addEventListener('afterprint', cleanup);
          frameWin.focus();
          frameWin.print();
          // Fallback cleanup after 45 seconds if afterprint doesn't fire
          setTimeout(cleanup, 45000);
        } else {
          window.focus();
          window.print();
          resolve();
        }
      } catch (err) {
        console.error('Direct print failed, falling back to window.print():', err);
        window.focus();
        window.print();
        resolve();
      }
    }, 250);
  });
};
