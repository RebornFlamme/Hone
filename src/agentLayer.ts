import type { VirtualElement } from '@floating-ui/dom';
import type { AnnotationPlugin, Editor, FileView, ItemView, LayerContext, Marker, Rect, Stroke } from 'fragment';
import { hasText } from './coeur';
import { ActionAgent } from './ActionAgent';
import { BarreAgent } from './BarreAgent';
import { BulleAgent } from './BulleAgent';
import type { ContexteQuestion } from './repondre';
import { CarnetTraces, texteEntre, type Trace } from './traces';
import type { Boite } from './eviter';
import { plageDuTrait, type Mesure } from './zoneDuTrait';

// ═══════════════════════════════════════════════════════════════════════════
//  Le montage de l'agent sur UNE vue. On surligne ou on entoure un passage
//  avec le calque d'annotation : une barre verticale apparaît à sa droite. La
//  tête de chat de la barre ouvre la conversation, à droite de la barre. Un
//  outil de la barre la remplace par son rond, puis par la carte de sa réponse.
//
//  Ce fichier est le seul à connaître les quatre pièces : le passage (la zone),
//  la barre, la bulle et les traits d'annotation. La barre ignore la bulle, la
//  bulle ignore la barre, et l'annotation ignore tout de l'agent : c'est
//  l'agent qui écoute ses traits.
// ═══════════════════════════════════════════════════════════════════════════

