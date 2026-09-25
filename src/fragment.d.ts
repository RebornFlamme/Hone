// ═══════════════════════════════════════════════════════════════════════════
//  Ce que le plugin connaît de Fragment, en types seulement.
//
//  À l'exécution, `require('fragment')` sert `fragmentApi` (core/api.ts) : seuls
//  `Plugin`, `Component` et `setIcon` sont des valeurs lues ici. Le reste décrit
//  des objets que le cœur nous passe (le contexte d'un calque, l'éditeur, le
//  plugin d'annotation). Recopié du cœur et réduit à ce que l'agent appelle :
//  si le cœur change une de ces signatures, c'est ici qu'il faut la suivre.
// ═══════════════════════════════════════════════════════════════════════════

declare module 'fragment' {
    export interface EventRef { off(): void }

    export class Component {
        _loaded: boolean;
        load(): void;
        unload(): void;
        onload(): void;
        onunload(): void;
        register(cb: () => unknown): void;
    }

    export interface PluginManifest { id: string; name: string; version: string }

    export class Plugin extends Component {
        app: App;
        manifest: PluginManifest;
        constructor(app: App, manifest: PluginManifest);
        registerLayer(spec: LayerSpec): void;
    }

    export function setIcon(app: App, el: HTMLElement, name: string): void;

    // ── L'app, vue par l'agent ──────────────────────────────────────────────

    export interface App {
        plugins: { plugins: Map<string, unknown> };
        workspace: { on(name: 'file-open', cb: () => void): EventRef };
    }

    export interface View { leaf: { parent: unknown } }
    export interface ItemView extends View { contentEl: HTMLElement }
    export interface FileView extends ItemView { file: { path: string } | null }

    // ── L'éditeur (core/editor/Editor.ts) ───────────────────────────────────

    export interface Rect { left: number; top: number; right: number; bottom: number }
    export interface EditorRange { from: number; to: number }
    export interface EditorPosition { line: number; ch: number }
    export interface MappedPos { pos: number; deleted: boolean }

    export interface Marker {
        eq(other: Marker): boolean;
        draw(): HTMLElement;
        update?(dom: HTMLElement, old: Marker): boolean;
    }

    export interface EditorChange {
        docChanged: boolean;
        selectionChanged: boolean;
        viewportChanged: boolean;
        mapPos(pos: number, assoc?: -1 | 1): MappedPos;
    }

    export interface DocumentSurface {
        coordsAtPos(offset: number): Rect | null;
        posAtCoords(x: number, y: number): number | null;
        viewportRange(): EditorRange;
        renderedRanges(): readonly EditorRange[];
        addLayer(spec: { above: boolean; markers(surface: DocumentSurface): readonly Marker[] }): () => void;
        requestUpdate(): void;
        onChange(cb: (change: EditorChange) => void): () => void;
        readonly contentEl: HTMLElement;
        readonly scrollEl: HTMLElement;
    }

    export interface Editor extends DocumentSurface {
        getLine(n: number): string;
        offsetToPos(offset: number): EditorPosition;
        coordsForRange(from: number, to: number): Rect[];
    }

    // ── Les calques (core/layers/types.ts) ──────────────────────────────────

    export interface OverlayHost {
        mount(el: HTMLElement, plane: 'viewport' | 'document'): () => void;
        clientToViewport(x: number, y: number): { x: number; y: number } | null;
        clientToDocument(x: number, y: number): { x: number; y: number } | null;
        gutterBand(side: 'left' | 'right'): { left: number; width: number } | null;
        onGeometryChange(cb: () => void): () => void;
    }

    export interface LayerContext {
        editor: DocumentSurface | null;
        view: View;
        app: App;
        overlays: OverlayHost;
    }

    export interface LayerSpec {
        id: string;
        name: string;
        icon?: string;
        defaultEnabled?: boolean;
        appliesTo?(view: View): boolean;
        create(ctx: LayerContext): () => void;
    }

    // ── Le plugin d'annotation (views/annotation) ───────────────────────────

    export interface Stroke {
        id: string;
        pos: number;
        points: readonly { dx: number; dy: number }[];
        color: string;
        width: number;
        tool: 'crayon' | 'surligneur';
    }

    export interface AnnotationPlugin {
        source: {
            strokes(path: string): readonly Stroke[];
            erase(path: string, id: string): void;
            on(name: 'change', cb: (path: string) => void): EventRef;
        };
    }
}
