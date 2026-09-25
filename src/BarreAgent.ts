import {
    autoUpdate, computePosition, flip, hide, offset, shift,
    type VirtualElement,
} from '@floating-ui/dom';
import { Component, setIcon, type App } from 'fragment';
import { eviter, type Boite } from './eviter';
import { OUTILS } from './ActionAgent';
import { rallonger, type Rallonge } from './rallonge';
import type { Outil } from './repondre';

/** Ce que la barre fait faire au calque : elle ne connaît ni le chat ni la zone. */
export interface ActionsBarre {
    /** La tête de chat : ouvrir la conversation sur le passage. */
    onChat(): void;
    /** La croix : la barre est fermée (le calque ferme le chat avec elle). */
    onFermer(): void;
    /** Un outil : la barre va se résorber dans le rond de l'outil (ActionAgent). */
    onOutil(outil: Outil): void;
}

/**
 * La barre verticale qui apparaît à droite d'un passage surligné ou entouré.
 *
 * De haut en bas : une croix, la tête de chat, les deux outils favoris
 * (définir, visualiser) et « … ». Un clic sur « … » allonge la barre vers le
 * bas (rallonge.ts) et montre les autres outils (aider, traduire, résumer) ;
 * le « … » disparaît alors, et la barre reste longue. Les outils n'ont encore
 * Un clic sur un outil le lance : la barre se retire, remplacée par le
 * rond de l'outil (ActionAgent). Comme la bulle, elle ne se ferme QU'À LA
 * CROIX : ni clic à côté, ni Échap. Placée par Floating UI à droite du passage,
 * à gauche s'il n'y a pas la place.
 *
 * ★ POURQUOI pas core/Toolbar : celle-ci est un mode armé que l'on DÉPLACE à la
 *   poignée, positionnée par l'appelant. La barre de l'agent, elle, est collée
 *   à un passage et le suit au scroll : c'est le travail de Floating UI, qui
 *   écrirait left/top par-dessus le moveTo de la Toolbar. Elle reprend en
 *   revanche son aspect (agent.css, mêmes variables).
 */
export class BarreAgent extends Component {

    readonly dom: HTMLElement;
    /** Le bouton tête de chat : le chat s'aligne sur lui. */
    readonly chatEl: HTMLButtonElement;

    private readonly parentEl: HTMLElement;
    private readonly reference: VirtualElement;
    private readonly actions: ActionsBarre;
    /** Ce que la barre ne doit jamais recouvrir, et le cadre où elle reste (voir eviter.ts). */
    private readonly evitement: { obstacles: () => Boite[]; limites: () => Boite };
    /**
     * La hauteur de la barre avant la rallonge. Floating UI centre la barre sur
     * le passage (`right`) : on la décale de la moitié de ce qu'elle a gagné
     * depuis, lu sur sa hauteur COURANTE, pour que son haut ne bouge ni pendant
     * le geste ni après.
     */
    private hauteurCourte: number | null = null;
    private rallonge: Rallonge | null = null;
    /** Vrai pendant cacher() : le démontage ne prévient pas le calque. */
    private silencieux = false;
    /** « … », et les outils qu'il fait apparaître. */
    private readonly plusEl: HTMLButtonElement;
    private readonly caches: HTMLButtonElement[];

