import {
    autoUpdate, computePosition, flip, hide, offset, shift,
    type VirtualElement,
} from '@floating-ui/dom';
import { Component, setIcon, type App } from 'fragment';
import { eclore, ressort, type Eclosion } from './eclosion';
import { eviter, type Boite } from './eviter';
import { agir, resumerOral, type ContexteQuestion, type Outil } from './repondre';
import { PiedSupprimer } from './supprimer';
import type { Message } from './traces';
import { Widget, type Cadre } from './widget';

/** Les cinq outils : leur icône Lucide et leur nom, dans l'ordre de la barre. */
export const OUTILS: Record<Outil, { icone: string; libelle: string }> = {
    definir: { icone: 'book-a', libelle: 'Définir' },
    visualiser: { icone: 'chart-network', libelle: 'Visualiser' },
    aider: { icone: 'lightbulb', libelle: 'Aider' },
    traduire: { icone: 'languages', libelle: 'Traduire' },
    resumer: { icone: 'list', libelle: 'Résumer' },
};

/**
 * Ce que montre la carte : la réponse d'un outil, ou le bilan d'une discussion
 * orale avec les tours dont il est tiré.
 */
export type Resultat =
    | { type: 'outil'; outil: Outil; texte: string }
    | { type: 'oral'; messages: Message[]; texte: string };

/** Le rond et la carte du bilan d'une discussion orale. */
const BILAN = { icone: 'mic', libelle: 'Bilan' };

/** Le ressort de la résorption : le même, vif, que la rallonge. */
const RAIDEUR = 700;
const AMORTISSEMENT = 48;

/**
 * Un outil lancé sur un passage.
 *
 * Deux temps. D'abord la barre entière se résorbe en un gros rond qui porte
 * l'icône de l'outil, cerclé d'un arc qui tourne : l'agent réfléchit. Puis,
 * la réponse arrivée, le rond s'ouvre en carte (la goutte d'eclosion.ts,
 * comme le chat) : l'icône, le nom de l'outil, une croix, la réponse.
 *
 * Sert aussi au bilan d'une discussion orale (lancerBilan) : la pilule se
 * résorbe dans le rond du micro, et la carte porte le bilan écrit.
 *
 * Comme la barre et la bulle, elle ne se ferme QU'À LA CROIX de la carte.
 * Pendant l'attente, il n'y a rien à fermer : tout a fondu dans le rond.
 */
export class ActionAgent extends Component {

    private readonly cercleEl: HTMLElement;
    private readonly carteEl: HTMLElement;
    private readonly iconeCercleEl: HTMLElement;
    private readonly iconeCarteEl: HTMLElement;
    private readonly titreEl: HTMLElement;
    private readonly corpsEl: HTMLElement;
    private readonly pied: PiedSupprimer;
    /** Déplacer et agrandir la carte (widget.ts). Le rond, lui, ne bouge pas. */
    private readonly widget: Widget;

    /** Le numéro du lancement en cours : une réponse d'un lancement fermé est ignorée. */
    private lancement = 0;
    /**
     * L'écart entre le haut du rond et le haut du passage, relevé quand la
     * carte s'ouvre : la carte garde le haut du rond, dont elle sort, même
     * une fois le rond retiré.
     */
    private decalageCarte = 0;
    private animations: { annuler(): void }[] = [];
    /** Ce que montre la carte, lu par le calque à la fermeture. */
    private montre: Resultat | null = null;

    private readonly app: App;
    private readonly parentEl: HTMLElement;
    private readonly reference: VirtualElement;
    private readonly onFermer: () => void;
    private readonly evitement: { obstacles: () => Boite[]; limites: () => Boite };

