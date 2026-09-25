import type { DocumentSurface, Editor } from 'fragment';

// ═══════════════════════════════════════════════════════════════════════════
//  Deux fonctions du cœur que `fragmentApi` ne sert pas, recopiées telles
//  quelles (core/editor/Editor.ts et core/layers/visibility.ts).
// ═══════════════════════════════════════════════════════════════════════════

/** La surface a-t-elle un espace d'offsets de caractères (un éditeur de texte) ? */
export function hasText(surface: DocumentSurface): surface is Editor {
    return typeof (surface as Partial<Editor>).getLine === 'function';
}

/** Une position est-elle rendue, repliée, ou hors du viewport ? */
export function posVisibility(editor: DocumentSurface, pos: number): 'rendered' | 'hidden' | 'offscreen' {
    const viewport = editor.viewportRange();
    if (pos < viewport.from || pos > viewport.to) return 'offscreen';
    for (const r of editor.renderedRanges()) {
        if (pos >= r.from && pos <= r.to) return 'rendered';
    }
    return 'hidden';
}
