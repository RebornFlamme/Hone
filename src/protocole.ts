// ═══════════════════════════════════════════════════════════════════════════
//  Ce qui passe entre la page (lienAgent.ts) et le processus de l'agent
//  (serveur/agent-serveur.ts). Des types seulement : les deux côtés l'importent,
//  aucun des deux n'embarque le code de l'autre.
// ═══════════════════════════════════════════════════════════════════════════

/** Les cinq outils de la barre, par leur identifiant. */
export type Outil = 'definir' | 'visualiser' | 'aider' | 'traduire' | 'resumer';

/** Un agent par mission. */
export type NomAgent = 'chat' | 'bilan' | Outil;

/** Le passage visé, et le document d'où il vient ('' si la vue n'a pas de fichier). */
export interface Passage {
    texte: string;
    chemin: string;
}

export interface Tour {
    auteur: 'moi' | 'agent';
    texte: string;
}

export type Demande =
    | { agent: 'chat'; passage: Passage; question: string; historique: Tour[] }
    | { agent: 'bilan'; passage: Passage; historique: Tour[] }
    /** `indices` : ceux déjà donnés sur ce passage, pour en donner un plus poussé. */
    | { agent: 'aider'; passage: Passage; indices: string[] }
    | { agent: Exclude<Outil, 'aider'>; passage: Passage };

/** D'où vient une réponse : le symbole que la carte affiche. */
export type Source = 'vault' | 'web' | 'modele';

export interface Sorties {
    chat: { texte: string; source: Source };
    bilan: { texte: string };
    definir: { texte: string; source: Source };
    resumer: { texte: string; source: Source };
    traduire: { texte: string; langue: string };
    /** `stop` : le prochain indice donnerait la solution, l'agent s'arrête là. */
    aider: { texte: string; stop: boolean };
    /** `possible` à false : le passage ne se dessine pas, `raison` dit pourquoi. */
    visualiser: { possible: boolean; svg: string | null; raison: string | null };
}

export type Sortie = Sorties[NomAgent];

/** Page → processus. */
export interface Requete {
    id: number;
    demande: Demande;
}

/** Processus → page. `morceau` : un bout de texte du chat, pour l'afficher en direct. */
export type Retour =
    | { id: number; type: 'morceau'; texte: string }
    | { id: number; type: 'fin'; sortie: Sortie }
    | { id: number; type: 'erreur'; message: string };
