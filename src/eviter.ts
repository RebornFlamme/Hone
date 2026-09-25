import type { Middleware } from '@floating-ui/dom';

// ═══════════════════════════════════════════════════════════════════════════
//  Un middleware Floating UI : ne jamais poser un élément flottant sur un
//  obstacle (la barre d'annotation, la barre de l'agent, le passage visé).
//
//  ★ POURQUOI un middleware maison : `flip` et `shift` de Floating UI ne
//    connaissent que la référence et les bords du conteneur. Ils ignorent les
//    AUTRES éléments flottants. Or la barre d'annotation est posée par défaut
//    dans la marge droite, exactement là où la barre de l'agent se range, et on
//    peut la traîner n'importe où.
//
//  La méthode : si la position calculée touche un obstacle, on génère des
//  positions candidates (de part et d'autre de la référence et de chaque
//  obstacle, puis un balayage vertical), on écarte celles qui touchent un
//  obstacle ou sortent des limites, et on garde la PLUS PROCHE de la position
//  voulue. L'élément bouge donc le moins possible.
// ═══════════════════════════════════════════════════════════════════════════

/** Un rectangle, en coordonnées CLIENT (celles de getBoundingClientRect). */
export interface Boite {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** L'espace laissé entre l'élément et un obstacle. */
const ECART = 8;

/** Le pas du balayage vertical, quand aucune position simple ne convient. */
const PAS_BALAYAGE = 12;

export function eviter(options: {
    /** Ce qu'il ne faut pas recouvrir, relu à chaque placement. */
    obstacles: () => Boite[];
    /** Le cadre dans lequel l'élément doit rester (le pane). */
    limites: () => Boite;
}): Middleware {
    return {
        name: 'eviter',
        fn(state) {
            const { x, y, rects, elements } = state;
            const w = rects.floating.width;
            const h = rects.floating.height;

            // CLIENT → repère de x/y. rects.reference est dans le repère de x/y,
            // getBoundingClientRect de la référence en client : leur écart est
            // la translation, quel que soit le parent positionné.
            const refClient = elements.reference.getBoundingClientRect();
            const tx = refClient.x - rects.reference.x;
            const ty = refClient.y - rects.reference.y;
            const local = (b: Boite): Boite => ({ x: b.x - tx, y: b.y - ty, width: b.width, height: b.height });

            const obstacles = options.obstacles()
                .filter((b) => b.width > 0 && b.height > 0)
                .map(local);
            const cadre = local(options.limites());

            const libre = (px: number, py: number): boolean => {
                const moi = { x: px, y: py, width: w, height: h };
                return dedans(moi, cadre) && obstacles.every((o) => !chevauche(moi, o));
            };

            if (libre(x, y)) return {};

            const ref = rects.reference;
            const candidats: Array<{ x: number; y: number }> = [
                // Autour de la référence.
                { x: ref.x + ref.width + ECART, y },
                { x: ref.x - w - ECART, y },
                { x, y: ref.y + ref.height + ECART },
                { x, y: ref.y - h - ECART },
            ];
            // Autour de chaque obstacle : juste avant, juste après, dessus, dessous.
            for (const o of obstacles) {
                candidats.push(
                    { x: o.x - w - ECART, y },
                    { x: o.x + o.width + ECART, y },
                    { x, y: o.y + o.height + ECART },
                    { x, y: o.y - h - ECART },
                );
            }
            // Dernier recours : balayer la hauteur du cadre, aux abscisses déjà
            // proposées. Garantit une place libre s'il en existe une sur ces
            // colonnes.
            const colonnes = [...new Set(candidats.map((c) => c.x))];
            for (let py = cadre.y; py + h <= cadre.y + cadre.height; py += PAS_BALAYAGE) {
                for (const px of colonnes) candidats.push({ x: px, y: py });
            }

            // Le jour laissé entre un candidat et la référence : 0 s'il la touche.
            const jour = (px: number, py: number): number => Math.hypot(
                Math.max(0, ref.x - (px + w), px - (ref.x + ref.width)),
                Math.max(0, ref.y - (py + h), py - (ref.y + ref.height)),
            );

            // À côté de la référence (à sa hauteur), plutôt qu'au-dessus ou dessous.
            const deCote = (py: number): number => (py < ref.y + ref.height && py + h > ref.y ? 0 : 1);

            // D'abord se tenir À CÔTÉ de la référence, puis y rester collé,
            // ensuite bouger le moins possible. Sans les deux premiers critères,
            // un obstacle à droite faisait sauter l'élément par-dessus lui, ou
            // au-dessus du passage, plutôt que passer à sa gauche : plus loin de
            // la position voulue, mais à côté du passage.
            let meilleur: { x: number; y: number } | null = null;
            let meilleurCote = Infinity;
            let meilleurJour = Infinity;
            let distance = Infinity;
            for (const c of candidats) {
                // Ramené dans le cadre avant d'être jugé : un candidat qui dépasse
                // de 3 px vaut mieux collé au bord qu'écarté.
                const px = Math.min(Math.max(c.x, cadre.x), cadre.x + cadre.width - w);
                const py = Math.min(Math.max(c.y, cadre.y), cadre.y + cadre.height - h);
                if (!libre(px, py)) continue;
                const k = deCote(py);
                const j = Math.round(jour(px, py));
                const d = Math.hypot(px - x, py - y);
                const mieux = k !== meilleurCote ? k < meilleurCote
                    : j !== meilleurJour ? j < meilleurJour
                    : d < distance;
                if (mieux) {
                    meilleurCote = k;
                    meilleurJour = j;
                    distance = d;
                    meilleur = { x: px, y: py };
                }
            }
            // Aucune place libre (pane minuscule) : on garde la position voulue
            // plutôt que de sauter n'importe où.
            return meilleur ?? {};
        },
    };
}

function chevauche(a: Boite, b: Boite): boolean {
    return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

function dedans(a: Boite, cadre: Boite): boolean {
    return a.x >= cadre.x - 0.5 && a.y >= cadre.y - 0.5
        && a.x + a.width <= cadre.x + cadre.width + 0.5
        && a.y + a.height <= cadre.y + cadre.height + 0.5;
}
