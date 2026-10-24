import { useEffect } from 'react';

/** Título de la pestaña de cada pantalla, p. ej. «Historial · CEDI Control». */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} · CEDI Control`;
  }, [title]);
}