    constructor(
        app: App,
        parentEl: HTMLElement,
        reference: VirtualElement,
        onFermer: () => void,
        evitement: { obstacles: () => Boite[]; limites: () => Boite },
        onSupprimer: () => void,
        onDiscuter: () => void,
    ) {
        super();
        this.app = app;
        this.parentEl = parentEl;
        this.reference = reference;
        this.onFermer = onFermer;
        this.evitement = evitement;

        // ── Le rond, pendant que l'agent réfléchit ──
        this.cercleEl = document.createElement('div');
        this.cercleEl.classList.add('agent-action-cercle');
        this.cercleEl.setAttribute('role', 'status');
        this.iconeCercleEl = this.cercleEl.appendChild(document.createElement('span'));
        this.iconeCercleEl.classList.add('agent-action-icone');
        // L'arc qui tourne autour du rond : un quart de cercle, en SVG.
        this.cercleEl.insertAdjacentHTML('beforeend',
            '<svg class="agent-action-arc" viewBox="0 0 60 60" aria-hidden="true">'
            + '<circle cx="30" cy="30" r="28" pathLength="100"/></svg>');

        // ── La carte, la réponse arrivée ──
        this.carteEl = document.createElement('div');
        this.carteEl.classList.add('agent-action-carte');
        this.carteEl.setAttribute('role', 'dialog');

        const tete = this.carteEl.appendChild(document.createElement('div'));
        tete.classList.add('agent-action-tete');
        this.iconeCarteEl = tete.appendChild(document.createElement('span'));
        this.iconeCarteEl.classList.add('agent-action-icone');
        this.titreEl = tete.appendChild(document.createElement('span'));
        this.titreEl.classList.add('agent-action-titre');
        const fermerEl = tete.appendChild(document.createElement('button'));
        fermerEl.type = 'button';
        fermerEl.classList.add('agent-bulle-fermer');
        fermerEl.setAttribute('aria-label', 'Fermer');
        fermerEl.title = 'Fermer';
        setIcon(app, fermerEl, 'x');
        fermerEl.addEventListener('click', () => this.fermer());

        this.corpsEl = this.carteEl.appendChild(document.createElement('div'));
        this.corpsEl.classList.add('agent-action-corps');
        this.corpsEl.setAttribute('aria-live', 'polite');

        // La tête de chat sur toute réponse arrivée, la poubelle seulement sur
        // une réponse rouverte depuis la marge.
        this.pied = new PiedSupprimer(app, onSupprimer, onDiscuter);
        this.carteEl.appendChild(this.pied.el);

        this.widget = new Widget(this.carteEl, tete, () => reference.getBoundingClientRect());

        this.carteEl.addEventListener('keydown', (e) => e.stopPropagation());
    }

    estOuverte(): boolean {
        return this._loaded;
    }

    /** La réponse que la carte montre, ou null (l'agent réfléchit encore, ou a échoué). */
    resultat(): Resultat | null {
        return this.montre;
    }

    /**
     * La boîte client de la tête de chat du pied, à lire AVANT de fermer la
     * carte : le chat qui la remplace sort de là (eclosion.ts).
     */
    boutonDiscuter(): DOMRect {
        return this.pied.discuterEl?.getBoundingClientRect() ?? this.carteEl.getBoundingClientRect();
    }

    /** Où la carte a été posée et à quelle taille, null si on n'y a pas touché. */
    cadre(): Cadre | null {
        return this.widget.cadre ? { ...this.widget.cadre } : null;
    }

    /**
     * Lance `outil` sur le passage. `depuis` est la boîte CLIENT de la barre,
     * juste avant qu'elle ne soit retirée : le rond en sort.
     */
    lancer(outil: Outil, contexte: ContexteQuestion, depuis: DOMRect): void {
        this.attendre(OUTILS[outil], depuis, agir(outil, contexte),
            (texte) => ({ type: 'outil', outil, texte }));
    }

    /**
     * Le bilan d'une discussion orale : `depuis` est la boîte CLIENT de la
     * pilule, juste avant son retrait. Le rond du micro en sort.
     */
    lancerBilan(contexte: ContexteQuestion, messages: Message[], depuis: DOMRect): void {
        // Sans bilan, la discussion reste gardée : on ne perd pas ce qui s'est dit.
        this.attendre(BILAN, depuis, resumerOral(messages, contexte),
            (texte) => ({ type: 'oral', messages, texte }), 'Bilan indisponible.');
    }

