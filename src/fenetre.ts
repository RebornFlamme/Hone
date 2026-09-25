import type { WidgetAnchor, WidgetHandle } from 'fragment';
import type { Repere } from './repere';
import { MARGE } from './placement';

// ═══════════════════════════════════════════════════════════════════════════
//  Le chat et les cartes d'outil sont des widgets du cœur (WidgetLayer) : on
//  les attrape par leur en-tête pour les déplacer, et par un bord ou un coin
//  pour les agrandir.
//
//  Le suivi du texte n'est plus notre affaire : l'ancre document du cœur fait
//  défiler le widget avec la note et le recale à l'édition. Ce fichier ne fait
//  que le GESTE : il lit l'ancre courante et la décale (le patron de
//  DocWidget.shiftAnchor, views/doc-widget/DocWidget.ts).
//
//  ★ POURQUOI pas DocWidget lui-même : ses bords et son déplacement sont privés
//    et il héberge une feuille d'éditeur. Le jour où le cœur en sort une
//    classe générique, ce fichier disparaît.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Où un widget a été posé et à quelle taille, pour le rouvrir à la même place :
 * l'écart au glyphe du trait (celui de l'ancre), et la taille en px document.
 */
export interface Cadre {
    dx: number;
    dy: number;
    width: number;
    height: number;
}

/** En deçà, le titre, la croix et la saisie du chat ne tiennent plus. */
const LARGEUR_MIN = 220;
const HAUTEUR_MIN = 120;

