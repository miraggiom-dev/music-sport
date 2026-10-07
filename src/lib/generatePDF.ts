import { toast } from "sonner";

/**
 * Opens a printable document and falls back to a hidden iframe when popups are blocked.
 */
export function printDocument(html: string, title = "Recibo de pago") {
  const win = window.open("", "_blank");
  if (win) {
    try {
      win.document.open();
      win.document.write(html);
      win.document.close();
      win.document.title = title;
      win.focus();
      setTimeout(() => {
        try {
          win.print();
        } catch {
          toast.error("No se pudo abrir el diálogo de impresión");
        }
      }, 800);
    } catch {
      win.close();
      toast.error("No se pudo preparar el recibo para imprimir");
    }
    return;
  }

  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(frame);
  const doc = frame.contentWindow?.document;
  if (!doc) {
    frame.remove();
    toast.error("No se pudo preparar el documento para imprimir");
    return;
  }
  try {
    doc.open();
    doc.write(html);
    doc.close();
  } catch {
    frame.remove();
    toast.error("No se pudo preparar el recibo para imprimir");
    return;
  }
  setTimeout(() => {
    try {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } catch {
      toast.error("No se pudo abrir el diálogo de impresión");
    }
    setTimeout(() => frame.remove(), 2000);
  }, 800);
}
