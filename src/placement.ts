// ═══════════════════════════════════════════════════════════════════════════
//  Où poser un widget de l'agent la première fois : à droite d'une boîte (le
//  trait, la barre), à gauche s'il n'y a pas la place, jamais sur un obstacle
//  (la barre d'annotation, le passage).
//
//  Ensuite, ce n'est plus notre affaire : le widget reçoit une ancre document
//  (WidgetLayer), et c'est le cœur qui le fait suivre au scroll et à l'édition.
//  D'où une fonction pure, appelée à l'ouverture, et pas un suivi continu.
//
//  Tout est en coordonnées DOCUMENT, celles de `coordsAtPos` et des ancres :
//  l'appelant convertit une seule fois (agentLayer, `versDocument`).
// ═══════════════════════════════════════════════════════════════════════════

export interface Boite {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

/** Le retrait gardé aux bords du pane, celui de la Toolbar du cœur (MARGE_BORD). */
export const MARGE = 8;

export interface Demande {
    /** Ce à côté de quoi on se pose. */
    ref: Boite;
    largeur: number;
    hauteur: number;
    /** Le haut voulu, ou `centre` : centré sur `ref`. */
    haut: number | 'centre';
    /** L'écart horizontal à `ref`. */
    ecart: number;
    /** Le pane visible : le widget y tient, à MARGE de ses bords. */
    cadre: Boite;
    obstacles: readonly Boite[];
}

const croise = (a: Boite, b: Boite): boolean =>
    a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

/**
 * Le coin haut gauche du widget. Candidats, dans l'ordre : à droite, à gauche,
 * puis à droite et à gauche décalés sous ou au-dessus de l'obstacle qui gêne.
 * Si rien ne va, la droite, rentrée dans le pane.
 */
export function aCote(d: Demande): { x: number; y: number } {
    const { ref, largeur: w, hauteur: h, cadre } = d;
    const hautMin = cadre.top + MARGE;
    const hautMax = cadre.bottom - MARGE - h;
    const borneY = (y: number): number => Math.max(hautMin, Math.min(y, hautMax));

    const y0 = borneY(d.haut === 'centre' ? (ref.top + ref.bottom) / 2 - h / 2 : d.haut);
    const droite = ref.right + d.ecart;
    const gauche = ref.left - d.ecart - w;

    const boite = (x: number, y: number): Boite => ({ left: x, top: y, right: x + w, bottom: y + h });
    const tient = (x: number, y: number): boolean => {
        const b = boite(x, y);
        return b.left >= cadre.left + MARGE && b.right <= cadre.right - MARGE
            && b.top >= hautMin - 0.5 && b.bottom <= cadre.bottom - MARGE + 0.5
            && !d.obstacles.some((o) => croise(b, o));
    };

    const candidats: { x: number; y: number }[] = [{ x: droite, y: y0 }, { x: gauche, y: y0 }];
    for (const x of [droite, gauche]) {
        for (const o of d.obstacles) {
            if (!croise(boite(x, y0), o)) continue;
            candidats.push({ x, y: borneY(o.bottom + MARGE) }, { x, y: borneY(o.top - MARGE - h) });
        }
    }
    const bon = candidats.find((c) => tient(c.x, c.y));
    if (bon) return bon;

    const x = Math.max(cadre.left + MARGE, Math.min(droite, cadre.right - MARGE - w));
    return { x, y: y0 };
}

/** La plus petite boîte qui contient toutes celles-ci. */
export function union(...boites: Boite[]): Boite {
    return {
        left: Math.min(...boites.map((b) => b.left)),
        top: Math.min(...boites.map((b) => b.top)),
        right: Math.max(...boites.map((b) => b.right)),
        bottom: Math.max(...boites.map((b) => b.bottom)),
    };
}
