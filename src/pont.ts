import * as fragment from 'fragment';
import type { App, DocumentSurface, Editor, WidgetLayer } from 'fragment';

// ═══════════════════════════════════════════════════════════════════════════
//  PONT PROVISOIRE, à supprimer quand le cœur exportera `WidgetLayer` et
//  `hasText` (core/api.ts). Ce jour-là : effacer ce fichier, et importer les
//  deux depuis 'fragment' dans repere.ts et agentLayer.ts.
//
//  En attendant, l'agent les prend de l'export s'il existe, sinon :
//  - `WidgetLayer` : le calque « Widgets de document » du cœur (doc-widget) en
//    crée un par vue ; son constructeur EST la classe du cœur, la seule copie
//    en mémoire. Rien n'est recopié, rien n'est modifié.
//  - `hasText` : la ligne de core/editor/Editor.ts.
// ═══════════════════════════════════════════════════════════════════════════

type ClasseWidgetLayer = new (...args: ConstructorParameters<typeof WidgetLayer>) => WidgetLayer;

const api = fragment as unknown as { WidgetLayer?: ClasseWidgetLayer; hasText?: (s: DocumentSurface) => boolean };

let trouvee: ClasseWidgetLayer | null = api.WidgetLayer ?? null;

/** La classe WidgetLayer du cœur, ou null si on ne la trouve nulle part. */
export function classeWidgetLayer(app: App): ClasseWidgetLayer | null {
    if (trouvee) return trouvee;
    const interne = app as unknown as { plugins?: { plugins?: Map<string, unknown> } };
    const docWidget = interne.plugins?.plugins?.get('doc-widget') as { views?: Map<unknown, { widgets?: object }> } | undefined;
    for (const entree of docWidget?.views?.values() ?? []) {
        if (entree.widgets) {
            trouvee = entree.widgets.constructor as ClasseWidgetLayer;
            break;
        }
    }
    return trouvee;
}

export function hasText(surface: DocumentSurface): surface is Editor {
    if (api.hasText) return api.hasText(surface);
    return typeof (surface as Partial<Editor>).getLine === 'function';
}
