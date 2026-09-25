import {
    autoUpdate, computePosition, flip, hide, offset, shift,
    type ReferenceElement,
} from '@floating-ui/dom';
import { Component, setIcon, type App } from 'fragment';
import { eclore, type Eclosion } from './eclosion';
import { eviter, type Boite } from './eviter';
import { repondre, type ContexteQuestion } from './repondre';
import { PiedSupprimer } from './supprimer';
import type { Message } from './traces';

/**
 * La bulle de conversation, ouverte par la tête de chat de la barre (BarreAgent)
 * et posée à sa droite, alignée sur le bouton.
 *
 * ★ POURQUOI elle ne se ferme QU'À LA CROIX : c'est l'inverse exact du menu
 *   (core/Menu.ts), et c'est voulu. Un menu est une question à laquelle on
 *   répond d'un clic ; la bulle porte une conversation. La perdre sur un clic
 *   à côté, fait par erreur, efface ce qu'on a écrit et ce que l'agent a
 *   répondu. Donc : ni clic extérieur, ni perte de focus, ni Échap. Seule la
 *   croix ferme, et le démontage de la vue.
 *
 * ★ POURQUOI Floating UI et pas un calcul maison comme le menu : la bulle suit
 *   la barre, qui suit le texte. Elle passe à gauche quand la place manque à
 *   droite (`flip`), reste dans son pane (`shift`) et disparaît quand la barre
 *   sort de l'écran (`hide`). `autoUpdate` la fait suivre au scroll et quand
 *   elle change de taille (le fil qui grandit).
 *
 * ★ POURQUOI extends Component : show() est load(), fermer() est unload(),
 *   comme le menu. Le suivi de position est enregistré et retiré avec elle.
 *
 *     const bulle = new BulleAgent(app, paneEl, barre.dom, barre.chatEl, () => ...);
 *     bulle.ouvrir({ texte, chemin, from, to });
 */
export class BulleAgent extends Component {

    /** La racine, montée dans le pane à l'ouverture, retirée à la fermeture. */
    readonly dom: HTMLElement;

    private readonly extraitEl: HTMLElement;
    private readonly filEl: HTMLElement;
    private readonly champEl: HTMLTextAreaElement;
    private readonly envoyerEl: HTMLButtonElement;
    private readonly pied: PiedSupprimer;

    /** La zone sur laquelle porte la conversation, `null` bulle fermée. */
    private contexte: ContexteQuestion | null = null;
    private enAttente = false;

    /**
     * Le numéro de l'ouverture en cours. Une réponse ne sait pas annuler sa
     * requête : fermée puis rouverte pendant l'attente, la bulle recevrait la
     * réponse de l'ANCIENNE conversation. Chaque réponse compare donc le numéro
     * de son ouverture à celui-ci avant de toucher à quoi que ce soit.
     */
    private ouverture = 0;

    /** L'animation d'ouverture en cours, à annuler si on ferme pendant. */
    private eclosion: Eclosion | null = null;

    /** Le pane de la vue : la bulle y est montée, et `shift` l'y garde. */
    private readonly parentEl: HTMLElement;
    /** La barre : la bulle se pose à sa droite. */
    private readonly reference: ReferenceElement;
    /** Le bouton tête de chat : la bulle s'aligne sur son haut. */
    private readonly alignEl: HTMLElement;
    /**
     * Une conversation rouverte depuis la marge (voir rouvrir()) : la bulle se
     * tient seule contre le trait, sans la barre, et sort de l'icône. null
     * pour une bulle ouverte par la tête de chat de la barre.
     */
    private seule: { reference: ReferenceElement; depuis: HTMLElement } | null = null;
    /**
     * Prévenu à chaque fermeture, avec la conversation et son passage tels
     * qu'ils étaient : le calque en garde une trace dans la marge (traces.ts).
     */
    private readonly onFermer: (messages: Message[], contexte: ContexteQuestion | null) => void;

    /** Ce que la bulle ne doit jamais recouvrir, et le cadre où elle reste (voir eviter.ts). */
    private readonly evitement: { obstacles: () => Boite[]; limites: () => Boite };

