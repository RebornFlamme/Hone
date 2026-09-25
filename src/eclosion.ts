// ═══════════════════════════════════════════════════════════════════════════
//  L'éclosion : la bulle de chat SORT du bouton tête de chat, comme une goutte.
//
//  Repris de l'effet « gooey » de Skiper (Skiper64), sans React ni
//  framer-motion : l'API Web Animations du navigateur, un ressort calculé ici,
//  et le même filtre SVG.
//
//  ★ COMMENT : un calque fantôme, posé le temps de l'animation, contient deux
//    formes pleines. Un rond fixe sur le bouton, et un rond qui s'en détache
//    puis s'étire jusqu'au rectangle de la bulle. Le filtre (flou, puis seuil
//    sur l'alpha) fait fondre les deux formes l'une dans l'autre tant qu'elles
//    sont proches : c'est ce qui donne la goutte qui s'étire. Quand la forme a
//    atteint la bulle, la vraie bulle apparaît en fondu par-dessus et le
//    fantôme s'efface.
//
//  ★ POURQUOI un fantôme et pas la bulle elle-même : le filtre floute tout ce
//    qu'il touche. Appliqué à la vraie bulle, il rendrait le texte illisible
//    pendant l'animation. Skiper n'a pas ce problème : ses formes sont vides.
// ═══════════════════════════════════════════════════════════════════════════

/** Le ressort de Skiper (LOGO_SPRING) : raideur 300, amortissement 30, masse 1. */
const RAIDEUR = 300;
const AMORTISSEMENT = 30;

/** Le décalage entre le départ du rond et le début de l'étirement (Skiper : 0,15 s). */
const RETARD_ETIREMENT = 150;

/** Le fondu final, du fantôme vers la vraie bulle. */
const FONDU = 140;

/** L'arrondi final, celui de `.agent-bulle`. */
const RAYON_BULLE = 12;

/** La marge autour des formes : le flou déborde, le filtre ne doit pas le rogner. */
const MARGE = 24;

let compteur = 0;

export interface Eclosion {
    /** Résolue quand la vraie bulle est pleinement visible et le fantôme retiré. */
    fini: Promise<void>;
    /** Arrête tout et remet la bulle dans son état normal (fermeture pendant l'animation). */
    annuler(): void;
}

/**
 * Fait sortir `bulle` de `bouton`. La bulle doit être déjà montée et placée :
 * on lit sa position finale. Elle est masquée pendant l'animation.
 *
 * Sans effet (et résolue aussitôt) si l'utilisateur a demandé moins de
 * mouvement dans son système.
 */
