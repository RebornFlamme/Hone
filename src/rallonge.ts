// ═══════════════════════════════════════════════════════════════════════════
//  La rallonge : au clic sur « … », la barre s'allonge vers le bas et montre
//  les outils cachés. Geste repris du bouton « Dynamic Toggle » de Skiper :
//  le contenant grandit sur un ressort à peine rebondi, contenu rogné, et les
//  nouveaux outils apparaissent en cours de route (fondu, flou, échelle).
//
//  ★ POURQUOI pas la goutte de l'éclosion : essayée d'abord. Sur une barre
//    aussi étroite, le filtre goo se lisait comme un accroc (une forme qui
//    tremble, puis les outils d'un coup). Une hauteur qui s'étire est lisible
//    tout de suite, et elle ne passe par aucun calque fantôme.
//
//  ★ COMMENT : la vraie barre prend sa taille finale (outils démasqués,
//    « … » masqué), on la mesure, puis on anime sa hauteur de l'ancienne à la
//    nouvelle, `overflow: hidden` le temps du geste. Le haut ne bouge pas :
//    c'est BarreAgent qui décale la barre de la moitié de ce qu'elle a gagné.
// ═══════════════════════════════════════════════════════════════════════════

import { ressort } from './eclosion';

/**
 * Le ressort de la hauteur : l'équivalent de `{ type: "spring", bounce: 0.16 }`
 * de Motion (amortissement relatif 0,84), posé en ~300 ms.
 */
const RAIDEUR = 520;
const AMORTISSEMENT = 38;

/** L'apparition d'un outil : son départ après le début du geste, l'écart entre deux, sa durée. */
const RETARD = 70;
const CASCADE = 35;
const APPARITION = 220;

export interface Rallonge {
    /** Résolue quand la barre est à sa taille finale et les outils posés. */
    fini: Promise<void>;
    /** Arrête tout et laisse la barre dans son état final (fermeture pendant l'animation). */
    annuler(): void;
}

/** Allonge `barre` : masque `plus`, démasque `nouveaux`, et anime l'entre-deux. */
export function rallonger(barre: HTMLElement, plus: HTMLElement, nouveaux: HTMLElement[]): Rallonge {
    const avant = barre.offsetHeight;
    plus.style.display = 'none';
    for (const el of nouveaux) el.hidden = false;
    const apres = barre.offsetHeight;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || apres <= avant) {
        return { fini: Promise.resolve(), annuler: () => {} };
    }

    const { easing, duree } = ressort(RAIDEUR, AMORTISSEMENT);
    // border-box : la hauteur mesurée compte le padding et le filet.
    barre.style.boxSizing = 'border-box';
    barre.style.overflow = 'hidden';
    const hauteur = barre.animate(
        [{ height: `${avant}px` }, { height: `${apres}px` }],
        { duration: duree, easing },
    );
    const apparitions = nouveaux.map((el, i) => el.animate(
        [
            { opacity: 0, scale: '0.5', filter: 'blur(4px)' },
            { opacity: 1, scale: '1', filter: 'blur(0px)' },
        ],
        { duration: APPARITION, delay: RETARD + i * CASCADE, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'backwards' },
    ));
    const animations = [hauteur, ...apparitions];

    let annule = false;
    const nettoyer = (): void => {
        for (const a of animations) a.cancel();
        barre.style.boxSizing = '';
        barre.style.overflow = '';
    };

    const fini = Promise.all(animations.map((a) => a.finished))
        .then(() => undefined)
        // Une animation annulée rejette `finished` : c'est la fermeture, pas une erreur.
        .catch(() => {})
        .finally(() => {
            if (!annule) nettoyer();
        });

    return {
        fini,
        annuler: () => {
            if (annule) return;
            annule = true;
            nettoyer();
        },
    };
}