    constructor(
        app: App,
        parentEl: HTMLElement,
        reference: ReferenceElement,
        alignEl: HTMLElement,
        onFermer: (messages: Message[], contexte: ContexteQuestion | null) => void,
        evitement: { obstacles: () => Boite[]; limites: () => Boite },
        onSupprimer: () => void,
    ) {
        super();
        this.parentEl = parentEl;
        this.reference = reference;
        this.alignEl = alignEl;
        this.evitement = evitement;
        this.onFermer = onFermer;

        this.dom = document.createElement('div');
        this.dom.classList.add('agent-bulle');
        // Non modale : on peut continuer d'éditer la note pendant qu'elle est ouverte.
        this.dom.setAttribute('role', 'dialog');
        this.dom.setAttribute('aria-label', "Question à l'agent");

        // ── L'en-tête : la zone citée, et la croix ──
        const tete = this.dom.appendChild(document.createElement('div'));
        tete.classList.add('agent-bulle-tete');

        this.extraitEl = tete.appendChild(document.createElement('div'));
        this.extraitEl.classList.add('agent-bulle-extrait');

        const fermerEl = tete.appendChild(document.createElement('button'));
        fermerEl.type = 'button';
        fermerEl.classList.add('agent-bulle-fermer');
        fermerEl.setAttribute('aria-label', 'Fermer');
        fermerEl.title = 'Fermer';
        setIcon(app, fermerEl, 'x');
        fermerEl.addEventListener('click', () => this.fermer());

        // ── Le fil : vide tant qu'on n'a rien demandé, masqué en CSS ──
        this.filEl = this.dom.appendChild(document.createElement('div'));
        this.filEl.classList.add('agent-bulle-fil');
        // Les réponses arrivent après coup : un lecteur d'écran doit les annoncer.
        this.filEl.setAttribute('aria-live', 'polite');

        // ── La saisie ──
        const saisie = this.dom.appendChild(document.createElement('form'));
        saisie.classList.add('agent-bulle-saisie');
        saisie.addEventListener('submit', (e) => {
            e.preventDefault();
            void this.envoyer();
        });

        this.champEl = saisie.appendChild(document.createElement('textarea'));
        this.champEl.classList.add('agent-bulle-champ');
        this.champEl.rows = 1;
        this.champEl.placeholder = 'Poser une question sur ce passage';
        this.champEl.setAttribute('aria-label', 'Question');
        this.champEl.addEventListener('input', () => this.ajusterChamp());
        this.champEl.addEventListener('keydown', (e) => {
            // Entrée envoie, Maj+Entrée va à la ligne. isComposing : ne pas
            // envoyer en pleine saisie d'un accent composé.
            if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
                e.preventDefault();
                void this.envoyer();
            }
        });

        this.envoyerEl = saisie.appendChild(document.createElement('button'));
        this.envoyerEl.type = 'submit';
        this.envoyerEl.classList.add('agent-bulle-envoyer');
        this.envoyerEl.setAttribute('aria-label', 'Envoyer');
        this.envoyerEl.title = 'Envoyer';
        setIcon(app, this.envoyerEl, 'arrow-up');

        // La poubelle, seulement sur une conversation rouverte depuis la marge.
        this.pied = new PiedSupprimer(app, onSupprimer);
        this.dom.appendChild(this.pied.el);

