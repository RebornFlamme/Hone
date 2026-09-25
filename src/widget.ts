// ═══════════════════════════════════════════════════════════════════════════
//  Le chat et les cartes d'outil en widget : on les attrape par leur en-tête
//  pour les déplacer, et par n'importe quel bord ou coin pour les agrandir
//  (le curseur devient une double flèche).
//
//  Tant qu'on n'y a pas touché, Floating UI les place comme avant. Dès qu'on
//  les déplace ou qu'on les agrandit, ils ont un CADRE : un écart au trait qui
//  a posé le passage, et une taille. Ils restent alors là où on les a posés
//  DANS LE TEXTE : ils défilent avec lui, et suivent le passage si on édite
//  au-dessus, puisque le trait le suit.
//
//  ★ POURQUOI un écart au trait et pas une position dans le pane : le pane ne
//    défile pas, le texte si. Posé dans le pane, le widget resterait collé à
//    l'écran pendant que la note défile dessous.
//
//  Ce fichier ne sait rien du chat ni des cartes : il reçoit un élément, sa
//  poignée (l'en-tête) et la boîte CLIENT de la référence.
// ═══════════════════════════════════════════════════════════════════════════

/** L'écart entre le haut gauche du trait et celui du widget, et sa taille, en px. */
export interface Cadre {
    dx: number;
    dy: number;
    width: number;
    height: number;
}

/** En deçà, le titre, la croix et la saisie du chat ne tiennent plus. */
const LARGEUR_MIN = 220;
const HAUTEUR_MIN = 120;
/** L'écart gardé aux bords du pane, celui de la barre d'annotation (MARGE_BORD). */
const MARGE = 8;