type Bord = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
const BORDS: Bord[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

/** Au-delà, on tient un déplacement et plus un clic (le seuil de DocWidget et de Toolbar). */
const SEUIL = 4;

export class Fenetre {

    private readonly el: HTMLElement;
    private readonly repere: Repere;
    private handle: WidgetHandle | null = null;
    /** Vrai dès qu'on l'a déplacée ou agrandie : sa place devient un choix. */
    private touchee = false;

    constructor(el: HTMLElement, poignee: HTMLElement, repere: Repere) {
        this.el = el;
        this.repere = repere;
        el.classList.add('agent-widget');
        poignee.classList.add('agent-widget-poignee');

        this.geste(poignee, (e) => {
            // Les boutons de l'en-tête (la croix) restent des boutons.
            if (e.target instanceof Element && e.target.closest('button, input, textarea')) return null;
            return (dx, dy, depart) => this.bornerDeplacement(dx, dy, depart);
        });

        for (const bord of BORDS) {
            const b = el.appendChild(document.createElement('div'));
            b.classList.add('agent-widget-bord', `mod-${bord}`);
            b.setAttribute('aria-hidden', 'true');
            this.geste(b, () => (dx, dy, depart) => this.bornerTaille(bord, dx, dy, depart));
        }
    }

    estMontee(): boolean {
        return this.handle !== null;
    }

    /**
     * Monte le widget. Avec un cadre gardé, il reprend sa place et sa taille ;
     * sinon `placer` le pose à côté du trait (Repere.aCote).
     */
    monter(cadre: Cadre | null, placer: (el: HTMLElement) => WidgetAnchor | null): void {
        this.retirer();
        this.touchee = cadre !== null;
        if (cadre) this.appliquerTaille(this.plafonner(cadre));
        else {
            this.oublierTaille();
            // Jamais plus large que son pane, comme le `max-width: 100% - 16px`
            // d'avant : le parent du widget est le plan document, 0×0.
            const p = this.repere.paneClient();
            this.el.style.maxWidth = `${this.repere.ecartDocument(p.width - 2 * MARGE, 0).dx}px`;
        }
        this.handle = this.repere.monter(this.el, cadre ? () => this.repere.ancreDuCadre(cadre) : placer);
    }

    /** Repose le widget ailleurs (le rond devenu carte, la pilule étirée). */
    ancrer(a: WidgetAnchor | null): void {
        if (a) this.handle?.setAnchor(a);
    }

    /**
     * Le cadre à garder : null si on n'y a pas touché (la prochaine ouverture
     * repart de la place automatique), ou si son texte a disparu (le cœur l'a
     * alors détaché en viewport).
     */
    cadre(): Cadre | null {
        const a = this.handle?.getAnchor();
        if (!this.touchee || !a || a.mode !== 'document') return null;
        const taille = this.repere.ecartDocument(this.el.offsetWidth, this.el.offsetHeight);
        return { dx: a.dx, dy: a.dy, width: taille.dx, height: taille.dy };
    }

    retirer(): void {
        this.handle?.remove();
        this.handle = null;
        this.el.remove();
    }

    // ── Les gestes ─────────────────────────────────────────────────────────

    /**
     * Déplacé, le widget reste dans son pane, à MARGE de ses bords : au-delà,
     * le pane le rogne. Seul le geste est borné : le défilement peut
     * l'emporter hors de l'écran avec son texte, comme le texte.
     */
    private bornerDeplacement(dx: number, dy: number, depart: DOMRect): DOMRect {
        const p = this.repere.paneClient();
        const x = Math.max(p.left + MARGE, Math.min(depart.left + dx, p.right - MARGE - depart.width));
        const y = Math.max(p.top + MARGE, Math.min(depart.top + dy, p.bottom - MARGE - depart.height));
        return new DOMRect(x, y, depart.width, depart.height);
    }

    /** Tirer le haut ou la gauche déplace le coin : le bord opposé ne bouge pas. */
    private bornerTaille(bord: Bord, dx: number, dy: number, d: DOMRect): DOMRect {
        const p = this.repere.paneClient();
        // Le minimum ne grandit jamais un widget déjà plus petit que lui.
        const lMin = Math.min(LARGEUR_MIN, d.width);
        const hMin = Math.min(HAUTEUR_MIN, d.height);
        let { left, top, right, bottom } = d;
        if (bord.includes('e')) right = Math.min(Math.max(left + lMin, right + dx), p.right - MARGE);
        if (bord.includes('s')) bottom = Math.min(Math.max(top + hMin, bottom + dy), p.bottom - MARGE);
        if (bord.includes('w')) left = Math.max(Math.min(right - lMin, left + dx), p.left + MARGE);
        if (bord.includes('n')) top = Math.max(Math.min(bottom - hMin, top + dy), p.top + MARGE);
        return new DOMRect(left, top, right - left, bottom - top);
    }

    /**
     * Un geste au pointeur sur `cible`. `debut` décide au pointerdown si le
     * geste a lieu, et rend la boîte CLIENT voulue pour un déplacement du
     * pointeur. On en déduit le décalage de l'ancre COURANTE (jamais d'une
     * copie : une frappe pendant le geste a pu la remapper) et la taille.
     */
    private geste(cible: HTMLElement, debut: (e: PointerEvent) => ((dx: number, dy: number, depart: DOMRect) => DOMRect) | null): void {
        cible.addEventListener('pointerdown', (e) => {
            if (e.button !== 0 || !this.handle) return;
            const transformer = debut(e);
            if (!transformer) return;
            e.preventDefault();
            e.stopPropagation();
            const depart = this.el.getBoundingClientRect();
            const a0 = this.handle.getAnchor();
            const x0 = e.clientX;
            const y0 = e.clientY;
            let parti = false;
            cible.setPointerCapture(e.pointerId);

            const move = (ev: PointerEvent): void => {
                const dx = ev.clientX - x0;
                const dy = ev.clientY - y0;
                if (!parti && Math.abs(dx) < SEUIL && Math.abs(dy) < SEUIL) return;
                if (!parti) {
                    parti = true;
                    this.touchee = true;
                    this.el.classList.add('is-geste');
                }
                const voulue = transformer(dx, dy, depart);
                const decalage = this.repere.ecartDocument(voulue.left - depart.left, voulue.top - depart.top);
                const a = this.handle?.getAnchor();
                if (!a) return;
                if (voulue.width !== depart.width || voulue.height !== depart.height) {
                    const taille = this.repere.ecartDocument(voulue.width, voulue.height);
                    this.appliquerTaille({ width: taille.dx, height: taille.dy });
                }
                this.handle?.setAnchor(decaler(a, a0, decalage));
            };
            const fin = (ev: PointerEvent): void => {
                cible.removeEventListener('pointermove', move);
                cible.removeEventListener('pointerup', fin);
                cible.removeEventListener('pointercancel', fin);
                cible.removeEventListener('lostpointercapture', fin);
                if (cible.hasPointerCapture(ev.pointerId)) cible.releasePointerCapture(ev.pointerId);
                this.el.classList.remove('is-geste');
            };
            cible.addEventListener('pointermove', move);
            cible.addEventListener('pointerup', fin);
            cible.addEventListener('pointercancel', fin);
            // Perdre le focus fenêtre ne délivre jamais de pointerup (le piège noté par Toolbar).
            cible.addEventListener('lostpointercapture', fin);
        });
    }

    // ── La taille ──────────────────────────────────────────────────────────

    /**
     * Jamais plus grand que son pane : un cadre gardé dans une grande fenêtre
     * peut revenir dans un pane devenu plus étroit (fenêtre réduite, split).
     */
    private plafonner(c: Cadre): Cadre {
        const p = this.repere.paneClient();
        const max = this.repere.ecartDocument(p.width - 2 * MARGE, p.height - 2 * MARGE);
        return {
            ...c,
            width: Math.min(c.width, Math.max(Math.min(LARGEUR_MIN, c.width), max.dx)),
            height: Math.min(c.height, Math.max(Math.min(HAUTEUR_MIN, c.height), max.dy)),
        };
    }

    private appliquerTaille(t: { width: number; height: number }): void {
        // is-cadre : taille imposée, le contenu défile dedans (styles.css).
        this.el.classList.add('is-cadre');
        this.el.style.maxWidth = 'none';
        this.el.style.width = `${t.width}px`;
        this.el.style.height = `${t.height}px`;
    }

    private oublierTaille(): void {
        this.el.classList.remove('is-cadre');
        this.el.style.width = '';
        this.el.style.height = '';
        this.el.style.maxWidth = '';
    }
}

/** L'ancre courante `a`, décalée de `d` depuis la position de départ `a0`. */
function decaler(a: WidgetAnchor, a0: WidgetAnchor, d: { dx: number; dy: number }): WidgetAnchor {
    if (a.mode === 'viewport' && a0.mode === 'viewport') return { ...a, x: a0.x + d.dx, y: a0.y + d.dy };
    if (a.mode === 'document' && a0.mode === 'document') return { ...a, dx: a0.dx + d.dx, dy: a0.dy + d.dy };
    return a;
}
