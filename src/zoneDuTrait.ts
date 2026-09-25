// ═══════════════════════════════════════════════════════════════════════════
//  Le texte couvert par un trait d'annotation — géométrie pure, sans DOM.
//
//  ★ POURQUOI un fichier à part, comme annotation/geometry.ts : c'est la seule
//    partie qui se teste sans lancer Electron. L'éditeur n'y entre que par
//    l'interface `Mesure`, qu'un test remplace par une grille de caractères.
//
//  Toutes les coordonnées sont DOCUMENT-relatives (le repère de `coordsAtPos`).
// ═══════════════════════════════════════════════════════════════════════════

/** Un point du trait, en coordonnées document. */
export interface Pt {
    x: number;
    y: number;
}

/** Ce que la fonction demande à l'éditeur, et rien de plus. */
export interface Mesure {
    /** L'offset le plus proche d'un point document, `null` hors du texte. */
    posAt(x: number, y: number): number | null;
    /** Le rectangle du glyphe à cet offset, `null` s'il n'est pas rendu. */
    coordsAt(offset: number): { left: number; top: number; right: number; bottom: number } | null;
    /** Le caractère à cet offset, pour écarter les espaces des bords. */
    charAt(offset: number): string;
}

export type Forme = 'entoure' | 'surligne' | 'souligne';

/** Une boîte plus petite que ça n'entoure rien : c'est un point ou un tic. */
const COTE_MIN_CERCLE = 20;

/** Un trait plus plat que ça est un soulignement, pas un gribouillis. */
const HAUTEUR_MAX_SOULIGNE = 14;

/** Le pas d'échantillonnage le long d'un trait ouvert. */
const PAS = 4;

/**
 * Quelle forme a ce trait ?
 *
 * Fermé : le départ et l'arrivée sont proches par rapport à la taille du tracé
 * (un tiers du plus grand côté, 24 px au moins : la main ne referme jamais
 * pile). Sinon, le surligneur surligne, et le crayon souligne s'il est plat.
 */
export function formeDuTrait(points: readonly Pt[], outil: 'crayon' | 'surligneur'): Forme | null {
    if (points.length < 2) return null;
    const b = boite(points);
    const largeur = b.maxX - b.minX;
    const hauteur = b.maxY - b.minY;

    const ecart = Math.hypot(points[0].x - points[points.length - 1].x, points[0].y - points[points.length - 1].y);
    const ferme = ecart <= Math.max(24, Math.max(largeur, hauteur) / 3);
    if (ferme && largeur >= COTE_MIN_CERCLE && hauteur >= COTE_MIN_CERCLE) return 'entoure';

    if (outil === 'surligneur') return 'surligne';
    if (hauteur <= HAUTEUR_MAX_SOULIGNE && largeur > hauteur * 2) return 'souligne';
    return null;
}

/** La plage de texte couverte par le trait, ou `null` s'il ne couvre rien. */
export function plageDuTrait(
    points: readonly Pt[],
    outil: 'crayon' | 'surligneur',
    mesure: Mesure,
): { from: number; to: number } | null {
    const forme = formeDuTrait(points, outil);
    if (!forme) return null;
    const plage = forme === 'entoure' ? plageEntouree(points, mesure) : plageLeLong(points, forme, mesure);
    return plage ? rogner(plage, mesure) : null;
}

// ── Les trois formes ───────────────────────────────────────────────────────

/**
 * Les caractères dont le CENTRE est dans le polygone du trait.
 *
 * Les candidats : on balaie la boîte par bandes de quelques pixels et on
 * demande l'offset à ses deux bords. Les quatre coins ne suffisent pas : un
 * cercle qui déborde au-dessus du texte a ses coins hauts hors du document,
 * et sa première ligne serait oubliée.
 */
function plageEntouree(points: readonly Pt[], mesure: Mesure): { from: number; to: number } | null {
    const b = boite(points);
    const bornes: number[] = [];
    for (let y = b.minY; y <= b.maxY + PAS; y += PAS) {
        const yb = Math.min(y, b.maxY);
        for (const x of [b.minX, b.maxX]) {
            const off = mesure.posAt(x, yb);
            if (off !== null) bornes.push(off);
        }
    }
    if (bornes.length === 0) return null;
    const debut = Math.min(...bornes);
    const fin = Math.max(...bornes);

    let from = Infinity;
    let to = -Infinity;
    for (let off = debut; off <= fin; off++) {
        const r = mesure.coordsAt(off);
        if (!r || r.right <= r.left) continue;
        const centre = { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 };
        if (dansPolygone(centre, points)) {
            from = Math.min(from, off);
            to = Math.max(to, off + 1);
        }
    }
    return from < to ? { from, to } : null;
}

/**
 * Surligné ou souligné : on suit le trait et on demande l'offset sous chaque
 * point. Pour un soulignement, le texte est AU-DESSUS du trait : on remonte
 * chaque point d'une demi-ligne, mesurée sur le glyphe le plus proche.
 */
function plageLeLong(points: readonly Pt[], forme: 'surligne' | 'souligne', mesure: Mesure): { from: number; to: number } | null {
    let remontee = 0;
    if (forme === 'souligne') {
        const p0 = mesure.posAt(points[0].x, points[0].y);
        const r = p0 === null ? null : mesure.coordsAt(p0);
        remontee = r ? (r.bottom - r.top) / 2 + 2 : 10;
    }

    let from = Infinity;
    let to = -Infinity;
    for (const p of echantillonner(points)) {
        const off = mesure.posAt(p.x, p.y - remontee);
        if (off === null) continue;
        from = Math.min(from, off);
        to = Math.max(to, off);
    }
    return from < to ? { from, to } : null;
}

// ── Outils ─────────────────────────────────────────────────────────────────

/** Retire les espaces et retours à la ligne des deux bords. */
function rogner(plage: { from: number; to: number }, mesure: Mesure): { from: number; to: number } | null {
    let { from, to } = plage;
    while (from < to && /\s/.test(mesure.charAt(from))) from++;
    while (to > from && /\s/.test(mesure.charAt(to - 1))) to--;
    return from < to ? { from, to } : null;
}

/** Des points tous les `PAS` pixels le long de la polyligne, extrémités comprises. */
function echantillonner(points: readonly Pt[]): Pt[] {
    const out: Pt[] = [points[0]];
    for (let i = 1; i < points.length; i++) {
        const a = points[i - 1];
        const b = points[i];
        const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / PAS));
        for (let k = 1; k <= n; k++) out.push({ x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n });
    }
    return out;
}

function boite(points: readonly Pt[]): { minX: number; minY: number; maxX: number; maxY: number } {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of points) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
    }
    return { minX, minY, maxX, maxY };
}

/**
 * Le test pair-impair : une demi-droite partie du point coupe le bord un nombre
 * impair de fois si le point est dedans. Le polygone est fermé d'office (le
 * dernier point rejoint le premier), puisque la main ne referme jamais pile.
 */
export function dansPolygone(p: Pt, poly: readonly Pt[]): boolean {
    let dedans = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const a = poly[i];
        const b = poly[j];
        if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) {
            dedans = !dedans;
        }
    }
    return dedans;
}