        // Ce qu'on tape dans la bulle ne doit pas atteindre les raccourcis de
        // l'app (Cmd+Z annulerait un trait d'annotation au lieu d'un mot).
        this.dom.addEventListener('keydown', (e) => e.stopPropagation());
    }

    // ── L'état, vu de l'extérieur ─────────────────────────────────────────

    estOuverte(): boolean {
        return this._loaded;
    }

    /**
     * La conversation, sans la réponse qu'on attend encore : c'est ce que
     * l'historique de la marge garde et rouvre.
     */
    conversation(): Message[] {
        return [...this.filEl.children]
            .filter((el) => !el.classList.contains('is-pending'))
            .map((el) => ({
                auteur: el.classList.contains('mod-moi') ? 'moi' : 'agent',
                texte: el.textContent ?? '',
            }));
    }

    /**
     * Rouvre une conversation gardée dans la marge, SANS la barre : la bulle se
     * pose à droite du trait (`reference`), comme la carte d'un outil, et sort
     * de l'icône cliquée (`depuis`). On relit une discussion, on n'en lance pas
     * une autre : les outils de la barre n'ont rien à y faire.
     */
    rouvrir(contexte: ContexteQuestion, messages: Message[], reference: ReferenceElement, depuis: HTMLElement): void {
        this.fermer();
        this.seule = { reference, depuis };
        this.ouvrir(contexte);
        this.filEl.replaceChildren();
        for (const m of messages) this.ajouterMessage(m.auteur, m.texte);
        this.pied.montrer(true);
    }

    /** Ouverte seule, depuis la marge : sa croix ferme tout, il n'y a pas de barre. */
    estSeule(): boolean {
        return this._loaded && this.seule !== null;
    }

    /** La zone suivie : lue par le calque pour ancrer et surligner. */
    zone(): ContexteQuestion | null {
        return this.contexte;
    }

    // ── Ouvrir, suivre, fermer ────────────────────────────────────────────

    /**
     * Ouvre la bulle sur une zone, ou la déplace sur une nouvelle si elle est
     * déjà ouverte. Le champ prend le focus : on vient de cliquer sur la tête
     * de chat, c'est pour poser une question.
     */
    ouvrir(contexte: ContexteQuestion): void {
        this.contexte = contexte;
        this.extraitEl.textContent = contexte.texte.replace(/\s+/g, ' ').trim();
        this.extraitEl.title = contexte.texte;

        if (!this._loaded) {
            this.ouverture++;
            // Invisible tant qu'elle n'est pas placée : l'éclosion part de sa
            // position FINALE, qu'on ne connaît qu'après le calcul.
            this.dom.style.opacity = '0';
            this.parentEl.appendChild(this.dom);
            this.load();
            const ouverture = this.ouverture;
            void this.placer().then(() => {
                if (!this._loaded || this.ouverture !== ouverture) return;
                // La bulle sort du bouton tête de chat (eclosion.ts).
                this.eclosion = eclore(this.seule?.depuis ?? this.alignEl, this.dom);
            });
        } else {
            void this.placer();
        }
        // preventScroll : le champ est déjà à l'écran, à côté de la barre.
        this.champEl.focus({ preventScroll: true });
    }

    /**
     * Le texte a été édité : la zone a de nouvelles bornes, et peut-être un
     * nouveau contenu (une frappe DANS le passage). La question suivante doit
     * partir avec le texte qu'on voit surligné, pas avec celui d'avant.
     */
    deplacerZone(from: number, to: number, texte: string): void {
        if (!this.contexte) return;
        this.contexte = { ...this.contexte, from, to, texte };
        this.extraitEl.textContent = texte.replace(/\s+/g, ' ').trim();
        this.extraitEl.title = texte;
    }

    fermer(): void {
        this.unload();
    }

    onload(): void {
        // autoUpdate rappelle placer() au scroll de tout ancêtre du bouton, au
        // redimensionnement de la fenêtre et de la bulle elle-même (le fil qui
        // grandit). Quand la barre bouge sans scroll, c'est le calque qui
        // rappelle placer().
        this.register(autoUpdate(this.seule?.reference ?? this.reference, this.dom, () => this.placer()));
    }

    onunload(): void {
        const messages = this.conversation();
        const contexte = this.contexte;
        this.eclosion?.annuler();
        this.eclosion = null;
        this.dom.style.opacity = '';
        this.dom.remove();
        this.filEl.replaceChildren();
        this.champEl.value = '';
        // Pas ajusterChamp() : détaché du DOM, scrollHeight vaut 0 et le champ
        // rouvrirait écrasé. On rend la main au CSS.
        this.champEl.style.height = '';
        this.contexte = null;
        this.pied.montrer(false);
        this.enAttente = false;
        this.seule = null;
        this.envoyerEl.disabled = false;
        this.onFermer(messages, contexte);
    }

    /**
     * Recalcule la position. Public : le calque l'appelle quand la zone bouge
     * sans qu'aucun scroll ni redimensionnement ne le signale (frappe au-dessus,
     * split redimensionné).
     */
    placer(): Promise<void> {
        if (!this._loaded) return Promise.resolve();
        const seule = this.seule;
        return computePosition(seule?.reference ?? this.reference, this.dom, {
            placement: 'right-start',
            strategy: 'absolute',
            middleware: [
                // À 8 px du BORD de la barre, et descendue jusqu'au haut de la
                // tête de chat : ancrer sur le bouton lui-même collerait la
                // bulle au padding de la barre. Seule, elle se tient à 12 px du
                // trait, sur son haut, comme la carte d'un outil.
                offset(() => (seule ? { mainAxis: 12, crossAxis: 0 } : { mainAxis: 8, crossAxis: this.alignEl.offsetTop })),
                flip({ padding: 8, fallbackPlacements: ['left-start'] }),
                shift({ padding: 8 }),
                eviter(this.evitement),
                hide(),
            ],
        }).then(({ x, y, middlewareData }) => {
            // La bulle a pu être fermée pendant le calcul.
            if (!this._loaded) return;
            this.dom.style.left = `${x}px`;
            this.dom.style.top = `${y}px`;
            // La barre est sortie de l'écran avec son passage : on masque la
            // bulle sans la fermer, elle revient avec le texte.
            this.dom.style.visibility = middlewareData.hide?.referenceHidden ? 'hidden' : 'visible';
        });
    }

    // ── La conversation ───────────────────────────────────────────────────

    private async envoyer(): Promise<void> {
        const question = this.champEl.value.trim();
        const contexte = this.contexte;
        if (!question || !contexte || this.enAttente) return;

        this.ajouterMessage('moi', question);
        this.champEl.value = '';
        this.ajusterChamp();

        const ouverture = this.ouverture;
        const estCourante = (): boolean => this._loaded && this.ouverture === ouverture;
        this.enAttente = true;
        this.envoyerEl.disabled = true;
        const reponseEl = this.ajouterMessage('agent', '…');
        reponseEl.classList.add('is-pending');

        try {
            const reponse = await repondre(question, contexte);
            // Fermée pendant l'attente (et peut-être rouverte ailleurs) : cette
            // réponse n'appartient plus à la conversation affichée.
            if (!estCourante()) return;
            reponseEl.textContent = reponse;
        } catch (err) {
            if (!estCourante()) return;
            reponseEl.textContent = `L'agent n'a pas pu répondre : ${err instanceof Error ? err.message : String(err)}`;
            reponseEl.classList.add('is-error');
        } finally {
            // Même garde : sinon l'ancienne réponse débloquerait l'envoi pendant
            // que la question de la NOUVELLE conversation attend encore.
            if (estCourante()) {
                reponseEl.classList.remove('is-pending');
                this.enAttente = false;
                this.envoyerEl.disabled = false;
            }
        }
        if (!estCourante()) return;
        this.filEl.scrollTop = this.filEl.scrollHeight;
    }

    private ajouterMessage(auteur: 'moi' | 'agent', texte: string): HTMLElement {
        const el = this.filEl.appendChild(document.createElement('div'));
        el.classList.add('agent-message', `mod-${auteur}`);
        el.textContent = texte;
        this.filEl.scrollTop = this.filEl.scrollHeight;
        return el;
    }

    /** Le champ grandit avec le texte, jusqu'au plafond fixé en CSS. */
    private ajusterChamp(): void {
        // scrollHeight compte le padding mais pas la bordure : en border-box
        // (agent.css), on rajoute la bordure, sinon le champ grandit d'un cran
        // à chaque envoi.
        this.champEl.style.height = 'auto';
        const bordure = this.champEl.offsetHeight - this.champEl.clientHeight;
        this.champEl.style.height = `${this.champEl.scrollHeight + bordure}px`;
    }
}
