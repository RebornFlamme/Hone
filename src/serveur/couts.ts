import fs from 'node:fs';
import path from 'node:path';

// ═══════════════════════════════════════════════════════════════════════════
//  Le coût de l'agent, compté en tokens (le prix dépend du modèle, les tokens
//  non). Chaque appel ajoute une ligne à `couts.jsonl`, dans le dossier du
//  plugin (ignoré par git) ; et un plafond par session arrête l'agent avant
//  qu'une boucle ne vide les crédits.
// ═══════════════════════════════════════════════════════════════════════════

export interface Usage {
    inputTokens: number;
    outputTokens: number;
    requests: number;
}

export class Compteur {
    private utilises = 0;

    constructor(
        private readonly journal: string,
        /** Tokens (entrée + sortie) permis pour cette session ; 0 : sans plafond. */
        private readonly plafond: number,
    ) {}

    /** Le message à rendre si le plafond est atteint, sinon null. */
    refus(): string | null {
        if (this.plafond > 0 && this.utilises >= this.plafond) {
            return `Plafond de la session atteint (${this.plafond} tokens). Relance l'app ou monte AGENT_PLAFOND_TOKENS dans le .env du plugin.`;
        }
        return null;
    }

    noter(agent: string, modele: string, usage: Usage): void {
        this.utilises += usage.inputTokens + usage.outputTokens;
        const ligne = {
            date: new Date().toISOString(),
            agent,
            modele,
            entree: usage.inputTokens,
            sortie: usage.outputTokens,
            requetes: usage.requests,
            session: this.utilises,
        };
        try {
            fs.mkdirSync(path.dirname(this.journal), { recursive: true });
            fs.appendFileSync(this.journal, `${JSON.stringify(ligne)}\n`);
        } catch {
            // un journal qui ne s'écrit pas ne doit pas faire échouer la réponse
        }
    }
}
