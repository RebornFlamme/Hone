import { setIcon, type App } from 'fragment';

// ═══════════════════════════════════════════════════════════════════════════
//  Le pied d'une réponse rouverte depuis la marge (traces.ts) : une poubelle.
//  Un clic la remplace par une confirmation, « Annuler » et « Supprimer » en
//  rouge. « Supprimer » retire l'annotation : l'icône de la marge, la réponse
//  gardée et le trait d'encre. C'est le calque (agentLayer) qui le fait.
//
//  ★ POURQUOI une confirmation DANS la carte et pas une boîte du navigateur :
//    une boîte modale bloque la fenêtre, et la carte est non modale ; la
//    question se pose là où l'on a cliqué.
//
//  Le pied est masqué tant qu'on ne l'a pas montré : une réponse qui vient
//  d'arriver n'est pas encore une annotation de la marge.
// ═══════════════════════════════════════════════════════════════════════════

export class PiedSupprimer {

    readonly el: HTMLElement;
    private readonly poubelleEl: HTMLButtonElement;
    private readonly confirmationEl: HTMLElement;
    private readonly annulerEl: HTMLButtonElement;

    constructor(app: App, onSupprimer: () => void) {
        this.el = document.createElement('div');
        this.el.classList.add('agent-pied');
        this.el.hidden = true;

        this.poubelleEl = this.el.appendChild(document.createElement('button'));
        this.poubelleEl.type = 'button';
        this.poubelleEl.classList.add('agent-pied-poubelle');
        this.poubelleEl.setAttribute('aria-label', "Supprimer l'annotation");
        this.poubelleEl.title = "Supprimer l'annotation";
        setIcon(app, this.poubelleEl, 'trash-2');
        this.poubelleEl.addEventListener('click', () => this.confirmer(true));

        this.confirmationEl = this.el.appendChild(document.createElement('div'));
        this.confirmationEl.classList.add('agent-pied-confirmation');
        this.confirmationEl.setAttribute('role', 'group');
        this.confirmationEl.setAttribute('aria-label', "Supprimer l'annotation ?");
        const question = this.confirmationEl.appendChild(document.createElement('span'));
        question.textContent = "Supprimer l'annotation ?";

        this.annulerEl = this.confirmationEl.appendChild(document.createElement('button'));
        this.annulerEl.type = 'button';
        this.annulerEl.classList.add('agent-pied-annuler');
        this.annulerEl.textContent = 'Annuler';
        this.annulerEl.addEventListener('click', () => {
            this.confirmer(false);
            this.poubelleEl.focus();
        });

        const supprimerEl = this.confirmationEl.appendChild(document.createElement('button'));
        supprimerEl.type = 'button';
        supprimerEl.classList.add('agent-pied-supprimer');
        supprimerEl.textContent = 'Supprimer';
        supprimerEl.addEventListener('click', () => onSupprimer());

        // Échap renonce, comme « Annuler ». La carte arrête déjà les touches.
        this.confirmationEl.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;
            this.confirmer(false);
            this.poubelleEl.focus();
        });

        this.confirmer(false);
    }

    /** Montre la poubelle (réponse rouverte depuis la marge) ou masque le pied. */
    montrer(visible: boolean): void {
        this.el.hidden = !visible;
        this.confirmer(false);
    }

    private confirmer(oui: boolean): void {
        this.poubelleEl.hidden = oui;
        this.confirmationEl.hidden = !oui;
        // « Annuler » prend le focus : Entrée par réflexe ne supprime rien.
        if (oui) this.annulerEl.focus();
    }
}
