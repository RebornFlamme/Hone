// ═══════════════════════════════════════════════════════════════════════════
//  Ce que le plugin importe de Fragment (`require('fragment')`, core/api.ts).
//
//  Les signatures sont recopiées du cœur, réduites à ce que l'agent appelle.
//  Deux familles :
//
//  - DÉJÀ EXPORTÉ par fragmentApi : Component, Plugin, setIcon, Toolbar,
//    ToolbarItem.
//  - À EXPORTER par le cœur (demande faite à l'équipe) : WidgetLayer
//    (core/layers/WidgetLayer.ts) et hasText (core/editor/Editor.ts). En
//    attendant, src/pont.ts les trouve sans les recopier ; il disparaîtra avec
//    l'export.
//
//  L'accès au plugin d'annotation n'est pas ici : il n'a pas encore d'API
//  publique, tout ce qu'on en lit passe par src/annotation.ts.
// ═══════════════════════════════════════════════════════════════════════════

declare module 'fragment' {
    export interface EventRef { off(): void }

    export class Component {
        _loaded: boolean;
        load(): void;
        unload(): void;
        onload(): void;
        onunload(): void;
        addChild<T extends Component>(component: T): T;
        removeChild<T extends Component>(component: T): T;
        register(cb: () => unknown): void;
        registerDomEvent<K extends keyof WindowEventMap>(
            el: Window, type: K, cb: (evt: WindowEventMap[K]) => unknown, options?: boolean | AddEventListenerOptions): void;
        registerDomEvent<K extends keyof DocumentEventMap>(
            el: Document, type: K, cb: (evt: DocumentEventMap[K]) => unknown, options?: boolean | AddEventListenerOptions): void;
        registerDomEvent<K extends keyof HTMLElementEventMap>(
            el: HTMLElement, type: K, cb: (evt: HTMLElementEventMap[K]) => unknown, options?: boolean | AddEventListenerOptions): void;
    }

    export interface PluginManifest { id: string; name: string; version: string }

    export class Plugin extends Component {
        app: App;
        manifest: PluginManifest;
        constructor(app: App, manifest: PluginManifest);
        registerLayer(spec: LayerSpec): void;
    }

    export function setIcon(app: App, el: HTMLElement, name: string): void;

    // ── La barre d'outils (core/Toolbar.ts) ─────────────────────────────────

    export type ToolbarOrientation = 'horizontal' | 'vertical';

    export class Toolbar extends Component {
        dom: HTMLElement;
        handleEl: HTMLElement;
        constructor(parentEl?: HTMLElement);
        addItem(cb: (item: ToolbarItem) => unknown): this;
        addSeparator(): this;
        setColumns(columns: number): this;
        setOrientation(orientation: ToolbarOrientation): this;
        onHide(callback: () => unknown): this;
        showAtPosition(x: number, y: number): this;
        moveTo(x: number, y: number): this;
        hide(): this;
    }

    export class ToolbarItem {
        dom: HTMLElement;
        setIcon(icon: string): this;
        setLabel(label: string): this;
        setTooltip(tooltip: string): this;
        setDisabled(disabled: boolean): this;
        onClick(callback: (evt: MouseEvent) => unknown): this;
    }

    // ── L'app, vue par l'agent ──────────────────────────────────────────────

    export interface App {
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
        getSelection(): EditorRange;
    }

    /** À exporter : core/editor/Editor.ts. */
    export function hasText(surface: DocumentSurface): surface is Editor;

    // ── Les calques (core/layers/) ──────────────────────────────────────────

    export type GutterSide = 'left' | 'right';

    export interface OverlayHost {
        mount(el: HTMLElement, plane: 'viewport' | 'document'): () => void;
        clientToViewport(x: number, y: number): { x: number; y: number } | null;
        clientToDocument(x: number, y: number): { x: number; y: number } | null;
        gutterBand(side: GutterSide): { left: number; width: number } | null;
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

    export type WidgetAnchor =
        | { mode: 'viewport'; x: number; y: number }
        | { mode: 'document'; pos: number; dx: number; dy: number }
        | { mode: 'gutter'; side: GutterSide; pos: number; dy: number };

    export interface WidgetHandle {
        getAnchor(): WidgetAnchor;
        setAnchor(anchor: WidgetAnchor): void;
        remove(): void;
    }

    /** À exporter : core/layers/WidgetLayer.ts. */
    export class WidgetLayer {
        constructor(editor: DocumentSurface | null, overlays: OverlayHost);
        addWidget(el: HTMLElement, anchor: WidgetAnchor): WidgetHandle;
        documentAnchorAt(clientX: number, clientY: number): WidgetAnchor | null;
        viewportAnchorAt(clientX: number, clientY: number): WidgetAnchor | null;
        gutterAnchorAt(clientY: number, side: GutterSide): WidgetAnchor | null;
        gutterFits(side: GutterSide): boolean;
        canAnchorToDocument(): boolean;
        destroy(): void;
    }

}
