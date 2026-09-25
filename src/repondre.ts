// ═══════════════════════════════════════════════════════════════════════════
//  La couture entre l'interface et l'agent. La bulle, les cartes et la pilule
//  n'appellent QUE ces fonctions.
//
//  Elles passent par le processus de l'agent (lienAgent.ts), qui tient la clé
//  et parle à OpenAI. Elles répondent en FACTICE, sans aucune requête, quand
//  le plugin n'a pas de .env ou que AGENT_FACTICE=1 : les e2e tournent ainsi
//  sans appel d'API ni crédits.
//
//  ⚠️ `parler` reste factice : la voix passera par Gradium, plus tard.
// ═══════════════════════════════════════════════════════════════════════════

import { lienCourant, type LienAgent } from './lienAgent';
import type { Outil, Passage, Sorties } from './protocole';
import type { Message } from './traces';

export type { Outil } from './protocole';

/** Le lien vers l'agent, ou null pour répondre en factice. */
function lienActif(): LienAgent | null {
    if (process.env.AGENT_FACTICE === '1') return null;
    const lien = lienCourant();
    return lien?.configure() ? lien : null;
}

function passage(contexte: ContexteQuestion): Passage {
    return { texte: contexte.texte, chemin: contexte.chemin };
}

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
    const lien = lienActif();
    if (lien) {
        const sortie = await lien.demander({ agent: 'chat', passage: passage(contexte), question, historique }) as Sorties['chat'];
        return sortie.texte;
    }
    await new Promise((r) => setTimeout(r, LATENCE_FACTICE));
    const extrait = contexte.texte.length > 60 ? `${contexte.texte.slice(0, 60)}…` : contexte.texte;
    const suite = historique.length > 0 ? ` (après ${historique.length} message${historique.length > 1 ? 's' : ''})` : '';
    return `Réponse factice : le back n'est pas encore branché. `
        + `Question reçue : « ${question} »${suite}, sur « ${extrait} ».`;
}

// ── Les outils de la barre ──────────────────────────────────────────────────

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

/**
 * ⚠️ PROVISOIRE : la carte n'affiche encore que du texte. Le symbole de la
 *    source, l'arrêt de l'indice et le dessin de Visualiser viendront avec les
 *    sorties structurées ; en attendant, tout est ramené à une chaîne.
 */
export async function agir(outil: Outil, contexte: ContexteQuestion): Promise<string> {
    const lien = lienActif();
    if (lien) {
        const demande = outil === 'aider'
            ? { agent: outil, passage: passage(contexte), indices: [] }
            : { agent: outil, passage: passage(contexte) };
        const sortie = await lien.demander(demande);
        if (outil === 'visualiser') {
            const v = sortie as Sorties['visualiser'];
            return v.possible ? 'Visuel reçu : son dessin dans la carte arrive à l\'étape suivante.' : (v.raison ?? 'Ce passage ne se prête pas à un visuel.');
        }
        return (sortie as { texte: string }).texte;
    }
    await new Promise((r) => setTimeout(r, LATENCE_OUTIL));
    const extrait = contexte.texte.length > 60 ? `${contexte.texte.slice(0, 60)}…` : contexte.texte;
    return `${FACTICE[outil]} Passage : « ${extrait} ».`;
}

// ── La discussion orale ─────────────────────────────────────────────────────

/** Ce que l'agent répond à voix haute. */
export interface ReponseOrale {
    /** Ce qu'il dit, en texte : lu par la synthèse vocale du système tant que `audio` manque. */
    texte: string;
    /** Sa voix, encodée (mp3, wav, ogg…), telle que le back la renvoie. */
    audio?: ArrayBuffer;
    /** Ce que le back a compris de l'enregistrement, gardé dans l'historique des tours. */
    transcription?: string;
}

/** Le délai simulé d'une réponse orale : assez pour voir l'agent réfléchir. */
const LATENCE_ORALE = 1000;

/**
 * `audio` : ce qu'on vient de dire, enregistré par le micro (un tour de
 * parole). `historique` : les tours d'avant, en texte.
 */
export async function parler(audio: Blob, contexte: ContexteQuestion, historique: Message[] = []): Promise<ReponseOrale> {
    await new Promise((r) => setTimeout(r, LATENCE_ORALE));
    const tour = historique.filter((m) => m.auteur === 'moi').length + 1;
    const extrait = contexte.texte.length > 40 ? `${contexte.texte.slice(0, 40)}…` : contexte.texte;
    return {
        texte: `Réponse orale factice numéro ${tour}. J'ai bien reçu ${audio.size > 0 ? 'ton enregistrement' : 'un enregistrement vide'}, `
            + `sur le passage « ${extrait} ». Le back n'est pas encore branché.`,
        transcription: `Transcription factice du tour ${tour}.`,
    };
}

/** Le délai simulé du bilan : assez pour voir le rond tourner. */
const LATENCE_BILAN = 1200;

/**
 * Le bilan écrit d'une discussion orale, à sa fermeture : les points clés de
 * ce qui s'est dit. `historique` : tous les tours, en texte.
 */
export async function resumerOral(historique: Message[], contexte: ContexteQuestion): Promise<string> {
    const lien = lienActif();
    if (lien) {
        const sortie = await lien.demander({ agent: 'bilan', passage: passage(contexte), historique }) as Sorties['bilan'];
        return sortie.texte;
    }
    await new Promise((r) => setTimeout(r, LATENCE_BILAN));
    const tours = historique.filter((m) => m.auteur === 'moi').length;
    const extrait = contexte.texte.length > 40 ? `${contexte.texte.slice(0, 40)}…` : contexte.texte;
    return `• Bilan factice : le back n'est pas encore branché.\n`
        + `• ${tours} tour${tours > 1 ? 's' : ''} de parole sur « ${extrait} ».\n`
        + `• Le back donnera ici les points clés de la discussion.`;
}
