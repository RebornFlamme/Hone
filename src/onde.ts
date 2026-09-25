// ═══════════════════════════════════════════════════════════════════════════
//  L'onde : cinq traits fins dont la hauteur suit une voix.
//
//  Reprise du bouton musique de Skiper (Skiper25), sans React ni Motion : les
//  hauteurs sont relues toutes les 100 ms, et chaque trait rejoint la sienne
//  sur un ressort vif (raideur 300, amortissement 10), en CSS.
//
//  ★ POURQUOI `scaleY` et pas `height` : la hauteur relancerait la mise en
//    page de la pilule dix fois par seconde. L'échelle reste sur le compositeur.
// ═══════════════════════════════════════════════════════════════════════════

import { ressort } from './eclosion';

/** Le nombre de traits (Skiper25 : `bars = 5`). */
export const TRAITS = 5;

/** La hauteur d'un trait à l'échelle 1, et son minimum (Skiper25 : `Math.max(4, height * 14)`). */
const HAUTEUR = 14;
const HAUTEUR_MIN = 4;

/** Le niveau le plus bas d'un trait qui parle (Skiper25 : `Math.random() * 0.8 + 0.2`). */
const PLANCHER = 0.2;

/** Le niveau au repos (Skiper25 : `fill(0.1)`). */
const REPOS = 0.1;

/** La relecture des niveaux (Skiper25 : `setInterval(…, 100)`). */
const PERIODE = 100;

/** Les bornes de la voix : les cinq traits se partagent 80 Hz à 4 kHz, en bandes logarithmiques. */
const HZ_BAS = 80;
const HZ_HAUT = 4000;

/**
 * L'énergie moyenne d'une bande qui remplit son trait (sur 255). Une voix
 * parlée près du micro atteint rarement le plein : sans ce gain, l'onde
 * resterait basse.
 */
const PLEIN = 160;

/**
 * Les cinq niveaux, dans [0,2 ; 1], lus dans un spectre (`getByteFrequencyData`).
 * `hzParCase` : la largeur d'une case du spectre (fréquence d'échantillonnage
 * divisée par `fftSize`).
 */
export function niveaux(spectre: Uint8Array, hzParCase: number): number[] {
    const ratio = Math.pow(HZ_HAUT / HZ_BAS, 1 / TRAITS);
    return Array.from({ length: TRAITS }, (_, i) => {
        const debut = Math.floor((HZ_BAS * Math.pow(ratio, i)) / hzParCase);
        const fin = Math.max(debut + 1, Math.floor((HZ_BAS * Math.pow(ratio, i + 1)) / hzParCase));
        let somme = 0;
        let n = 0;
        for (let k = debut; k < fin && k < spectre.length; k++) {
            somme += spectre[k];
            n++;
        }
        const moyenne = n > 0 ? somme / n : 0;
        return PLANCHER + (1 - PLANCHER) * Math.min(1, moyenne / PLEIN);
    });
}

/** Des hauteurs au hasard, pour une voix qu'on ne peut pas écouter (Skiper25 tel quel). */
export function auHasard(): number[] {
    return Array.from({ length: TRAITS }, () => Math.random() * (1 - PLANCHER) + PLANCHER);
}

/** Le ressort des traits, calculé une fois. */
let transition: string | null = null;

export class Onde {

    readonly el: HTMLElement;
    private readonly traits: HTMLElement[];
    private minuterie = 0;

    constructor() {
        this.el = document.createElement('div');
        this.el.classList.add('agent-onde');
        this.el.setAttribute('aria-hidden', 'true');
        if (!transition) {
            const { easing, duree } = ressort(300, 10);
            transition = `transform ${duree}ms ${easing}`;
        }
        this.traits = Array.from({ length: TRAITS }, () => {
            const trait = this.el.appendChild(document.createElement('span'));
            trait.classList.add('agent-onde-trait');
            trait.style.transition = transition ?? '';
            return trait;
        });
        this.repos();
    }

    /** Relit `lire` toutes les 100 ms et pose les traits à ces niveaux. */
    suivre(lire: () => number[]): void {
        this.arreter();
        const poser = (): void => this.poser(lire());
        poser();
        this.minuterie = window.setInterval(poser, PERIODE);
    }

    /** Les traits retombent à plat. */
    repos(): void {
        this.arreter();
        this.poser(Array(TRAITS).fill(REPOS));
    }

    detruire(): void {
        this.arreter();
        this.el.remove();
    }

    private arreter(): void {
        window.clearInterval(this.minuterie);
        this.minuterie = 0;
    }

    private poser(niveaux: number[]): void {
        this.traits.forEach((trait, i) => {
            const hauteur = Math.max(HAUTEUR_MIN, (niveaux[i] ?? REPOS) * HAUTEUR);
            trait.style.transform = `scaleY(${hauteur / HAUTEUR})`;
        });
    }
}
