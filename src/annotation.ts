import type { App } from 'fragment';

// ═══════════════════════════════════════════════════════════════════════════
//  Ce que l'agent demande au calque d'annotation, en UN seul endroit.
//
//  L'annotation n'a pas encore d'API publique : un plugin ne peut ni savoir
//  qu'un trait vient d'être posé, ni où est sa barre, ni suspendre la saisie.
//  Ce fichier donne à l'agent l'interface dont il a besoin (`Annotation`), et
//  la remplit aujourd'hui avec ce qui existe. C'est la liste des demandes
//  faites à l'équipe du cœur :
//
//    1. un événement « trait posé » qui porte le trait (aujourd'hui seul
//       `change` existe : on retient les id déjà vus) ;
//    2. la boîte de la barre d'annotation (aujourd'hui : un sélecteur) ;
//    3. une suspension de la saisie de dessin (aujourd'hui : le pointerdown
//       arrêté en capture, et une classe pour le curseur).
//
//  Quand l'API existera, seul ce fichier changera.
// ═══════════════════════════════════════════════════════════════════════════

/** Un trait d'annotation (views/annotation/AnnotationSource.ts). */
export interface Stroke {
    id: string;
    /** L'offset du glyphe d'ancrage ; les points en sont des écarts. */
    pos: number;
    points: readonly { dx: number; dy: number }[];
    color: string;
    width: number;
    tool: 'crayon' | 'surligneur';
}

export interface Annotation {
    /** Un trait NEUF, posé à la main : ni un undo, ni un redo. */
    surTraitPose(cb: (path: string, stroke: Stroke) => void): void;
    /** Efface un trait (passe par la pile d'annulation : Cmd+Z le remet). */
    effacer(path: string, id: string): void;
    /** La boîte client de la barre d'annotation de ce pane, s'il y en a une. */
    barre(): DOMRect | null;
    /** Tant que c'est vrai, un clic sur la page ne dessine rien ; l'outil armé est gardé. */
    suspendre(oui: boolean): void;
    /** Le document affiché a changé : ses traits existants ne sont pas neufs. */
    connaitre(): void;
    detruire(): void;
}

interface SourceAnnotation {
    strokes(path: string): readonly Stroke[];
    erase(path: string, id: string): void;
    on(name: 'change', cb: (path: string) => void): { off(): void };
}

export function brancherAnnotation(app: App, paneEl: HTMLElement, chemin: () => string): Annotation {
    // Demande 1 : le plugin d'annotation n'est joignable que par le registre
    // interne des plugins.
    const interne = app as unknown as { plugins?: { plugins?: Map<string, unknown> } };
    const source = (interne.plugins?.plugins?.get('annotation') as { source?: SourceAnnotation } | undefined)?.source;

    const vus = new Set<string>();
    const connaitre = (): void => {
        for (const s of source?.strokes(chemin()) ?? []) vus.add(s.id);
    };
    connaitre();

    const abonnes: ((path: string, stroke: Stroke) => void)[] = [];
    const ref = source?.on('change', (path) => {
        if (path !== chemin()) return;
        const neuf = source.strokes(path).filter((s) => !vus.has(s.id)).at(-1);
        connaitre();
        if (neuf) for (const cb of abonnes) cb(path, neuf);
    });

    // Demande 3 : arrêter le pointerdown avant la surface de dessin, plutôt
    // que de désarmer l'outil. La classe sert au curseur (styles.css).
    let suspendu = false;
    const bloquer = (e: PointerEvent): void => {
        if (!suspendu || !(e.target instanceof Element) || !e.target.closest('.annotation-surface')) return;
        e.preventDefault();
        e.stopPropagation();
    };
    paneEl.addEventListener('pointerdown', bloquer, true);

    return {
        surTraitPose: (cb) => { abonnes.push(cb); },
        effacer: (path, id) => source?.erase(path, id),
        // Demande 2 : la barre d'annotation est la Toolbar du pane qui n'est pas
        // celle de l'agent.
        barre: () => paneEl.querySelector('.toolbar:not(.agent-barre)')?.getBoundingClientRect() ?? null,
        suspendre: (oui) => {
            suspendu = oui;
            paneEl.classList.toggle('agent-occupe', oui);
        },
        connaitre,
        detruire: () => {
            ref?.off();
            paneEl.removeEventListener('pointerdown', bloquer, true);
            paneEl.classList.remove('agent-occupe');
        },
    };
}