    constructor(
        app: App,
        parentEl: HTMLElement,
        reference: VirtualElement,
        actions: ActionsBarre,
        evitement: { obstacles: () => Boite[]; limites: () => Boite },
    ) {
        super();
        this.parentEl = parentEl;
        this.reference = reference;
        this.actions = actions;
        this.evitement = evitement;

        this.dom = document.createElement('div');
        this.dom.classList.add('agent-barre');
        this.dom.setAttribute('role', 'toolbar');
        this.dom.setAttribute('aria-orientation', 'vertical');
        this.dom.setAttribute('aria-label', 'Agent');

        const fermerEl = this.bouton(app, 'x', 'Fermer', 'agent-barre-fermer');
        fermerEl.addEventListener('click', () => this.fermer());

        this.chatEl = this.bouton(app, 'cat', "Discuter avec l'agent");
        this.chatEl.addEventListener('click', () => this.actions.onChat());

        // Les outils : les deux favoris, puis ceux que « … » fait apparaître.
        const outil = (id: Outil): HTMLButtonElement => {
            const el = this.bouton(app, OUTILS[id].icone, OUTILS[id].libelle, 'agent-barre-outil');
            el.addEventListener('click', () => this.actions.onOutil(id));
            return el;
        };
        outil('definir');
        outil('visualiser');
        this.caches = (['aider', 'traduire', 'resumer'] as const).map((id) => {
            const el = outil(id);
            el.hidden = true;
            return el;
        });

        // « … » : allonge la barre pour montrer les autres outils, puis s'en va.
        this.plusEl = this.bouton(app, 'ellipsis', "Plus d'outils", 'agent-barre-plus');
        this.plusEl.addEventListener('click', () => {
            if (this.rallonge) return;
            this.hauteurCourte = this.dom.offsetHeight;
            const rallonge = rallonger(this.dom, this.plusEl, this.caches);
            this.rallonge = rallonge;
            this.placer();
            void rallonge.fini.then(() => {
                // Fermée pendant l'animation : replier() a déjà tout remis.
                if (this.rallonge !== rallonge) return;
                this.plusEl.remove();
            });
        });

        // Comme dans la bulle : les touches ne partent pas vers les raccourcis de l'app.
        this.dom.addEventListener('keydown', (e) => e.stopPropagation());
    }

    estOuverte(): boolean {
        return this._loaded;
    }

    montrer(): void {
        if (!this._loaded) {
            this.parentEl.appendChild(this.dom);
            this.load();
        }
        this.placer();
    }

    fermer(): void {
        this.unload();
    }

    /**
     * Retire la barre SANS la fermer au sens du calque : un outil prend sa
     * place, le passage reste visé. onFermer n'est pas appelé.
     */
    cacher(): void {
        this.silencieux = true;
        this.unload();
        this.silencieux = false;
    }

    onload(): void {
        this.register(autoUpdate(this.reference, this.dom, () => this.placer()));
    }

    onunload(): void {
        this.replier();
        this.dom.remove();
        if (!this.silencieux) this.actions.onFermer();
    }

    /** Public, pour les mouvements que autoUpdate ne voit pas (voir agentLayer). */
    placer(): void {
        if (!this._loaded) return;
        void computePosition(this.reference, this.dom, {
            placement: 'right',
            strategy: 'absolute',
            middleware: [
                offset({
                    mainAxis: 12,
                    crossAxis: this.hauteurCourte === null ? 0 : (this.dom.offsetHeight - this.hauteurCourte) / 2,
                }),
                flip({ padding: 8, fallbackPlacements: ['left'] }),
                shift({ padding: 8 }),
                // Après flip et shift : ils ignorent les AUTRES flottants, dont la
                // barre d'annotation, rangée par défaut dans la même marge.
                eviter(this.evitement),
                hide(),
            ],
        }).then(({ x, y, middlewareData }) => {
            if (!this._loaded) return;
            this.dom.style.left = `${x}px`;
            this.dom.style.top = `${y}px`;
            this.dom.style.visibility = middlewareData.hide?.referenceHidden ? 'hidden' : 'visible';
        });
    }

    /** La barre est réutilisée d'un trait à l'autre : elle rouvre courte. */
    private replier(): void {
        this.rallonge?.annuler();
        this.rallonge = null;
        this.hauteurCourte = null;
        for (const el of this.caches) el.hidden = true;
        this.plusEl.style.display = '';
        if (!this.plusEl.isConnected) this.dom.appendChild(this.plusEl);
    }

    private bouton(app: App, icone: string | null, libelle: string, classe?: string): HTMLButtonElement {
        const el = this.dom.appendChild(document.createElement('button'));
        el.type = 'button';
        el.classList.add('agent-barre-bouton');
        if (classe) el.classList.add(classe);
        el.setAttribute('aria-label', libelle);
        el.title = libelle;
        if (icone) setIcon(app, el, icone);
        return el;
    }
}