type Bord = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
const BORDS: Bord[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

export class Widget {

    /** null : placé par Floating UI, jamais touché. */
    cadre: Cadre | null = null;

    private readonly el: HTMLElement;
    private readonly reference: () => { left: number; top: number };

    constructor(el: HTMLElement, poignee: HTMLElement, reference: () => { left: number; top: number }) {
        this.el = el;
        this.reference = reference;
        this.el.classList.add('agent-widget');
        poignee.classList.add('agent-widget-poignee');

        this.glisser(poignee, (e) => {
            // Les boutons de l'en-tête (la croix) restent des boutons.
            if (e.target instanceof Element && e.target.closest('button, input, textarea')) return null;
            return (dx, dy, depart) => this.borner({ ...depart, dx: depart.dx + dx, dy: depart.dy + dy }, true);
        });

        for (const bord of BORDS) {
            const b = this.el.appendChild(document.createElement('div'));
            b.classList.add('agent-widget-bord', `mod-${bord}`);
            b.setAttribute('aria-hidden', 'true');
            this.glisser(b, () => (dx, dy, depart) => this.borner(redimensionner(bord, dx, dy, depart), false));
        }
    }

    /** Oublie le cadre : la prochaine ouverture repart de la place automatique. */
    oublier(): void {
        this.cadre = null;
        this.el.classList.remove('is-cadre');
        this.el.style.width = '';
        this.el.style.height = '';
        this.el.style.maxWidth = '';
    }

    /** Reprend un cadre gardé (une réponse rouverte depuis la marge). */
    reprendre(cadre: Cadre | null): void {
        if (!cadre) { this.oublier(); return; }
        this.cadre = { ...cadre };
        this.appliquerTaille();
    }

    /**
     * Pose le widget sur son cadre. À appeler à la place de Floating UI dès
     * qu'il y a un cadre, à chaque scroll ou édition (autoUpdate du composant).
     */
    poser(): void {
        if (!this.cadre) return;
        const ref = this.reference();
        // La référence est « loin » quand le passage est hors du rendu : le
        // widget attend son texte, comme avant.
        const loin = ref.left < -1e4;
        this.el.style.visibility = loin ? 'hidden' : 'visible';
        if (loin) return;
        this.plafonner();
        const { ox, oy } = this.origine();
        this.el.style.left = `${ref.left + this.cadre.dx - ox}px`;
        this.el.style.top = `${ref.top + this.cadre.dy - oy}px`;
    }

    /**
     * Garde le widget dans son pane, à MARGE de ses bords : au-delà, le pane le
     * rogne (il passait sous la barre latérale). Déplacé, il est repoussé
     * dedans ; agrandi, il s'arrête au bord. Seul le geste est borné : le
     * défilement peut l'emporter hors de l'écran avec son texte.
     */
    private borner(c: Cadre, deplacement: boolean): Cadre {
        const pane = this.el.parentElement?.getBoundingClientRect();
        if (!pane) return c;
        const ref = this.reference();
        const gauche = pane.left + MARGE;
        const droite = pane.right - MARGE;
        const haut = pane.top + MARGE;
        const bas = pane.bottom - MARGE;
        let x = ref.left + c.dx;
        let y = ref.top + c.dy;
        let { width, height } = c;
        if (deplacement) {
            x = Math.max(gauche, Math.min(x, droite - width));
            y = Math.max(haut, Math.min(y, bas - height));
        } else {
            const x2 = Math.min(x + width, droite);
            const y2 = Math.min(y + height, bas);
            x = Math.max(x, gauche);
            y = Math.max(y, haut);
            // Le minimum ne grandit jamais un widget déjà plus petit que lui.
            width = Math.max(Math.min(LARGEUR_MIN, c.width), x2 - x);
            height = Math.max(Math.min(HAUTEUR_MIN, c.height), y2 - y);
        }
        return { dx: x - ref.left, dy: y - ref.top, width, height };
    }

    /**
     * Jamais plus grand que son pane : un cadre gardé dans une grande fenêtre
     * peut revenir dans un pane devenu plus étroit (fenêtre réduite, split).
     */
    private plafonner(): void {
        const pane = this.el.parentElement?.getBoundingClientRect();
        if (!this.cadre || !pane) return;
        const largeur = Math.max(Math.min(LARGEUR_MIN, this.cadre.width), pane.width - 2 * MARGE);
        const hauteur = Math.max(Math.min(HAUTEUR_MIN, this.cadre.height), pane.height - 2 * MARGE);
        if (this.cadre.width <= largeur && this.cadre.height <= hauteur) return;
        this.cadre = { ...this.cadre, width: Math.min(this.cadre.width, largeur), height: Math.min(this.cadre.height, hauteur) };
        this.appliquerTaille();
    }

    /** Client → repère du parent : l'écart entre la boîte client et left/top. */
    private origine(): { ox: number; oy: number } {
        const r = this.el.getBoundingClientRect();
        return {
            ox: r.left - (parseFloat(this.el.style.left) || 0),
            oy: r.top - (parseFloat(this.el.style.top) || 0),
        };
    }

    /** Le cadre qui reproduit exactement la place actuelle (premier geste). */
    private cadreActuel(): Cadre {
        const r = this.el.getBoundingClientRect();
        const ref = this.reference();
        return { dx: r.left - ref.left, dy: r.top - ref.top, width: r.width, height: r.height };
    }

    private appliquerTaille(): void {
        if (!this.cadre) return;
        // is-cadre : taille imposée, le contenu défile dedans (styles.css).
        this.el.classList.add('is-cadre');
        this.el.style.maxWidth = 'none';
        this.el.style.width = `${this.cadre.width}px`;
        this.el.style.height = `${this.cadre.height}px`;
    }

    /**
     * Un geste au pointeur sur `cible`. `debut` décide au pointerdown si le
     * geste a lieu et rend la transformation du cadre de départ par le
     * déplacement du pointeur.
     */
    private glisser(
        cible: HTMLElement,
        debut: (e: PointerEvent) => ((dx: number, dy: number, depart: Cadre) => Cadre) | null,
    ): void {
        const down = (e: PointerEvent): void => {
            if (e.button !== 0) return;
            const transformer = debut(e);
            if (!transformer) return;
            e.preventDefault();
            e.stopPropagation();
            const depart = this.cadre ?? this.cadreActuel();
            const x0 = e.clientX;
            const y0 = e.clientY;
            cible.setPointerCapture(e.pointerId);
            this.el.classList.add('is-geste');

            const move = (ev: PointerEvent): void => {
                this.cadre = transformer(ev.clientX - x0, ev.clientY - y0, depart);
                this.appliquerTaille();
                this.poser();
            };
            const up = (): void => {
                cible.removeEventListener('pointermove', move);
                cible.removeEventListener('pointerup', up);
                cible.removeEventListener('pointercancel', up);
                this.el.classList.remove('is-geste');
            };
            cible.addEventListener('pointermove', move);
            cible.addEventListener('pointerup', up);
            cible.addEventListener('pointercancel', up);
        };
        cible.addEventListener('pointerdown', down);
    }
}

/**
 * Le cadre après avoir tiré `bord` de (dx, dy). Tirer le haut ou la gauche
 * déplace aussi le coin : le bord opposé ne bouge pas, même à la taille min.
 */
export function redimensionner(bord: string, dx: number, dy: number, c: Cadre): Cadre {
    let { dx: x, dy: y, width, height } = c;
    // Le minimum ne grandit jamais un widget déjà plus petit que lui.
    const largeurMin = Math.min(LARGEUR_MIN, c.width);
    const hauteurMin = Math.min(HAUTEUR_MIN, c.height);
    if (bord.includes('e')) width = Math.max(largeurMin, c.width + dx);
    if (bord.includes('s')) height = Math.max(hauteurMin, c.height + dy);
    if (bord.includes('w')) {
        width = Math.max(largeurMin, c.width - dx);
        x = c.dx + c.width - width;
    }
    if (bord.includes('n')) {
        height = Math.max(hauteurMin, c.height - dy);
        y = c.dy + c.height - height;
    }
    return { dx: x, dy: y, width, height };
}