    /** Le rond tourne pendant `reponse`, puis s'ouvre en carte. */
    private attendre(
        aspect: { icone: string; libelle: string }, depuis: DOMRect,
        reponse: Promise<string>, resultat: (texte: string) => Resultat,
        /**
         * Sans lui, une réponse en attente ou en erreur ne laisse rien ; avec
         * lui, elle est gardée avec ce texte.
         */
        texteSiErreur?: string,
    ): void {
        this.cercleEl.setAttribute('aria-label', `${aspect.libelle} : l'agent réfléchit`);
        this.preparer(aspect);
        // Gardée dès maintenant : fermée pendant que le rond tourne, la
        // discussion laisse quand même sa trace.
        if (texteSiErreur !== undefined) this.montre = resultat(texteSiErreur);

        this.lancement++;
        const lancement = this.lancement;
        const estCourant = (): boolean => this._loaded && this.lancement === lancement;

        this.cercleEl.style.opacity = '0';
        this.parentEl.appendChild(this.cercleEl);
        this.load();
        void this.placer().then(() => {
            if (!estCourant()) return;
            this.animations.push(resorber(depuis, this.cercleEl));
        });

        reponse
            .then((texte) => {
                if (!estCourant()) return;
                this.montre = resultat(texte);
                this.ouvrirCarte(texte, false);
            })
            .catch((err: unknown) => {
                if (estCourant()) {
                    if (texteSiErreur !== undefined) this.montre = resultat(texteSiErreur);
                    this.ouvrirCarte(`L'agent n'a pas pu répondre : ${err instanceof Error ? err.message : String(err)}`, true);
                }
            });
    }

    /**
     * Rouvre une réponse déjà reçue (une icône de l'historique, traces.ts) :
     * pas de rond, la carte sort directement de l'icône.
     */
    montrer(outil: Outil, texte: string, depuis: HTMLElement, cadre: Cadre | null): void {
        this.preparer(OUTILS[outil]);
        this.widget.reprendre(cadre);
        this.pied.montrer(true);
        this.pied.montrerDiscuter(true);
        this.montre = { type: 'outil', outil, texte };
        this.corpsEl.textContent = texte;
        this.lancement++;
        const lancement = this.lancement;
        this.decalageCarte = 0;
        this.carteEl.style.opacity = '0';
        this.parentEl.appendChild(this.carteEl);
        this.load();
        void this.placer().then(() => {
            if (!this._loaded || this.lancement !== lancement) return;
            this.animations.push(eclore(depuis, this.carteEl));
        });
    }

    fermer(): void {
        this.unload();
    }

    /** L'icône et le nom (de l'outil, ou du bilan) sur le rond et la carte, le corps vidé. */
    private preparer({ icone, libelle }: { icone: string; libelle: string }): void {
        setIcon(this.app, this.iconeCercleEl, icone);
        setIcon(this.app, this.iconeCarteEl, icone);
        this.titreEl.textContent = libelle;
        this.carteEl.setAttribute('aria-label', libelle);
        this.corpsEl.textContent = '';
        this.corpsEl.classList.remove('is-error');
        this.pied.montrer(false);
        this.pied.montrerDiscuter(false);
        this.widget.oublier();
        this.montre = null;
    }

    onload(): void {
        this.register(autoUpdate(this.reference, this.cercleEl, () => void this.placer()));
    }

    onunload(): void {
        for (const a of this.animations) a.annuler();
        this.animations = [];
        this.cercleEl.remove();
        this.carteEl.remove();
        // Le rond et la carte sont réutilisés d'un lancement à l'autre : le
        // prochain rond doit renaître avec son arc qui tourne.
        this.cercleEl.classList.remove('is-fini');
        this.cercleEl.style.opacity = '';
        this.carteEl.style.opacity = '';
        this.onFermer();
    }