export function createAgentLayer(ctx: LayerContext): () => void {
    const surface = ctx.editor;
    // Pas de texte adressable (PDF scanné, image) : rien à citer.
    if (!surface || !hasText(surface)) return () => {};
    const editor: Editor = surface;

    const paneEl = (ctx.view as ItemView).contentEl;
    const chemin = (): string => (ctx.view as FileView).file?.path ?? '';

    /** Le passage visé : posé par un trait, remappé à l'édition, effacé à la croix. */
    let zone: ContexteQuestion | null = null;

    // ── Document ↔ client ──────────────────────────────────────────────────
    //
    // Les coordonnées de l'éditeur (`coordsAtPos`, `coordsForRange`, les points
    // des traits) sont DOCUMENT-relatives : leur origine est celle de
    // `scrollEl`, décalée de son défilement (Editor.ts). Floating UI et
    // `posAtCoords` parlent en coordonnées CLIENT. Relu à chaque appel, donc
    // juste après n'importe quel scroll.

    const origine = (): { dx: number; dy: number } => {
        const base = editor.scrollEl.getBoundingClientRect();
        return { dx: base.left - editor.scrollEl.scrollLeft, dy: base.top - editor.scrollEl.scrollTop };
    };

    const rectsClient = (): DOMRect[] => {
        if (!zone) return [];
        const { dx, dy } = origine();
        return editor.coordsForRange(zone.from, zone.to).map(
            (r) => new DOMRect(r.left + dx, r.top + dy, r.right - r.left, r.bottom - r.top),
        );
    };

    /** Le trait qui a posé la zone : c'est à côté de LUI que la barre se tient. */
    let trait: Stroke | null = null;

    /**
     * Le trait vu comme un élément par Floating UI : la référence de la barre.
     *
     * ★ POURQUOI le trait et pas le texte couvert : un cercle qui mord sur cinq
     *   lignes couvre un texte qui va d'une marge à l'autre. Ancrée à ce
     *   rectangle, et l'évitant, la barre n'avait de place ni à droite (barre
     *   d'annotation) ni à gauche (bord du pane) et tombait sous le paragraphe,
     *   loin du cercle.
     */
    const reference: VirtualElement = {
        // Floating UI surveille le scroll des ancêtres de cet élément.
        contextElement: editor.contentEl,
        getBoundingClientRect: () => {
            // Passage hors du viewport rendu : un rect loin de tout, que `hide()`
            // déclare masqué. La barre attend le texte sans se fermer.
            const loin = new DOMRect(-1e5, -1e5, 0, 0);
            if (!trait || rectsClient().length === 0) return loin;
            const glyphe = editor.coordsAtPos(trait.pos);
            if (!glyphe) return loin;
            const { dx, dy } = origine();
            // L'encre déborde des points de la moitié de l'épaisseur du trait.
            const m = trait.width / 2;
            const xs = trait.points.map((p) => glyphe.left + p.dx + dx);
            const ys = trait.points.map((p) => glyphe.top + p.dy + dy);
            const left = Math.min(...xs) - m;
            const top = Math.min(...ys) - m;
            return new DOMRect(left, top, Math.max(...xs) + m - left, Math.max(...ys) + m - top);
        },
    };

    /** Ce que `zoneDuTrait` demande à l'éditeur, traduit en coordonnées document. */
    const mesure: Mesure = {
        posAt: (x, y) => {
            const { dx, dy } = origine();
            return editor.posAtCoords(x + dx, y + dy);
        },
        coordsAt: (off) => {
            const rects = editor.coordsForRange(off, off + 1);
            return rects.length === 1 ? rects[0] : null;
        },
        charAt: (off) => texteEntre(editor, off, off + 1),
    };

    // ── Ce que la barre et la bulle ne doivent jamais recouvrir ────────────
    //
    // La barre d'annotation (`.toolbar` du cœur) vit dans le même pane et se
    // range par défaut dans la marge droite : exactement là où la barre de
    // l'agent apparaît. On peut aussi la traîner n'importe où.

    const boite = (el: Element): Boite => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
    };
    const barresAnnotation = (): Boite[] => [...paneEl.querySelectorAll('.toolbar')].map(boite);
    const passage = (): Boite[] => {
        if (!zone) return [];
        const r = reference.getBoundingClientRect();
        return [{ x: r.x, y: r.y, width: r.width, height: r.height }];
    };
    // Le retrait de 8 px au bord est celui de la barre d'annotation (MARGE_BORD).
    const limites = (): Boite => {
        const r = paneEl.getBoundingClientRect();
        return { x: r.x + 8, y: r.y + 8, width: r.width - 16, height: r.height - 16 };
    };

    // ── Les trois pièces ───────────────────────────────────────────────────

    const barre = new BarreAgent(ctx.app, paneEl, reference, {
        onChat: () => {
            if (zone) bulle.ouvrir(zone);
            majOccupe();
        },
        // La croix de la barre ferme tout : le chat, accroché à la barre,
        // n'aurait plus rien à côté de quoi se tenir.
        onFermer: () => {
            zone = null;
            bulle.fermer();
            editor.requestUpdate();
        },
        // Un outil : le chat se ferme, la barre fond dans le rond de l'outil.
        onOutil: (outil) => {
            if (!zone) return;
            const depuis = barre.dom.getBoundingClientRect();
            bulle.fermer();
            barre.cacher();
            action.lancer(outil, zone, depuis);
            majOccupe();
        },
    }, {
        obstacles: () => [...barresAnnotation(), ...passage()],
        limites,
    });

    // Une conversation fermée laisse sa trace dans la marge.
    const bulle = new BulleAgent(ctx.app, paneEl, barre.dom, barre.chatEl, (messages, contexte, cadre) => {
        if (!suppression && contexte && trait && messages.length > 0) carnet.fermer(contexte, trait, { type: 'chat', messages }, cadre);
        else carnet.oublierOuverte();
        // Rouverte seule depuis la marge, sans barre : sa croix ferme tout.
        if (!barre.estOuverte()) {
            zone = null;
            editor.requestUpdate();
        }
        majOccupe();
    }, {
        obstacles: () => [...barresAnnotation(), ...(barre.estOuverte() ? [boite(barre.dom)] : []), ...passage()],
        limites,
    }, () => supprimer(), reference);

    // La croix de la carte ferme tout, comme celle de la barre. Une réponse
    // reçue laisse sa trace dans la marge.
    const action = new ActionAgent(ctx.app, paneEl, reference, () => {
        const resultat = action.resultat();
        if (!suppression && resultat && zone && trait) carnet.fermer(zone, trait, { type: 'outil', ...resultat }, action.cadre());
        else carnet.oublierOuverte();
        zone = null;
        majOccupe();
        editor.requestUpdate();
    }, {
        obstacles: () => [...barresAnnotation(), ...passage()],
        limites,
    }, () => supprimer());

    // ── L'historique, dans la marge (traces.ts) ────────────────────────────
    //
    // Un clic sur une icône referme ce qui est ouvert (qui laisse sa propre
    // trace), puis rouvre la réponse gardée sur son passage : la carte de
    // l'outil sort de l'icône, ou le chat en sort SEUL, avec la conversation,
    // sans la barre et ses outils.

    const rouvrir = (t: Trace, depuis: HTMLElement): void => {
        action.fermer();
        barre.fermer();
        // Un chat rouvert seul n'a pas de barre pour le fermer avec elle.
        bulle.fermer();
        zone = { ...t.zone };
        trait = carnet.traitDe(t);
        if (t.contenu.type === 'outil') {
            action.montrer(t.contenu.outil, t.contenu.texte, depuis, t.cadre);
        } else {
            // Seulement la discussion : pas la barre, pas ses outils.
            bulle.rouvrir(zone, t.contenu.messages, reference, depuis, t.cadre);
        }
        majOccupe();
        editor.requestUpdate();
    };
    // La poubelle d'une réponse rouverte (supprimer.ts), confirmée : l'icône,
    // la réponse gardée et le trait d'encre disparaissent. `suppression` empêche
    // les fermetures qui suivent de ranger une trace neuve. Le trait effacé
    // passe par la pile d'annulation de l'annotation : Cmd+Z le remet, sans
    // la réponse.
    let suppression = false;
    const supprimer = (): void => {
        const t = carnet.supprimerOuverte();
        if (!t) return;
        suppression = true;
        try {
            bulle.fermer();
            action.fermer();
            barre.fermer();
        } finally {
            suppression = false;
        }
        zone = null;
        annotation?.source.erase(t.zone.chemin, t.trait.id);
        majOccupe();
        editor.requestUpdate();
    };

    const carnet = new CarnetTraces(ctx.app, editor, ctx.overlays, chemin, rouvrir,
        () => [...paneEl.querySelectorAll('.toolbar')].map((el) => el.getBoundingClientRect()));
    // Les icônes défilent avec le texte, la barre d'annotation non : au scroll,
    // ce qu'elles recouvrent change.
    const surScroll = (): void => carnet.placer();
    editor.scrollEl.addEventListener('scroll', surScroll, { passive: true });

    // ── Chat ou carte ouverts : l'annotation se tait ───────────────────────
    //
    // Tant qu'on discute d'un passage ou qu'un outil y répond, un clic à côté
    // ne pose ni point ni trait : on est dans la conversation, pas dans la
    // page. On arrête le pointerdown en capture, avant la surface de dessin,
    // plutôt que de désarmer l'outil : l'annotation n'a pas à connaître
    // l'agent, et l'outil choisi est intact à la fermeture. La barre
    // d'annotation reste utilisable, seule la surface est visée.

    const occupe = (): boolean => bulle.estOuverte() || action.estOuverte();
    const majOccupe = (): void => { paneEl.classList.toggle('agent-occupe', occupe()); };
    const bloquer = (e: PointerEvent): void => {
        if (!occupe() || !(e.target instanceof Element) || !e.target.closest('.annotation-surface')) return;
        e.preventDefault();
        e.stopPropagation();
    };
    paneEl.addEventListener('pointerdown', bloquer, true);

    // ── Le déclencheur : un trait d'annotation ─────────────────────────────

    const surTrait = (path: string, stroke: Stroke): void => {
        if (path !== chemin()) return;
        // Chat ou carte ouverts : `bloquer` empêche déjà le trait d'exister. La
        // garde reste pour un trait qui viendrait d'ailleurs que du pointeur.
        if (occupe()) return;

        const glyphe = editor.coordsAtPos(stroke.pos);
        if (!glyphe) return;
        const points = stroke.points.map((p) => ({ x: glyphe.left + p.dx, y: glyphe.top + p.dy }));
        const plage = plageDuTrait(points, stroke.tool, mesure);
        if (!plage) return; // gribouillis, marge vide : une annotation, pas une question

        zone = { texte: texteEntre(editor, plage.from, plage.to), chemin: path, ...plage };
        trait = stroke;
        barre.montrer();
        // Le surlignage n'a aucune raison de se redessiner seul : le document
        // n'a pas changé.
        editor.requestUpdate();
    };

    // L'annotation ne dit pas « un trait NEUF », seulement « ce document a
    // changé » : on retient les ids déjà vus. Un id jamais vu est un trait posé
    // à la main ; un redo ou un Cmd+Z remettent un id connu, et se taisent.
    const annotation = ctx.app.plugins.plugins.get('annotation') as AnnotationPlugin | undefined;
    const vus = new Set<string>();
    const connaitre = (): void => {
        for (const s of annotation?.source.strokes(chemin()) ?? []) vus.add(s.id);
    };
    connaitre();
    const refTrait = annotation?.source.on('change', (path) => {
        if (path !== chemin()) return;
        const neuf = annotation.source.strokes(path).filter((s) => !vus.has(s.id)).at(-1);
        connaitre();
        if (neuf) surTrait(path, neuf);
    });

    // ── Suivre le passage ──────────────────────────────────────────────────

    const replacer = (): void => {
        barre.placer();
        void bulle.placer();
        void action.placer();
        carnet.placer();
    };

    const offChange = editor.onChange((c) => {
        if (c.docChanged) carnet.remapper(c.mapPos);
        if (c.docChanged && zone) {
            // Le passage suit le texte qu'on édite autour de lui : le début colle
            // au caractère qui suit, la fin à celui qui précède.
            const from = c.mapPos(zone.from, 1).pos;
            const to = c.mapPos(zone.to, -1).pos;
            zone = { ...zone, from, to, texte: texteEntre(editor, from, to) };
            bulle.deplacerZone(from, to, zone.texte);
        }
        if (c.docChanged || c.viewportChanged) replacer();
    });

    // Le surlignage du passage visé, derrière le texte : on voit exactement ce
    // que l'agent a compris du trait.
    const offSurlignage = editor.addLayer({
        above: false,
        markers: (e) => {
            if (!zone || !hasText(e)) return [];
            return e.coordsForRange(zone.from, zone.to).map((r) => new MarqueZone(r));
        },
    });

    // Le pane change de taille sans scroll ni resize de fenêtre (split) :
    // autoUpdate ne le voit pas.
    const offGeometrie = ctx.overlays.onGeometryChange(replacer);

    // La barre d'annotation bouge (traînée, basculée, montrée, cachée) : autoUpdate
    // ne surveille que la référence et l'élément flottant, pas les obstacles.
    // On ne réagit qu'aux mutations DE la barre d'annotation : nos propres
    // écritures de left/top relanceraient sinon le placement en boucle.
    const observateur = new MutationObserver((mutations) => {
        const touche = (n: Node): boolean =>
            n instanceof Element && (n.matches('.toolbar') || n.closest('.toolbar') !== null || n.querySelector('.toolbar') !== null);
        const concerne = mutations.some((m) =>
            m.type === 'childList'
                ? [...m.addedNodes, ...m.removedNodes].some(touche)
                : touche(m.target));
        if (concerne) replacer();
    });
    observateur.observe(paneEl, { subtree: true, childList: true, attributes: true, attributeFilter: ['style', 'class'] });

    // La vue passe à un autre document : le passage n'y existe pas.
    const refFichier = ctx.app.workspace.on('file-open', () => {
        connaitre();
        if (zone && zone.chemin !== chemin()) {
            barre.fermer();
            bulle.fermer();
            action.fermer();
        }
        // Les icônes de la marge sont celles du document affiché.
        carnet.placer();
    });

    return () => {
        paneEl.removeEventListener('pointerdown', bloquer, true);
        paneEl.classList.remove('agent-occupe');
        observateur.disconnect();
        refFichier.off();
        offGeometrie();
        offSurlignage();
        offChange();
        refTrait?.off();
        barre.fermer();
        bulle.fermer();
        action.fermer();
        // Après les fermetures : elles rangent encore leur trace.
        editor.scrollEl.removeEventListener('scroll', surScroll);
        carnet.detruire();
    };
}

/** Un rectangle du passage visé, en coordonnées document. */
class MarqueZone implements Marker {
    private readonly r: Rect;

    constructor(r: Rect) {
        this.r = r;
    }

    eq(other: Marker): boolean {
        return other instanceof MarqueZone
            && Math.round(other.r.left) === Math.round(this.r.left)
            && Math.round(other.r.top) === Math.round(this.r.top)
            && Math.round(other.r.right) === Math.round(this.r.right)
            && Math.round(other.r.bottom) === Math.round(this.r.bottom);
    }

    draw(): HTMLElement {
        const el = document.createElement('div');
        el.classList.add('agent-zone');
        el.style.left = `${this.r.left}px`;
        el.style.top = `${this.r.top}px`;
        el.style.width = `${this.r.right - this.r.left}px`;
        el.style.height = `${this.r.bottom - this.r.top}px`;
        return el;
    }
}
