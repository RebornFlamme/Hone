// ═══════════════════════════════════════════════════════════════════════════
//  La couture entre la bulle et le back. La bulle n'appelle QUE cette fonction :
//  quand l'agent existera, c'est ce fichier qu'on remplace, et rien d'autre.
//
//  ⚠️ PROTOTYPE : aucune requête ne part. La réponse est fabriquée ici, pour
//     tester l'affichage (attente, puis réponse) sans dépendre du back.
// ═══════════════════════════════════════════════════════════════════════════

import type { Message } from './traces';

/** Ce que la bulle sait de la zone sur laquelle porte la question. */
export interface ContexteQuestion {
    /** Le texte sélectionné, tel quel. */
    texte: string;
    /** Le document d'où il vient ('' si la vue n'a pas encore de fichier). */
    chemin: string;
    /** La plage d'offsets du texte dans le document, au moment de la question. */
    from: number;
    to: number;
}

/** Le délai simulé, juste assez pour voir l'indicateur d'attente. */
const LATENCE_FACTICE = 700;

/**
 * `historique` : la conversation avant cette question. Elle commence par la
 * réponse d'un outil quand le chat est né de sa carte.
 */
export async function repondre(question: string, contexte: ContexteQuestion, historique: Message[] = []): Promise<string> {
    await new Promise((r) => setTimeout(r, LATENCE_FACTICE));
    const extrait = contexte.texte.length > 60 ? `${contexte.texte.slice(0, 60)}…` : contexte.texte;
    const suite = historique.length > 0 ? ` (après ${historique.length} message${historique.length > 1 ? 's' : ''})` : '';
    return `Réponse factice : le back n'est pas encore branché. `
        + `Question reçue : « ${question} »${suite}, sur « ${extrait} ».`;
}

// ── Les outils de la barre ──────────────────────────────────────────────────

/** Les cinq outils de la barre, par leur identifiant. */
export type Outil = 'definir' | 'visualiser' | 'aider' | 'traduire' | 'resumer';

/** Le délai simulé d'un outil : assez long pour voir le cercle qui tourne. */
const LATENCE_OUTIL = 1500;

/** Ce que chaque outil renverrait, en attendant le back. */
const FACTICE: Record<Outil, string> = {
    definir: 'Définition factice : le back n\'est pas encore branché.',
    visualiser: 'Visualisation factice : frise, mind map ou schéma viendront du back.',
    aider: 'Indice factice : le back donnera des indices successifs, jamais la solution.',
    traduire: 'Traduction factice : le back traduira vers la langue du vault.',
    resumer: 'Résumé factice : le back donnera les points clés de la sélection.',
};

export async function agir(outil: Outil, contexte: ContexteQuestion): Promise<string> {
    await new Promise((r) => setTimeout(r, LATENCE_OUTIL));
    const extrait = contexte.texte.length > 60 ? `${contexte.texte.slice(0, 60)}…` : contexte.texte;
    return `${FACTICE[outil]} Passage : « ${extrait} ».`;
}