    /** Public, pour les mouvements que autoUpdate ne voit pas (voir agentLayer). */
    placer(): Promise<void> {
        if (!this._loaded) return Promise.resolve();
        const poser = (el: HTMLElement, placement: 'right' | 'right-start'): Promise<void> =>
            computePosition(this.reference, el, {
                placement,
                strategy: 'absolute',
                middleware: [
                    // Le rond à la place de la barre (même écart au passage) ; la
                    // carte sur le haut du passage.
                    offset({ mainAxis: 12, crossAxis: placement === 'right' ? 0 : this.decalageCarte }),
                    flip({ padding: 8, fallbackPlacements: [placement === 'right' ? 'left' : 'left-start'] }),
                    shift({ padding: 8 }),
                    eviter(this.evitement),
                    hide(),
                ],
            }).then(({ x, y, middlewareData }) => {
                if (!this._loaded) return;
                el.style.left = `${x}px`;
                el.style.top = `${y}px`;
                el.style.visibility = middlewareData.hide?.referenceHidden ? 'hidden' : 'visible';
            });
        const enCours = [];
        if (this.cercleEl.isConnected) enCours.push(poser(this.cercleEl, 'right'));
        // Déplacée ou agrandie : elle reste là où on l'a posée dans le texte.
        if (this.carteEl.isConnected && this.widget.cadre) this.widget.poser();
        else if (this.carteEl.isConnected) enCours.push(poser(this.carteEl, 'right-start'));
        return Promise.all(enCours).then(() => undefined);
    }

    /** Le rond s'ouvre en carte : la goutte du chat (eclosion.ts), depuis le rond. */
    private ouvrirCarte(texte: string, erreur: boolean): void {
        this.corpsEl.textContent = texte;
        this.corpsEl.classList.toggle('is-error', erreur);
        // Une erreur n'est pas une réponse dont on discute.
        this.pied.montrerDiscuter(!erreur);
        this.decalageCarte = this.cercleEl.getBoundingClientRect().top - this.reference.getBoundingClientRect().top;
        this.carteEl.style.opacity = '0';
        this.parentEl.appendChild(this.carteEl);
        const lancement = this.lancement;
        void this.placer().then(() => {
            if (!this._loaded || this.lancement !== lancement) return;
            // Le rond s'arrête de tourner : la réponse est là.
            this.cercleEl.classList.add('is-fini');
            const eclosion: Eclosion = eclore(this.cercleEl, this.carteEl);
            this.animations.push(eclosion);
            void eclosion.fini.then(() => {
                if (this._loaded && this.lancement === lancement) this.cercleEl.remove();
            });
        });
    }
}

/**
 * La barre se résorbe en rond : une forme au fond et au filet de la barre
 * part de sa boîte et se pose sur le rond, avec le ressort vif. Le rond
 * apparaît alors, d'un coup (même teinte, l'échange ne se voit pas).
 * Repris par le micro (VoixAgent), dont le rond s'étire ensuite en pilule :
 * `fini` est résolue quand le rond est montré.
 */
export function resorber(depuis: DOMRect, cercle: HTMLElement): { fini: Promise<void>; annuler(): void } {
    const montrer = (): void => { cercle.style.opacity = ''; };
    const parent = cercle.parentElement;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !parent) {
        montrer();
        return { fini: Promise.resolve(), annuler: () => {} };
    }

    // Même translation client → repère du parent qu'eclosion.ts.
    const rc = cercle.getBoundingClientRect();
    const dx = parseFloat(cercle.style.left || '0') - rc.left;
    const dy = parseFloat(cercle.style.top || '0') - rc.top;

    const forme = document.createElement('div');
    forme.classList.add('agent-action-forme');
    parent.appendChild(forme);

    const { easing, duree } = ressort(RAIDEUR, AMORTISSEMENT);
    const anim = forme.animate(
        [
            { left: `${depuis.left + dx}px`, top: `${depuis.top + dy}px`, width: `${depuis.width}px`, height: `${depuis.height}px`, borderRadius: '10px' },
            { left: `${rc.left + dx}px`, top: `${rc.top + dy}px`, width: `${rc.width}px`, height: `${rc.height}px`, borderRadius: `${rc.width / 2}px` },
        ],
        { duration: duree, easing, fill: 'both' },
    );

    let annule = false;
    const fini = anim.finished
        .then(() => {
            if (annule) return;
            forme.remove();
            montrer();
            // L'icône sort du rond d'un petit pop, comme les outils de la rallonge.
            cercle.firstElementChild?.animate(
                [{ opacity: 0, scale: '0.5' }, { opacity: 1, scale: '1' }],
                { duration: 140, easing: 'cubic-bezier(0.2, 0.9, 0.3, 1.2)' },
            );
        })
        .catch(() => {});

    return {
        fini,
        annuler: () => {
            annule = true;
            anim.cancel();
            forme.remove();
            montrer();
        },
    };
}