export function eclore(bouton: HTMLElement | DOMRect, bulle: HTMLElement): Eclosion {
    // Pas d'animation : la bulle, masquée en attendant d'être placée (voir
    // BulleAgent.ouvrir), doit apparaître tout de suite.
    const sansAnimation = (): Eclosion => {
        bulle.style.opacity = '';
        return { fini: Promise.resolve(), annuler: () => {} };
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return sansAnimation();
    const parent = bulle.parentElement;
    if (!parent) return sansAnimation();

    // ── Les géométries, dans le repère de la bulle ─────────────────────────
    //
    // La bulle est en `absolute` : ses left/top sont dans le repère de son
    // parent positionné. L'écart entre ces valeurs et son rect client est la
    // translation client → ce repère. Le fantôme, monté dans le même parent,
    // y vit aussi.
    const rb = bulle.getBoundingClientRect();
    // Une boîte plutôt qu'un élément : le bouton a pu être retiré entre-temps
    // (la tête de chat d'une carte qui devient le chat, agentLayer).
    const rk = bouton instanceof DOMRect ? bouton : bouton.getBoundingClientRect();
    const dx = parseFloat(bulle.style.left || '0') - rb.left;
    const dy = parseFloat(bulle.style.top || '0') - rb.top;

    const cible = { x: rb.left + dx, y: rb.top + dy, w: rb.width, h: rb.height };
    const d = Math.min(rk.width, rk.height);
    const bouton0 = { x: rk.left + dx + (rk.width - d) / 2, y: rk.top + dy + (rk.height - d) / 2, w: d, h: d };

    // Le point de départ de l'étirement : le point de la bulle le plus proche du
    // bouton. Le rond y file d'abord, puis s'ouvre en rectangle depuis là.
    const cx = bouton0.x + d / 2;
    const cy = bouton0.y + d / 2;
    const px = Math.min(Math.max(cx, cible.x + d / 2), cible.x + cible.w - d / 2);
    const py = Math.min(Math.max(cy, cible.y + d / 2), cible.y + cible.h - d / 2);
    const depart = { x: px - d / 2, y: py - d / 2, w: d, h: d };

    // ── Le fantôme ─────────────────────────────────────────────────────────

    const gauche = Math.min(bouton0.x, cible.x) - MARGE;
    const haut = Math.min(bouton0.y, cible.y) - MARGE;
    const droite = Math.max(bouton0.x + d, cible.x + cible.w) + MARGE;
    const bas = Math.max(bouton0.y + d, cible.y + cible.h) + MARGE;

    const id = `agent-goo-${++compteur}`;
    const fantome = document.createElement('div');
    fantome.classList.add('agent-eclosion');
    Object.assign(fantome.style, {
        left: `${gauche}px`,
        top: `${haut}px`,
        width: `${droite - gauche}px`,
        height: `${bas - haut}px`,
        filter: `url(#${id})`,
    });
    // Le filtre de Skiper, tel quel : un flou, puis une matrice qui pousse
    // l'alpha (×20 − 7) pour ne garder que le cœur des formes. Deux formes
    // proches partagent leur flou, et le seuil les soude.
    fantome.innerHTML = filtreGoo(id);

    const forme = (r: { x: number; y: number; w: number; h: number }): HTMLElement => {
        const el = fantome.appendChild(document.createElement('div'));
        el.classList.add('agent-eclosion-forme');
        Object.assign(el.style, {
            left: `${r.x - gauche}px`,
            top: `${r.y - haut}px`,
            width: `${r.w}px`,
            height: `${r.h}px`,
            borderRadius: '50%',
        });
        return el;
    };
    forme(bouton0);                // reste sur le bouton : la goutte s'en arrache
    const goutte = forme(depart);  // file vers la bulle, puis s'y étire

    bulle.style.opacity = '0';
    parent.appendChild(fantome);

    // ── Les animations ─────────────────────────────────────────────────────

    const { easing, duree } = ressort();
    // Le rond part du bouton : on l'anime par `translate`, indépendant des
    // left/top/width/height de l'étirement. Les deux ressorts se chevauchent,
    // comme dans Skiper (le y sans délai, la taille à +0,15 s).
    const fuite = goutte.animate(
        [{ translate: `${bouton0.x - depart.x}px ${bouton0.y - depart.y}px` }, { translate: '0px 0px' }],
        { duration: duree, easing, fill: 'both' },
    );
    const etirement = goutte.animate(
        [
            { left: `${depart.x - gauche}px`, top: `${depart.y - haut}px`, width: `${d}px`, height: `${d}px`, borderRadius: `${d / 2}px` },
            { left: `${cible.x - gauche}px`, top: `${cible.y - haut}px`, width: `${cible.w}px`, height: `${cible.h}px`, borderRadius: `${RAYON_BULLE}px` },
        ],
        { duration: duree, delay: RETARD_ETIREMENT, easing, fill: 'both' },
    );

    // En s'étirant, la goutte prend la couleur de fond de la bulle : le fondu
    // final passe alors d'une forme à une forme de même teinte, sans éclair.
    // Couleurs résolues ici (et non en var()) : l'interpolation se fait en rgb.
    const teinte = goutte.animate(
        [{ backgroundColor: getComputedStyle(goutte).backgroundColor }, { backgroundColor: getComputedStyle(bulle).backgroundColor }],
        { duration: duree, delay: RETARD_ETIREMENT, easing: 'ease-in', fill: 'both' },
    );

    let annule = false;
    const animations: Animation[] = [fuite, etirement, teinte];

    const nettoyer = (): void => {
        for (const a of animations) a.cancel();
        fantome.remove();
        bulle.style.opacity = '';
    };

    const fini = Promise.all([fuite.finished, etirement.finished, teinte.finished])
        .then(() => {
            if (annule) return;
            const apparition = bulle.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FONDU, easing: 'ease-out' });
            const effacement = fantome.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FONDU, easing: 'ease-out', fill: 'forwards' });
            animations.push(apparition, effacement);
            bulle.style.opacity = '';
            return Promise.all([apparition.finished, effacement.finished]).then(() => undefined);
        })
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

/** Le filtre goo, à poser dans le fantôme et à référencer par `filter: url(#id)`. */
export function filtreGoo(id: string): string {
    return `<svg width="0" height="0" style="position:absolute"><defs><filter id="${id}">`
        + '<feGaussianBlur in="SourceGraphic" stdDeviation="4.4" result="blur"/>'
        + '<feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -7" result="goo"/>'
        + '<feBlend in="SourceGraphic" in2="goo"/>'
        + '</filter></defs></svg>';
}

/**
 * Le ressort, en easing CSS `linear()` : on intègre x'' = −k(x − 1) − c·x'
 * depuis x = 0, et on relève la position toutes les 10 ms jusqu'au repos.
 * Le dépassement éventuel au-delà de 1 est conservé : c'est le rebond.
 */
export function ressort(raideur = RAIDEUR, amortissement = AMORTISSEMENT): { easing: string; duree: number } {
    const dt = 1 / 1000;
    let x = 0;
    let v = 0;
    const releves: number[] = [0];
    let t = 0;
    for (let pas = 0; pas < 2000; pas++) {
        const a = -raideur * (x - 1) - amortissement * v;
        v += a * dt;
        x += v * dt;
        t += dt;
        if (pas % 10 === 9) releves.push(x);
        if (Math.abs(x - 1) < 0.001 && Math.abs(v) < 0.01) break;
    }
    releves.push(1);
    return {
        easing: `linear(${releves.map((r) => Math.round(r * 1000) / 1000).join(', ')})`,
        duree: Math.round(t * 1000),
    };
}
