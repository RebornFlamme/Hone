// ═══════════════════════════════════════════════════════════════════════════
//  La couture entre l'interface et l'agent. La bulle, les cartes et la pilule
//  n'appellent QUE ces fonctions.
//
//  Elles passent par le processus de l'agent (lienAgent.ts), qui tient la clé
//  et parle à OpenAI. Elles répondent en FACTICE, sans aucune requête, quand
//  le plugin n'a pas de .env, que AGENT_FACTICE=1 (les e2e tournent ainsi sans
//  crédits), ou que l'agent est en pause (AGENT_BLOQUE=1 dans le .env).
//
//  ⚠️ `parler` reste factice : la voix passera par Gradium, plus tard.
// ═══════════════════════════════════════════════════════════════════════════

import { AgentEnPause, lienCourant, type LienAgent } from './lienAgent';
import type { Outil, Passage, Source, Sorties } from './protocole';
import type { Message } from './traces';

export type { Outil, Source } from './protocole';

/** Le lien vers l'agent, ou null pour répondre en factice. */
function lienActif(): LienAgent | null {
    if (process.env.AGENT_FACTICE === '1') return null;
    const lien = lienCourant();
    return lien?.configure() ? lien : null;
}

/**
 * Par l'agent si on peut, en factice sinon : pas de lien, ou agent en pause.
 * Toute autre erreur remonte, et la carte l'affiche.
 */
async function parAgent<T>(appel: (lien: LienAgent) => Promise<T>, factice: () => Promise<T>): Promise<T> {
    const lien = lienActif();
    if (!lien) return factice();
    try {
        return await appel(lien);
    } catch (err) {
        if (err instanceof AgentEnPause) return factice();
        throw err;
    }
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
export async function repondre(
    question: string, contexte: ContexteQuestion, historique: Message[] = [],
    /** Chaque bout de texte à mesure qu'il arrive : le chat s'écrit en direct. */
    morceau?: (texte: string) => void,
): Promise<string> {
    return parAgent(
        async (lien) => (await lien.demander(
            { agent: 'chat', passage: passage(contexte), question, historique }, morceau,
        ) as Sorties['chat']).texte,
        () => repondreFactice(question, contexte, historique),
    );
}

async function repondreFactice(question: string, contexte: ContexteQuestion, historique: Message[]): Promise<string> {
    await new Promise((r) => setTimeout(r, LATENCE_FACTICE));
    const extrait = contexte.texte.length > 60 ? `${contexte.texte.slice(0, 60)}…` : contexte.texte;
    const suite = historique.length > 0 ? ` (après ${historique.length} message${historique.length > 1 ? 's' : ''})` : '';
    return `Réponse factice : l'agent n'est pas branché ou est en pause. `
        + `Question reçue : « ${question} »${suite}, sur « ${extrait} ».`;
}

// ── Les outils de la barre ──────────────────────────────────────────────────

/**
 * Ce qu'une carte d'outil affiche. `texte` est toujours là : c'est lui que le
 * chat reprend quand la carte devient une conversation.
 */
export interface ReponseOutil {
    texte: string;
    /** Le web : la carte porte un petit globe. */
    source?: Source;
    /** Visualiser : le dessin de l'agent, à nettoyer avant de l'afficher (nettoyerSvg.ts). */
    svg?: string;
    /** Aider : le prochain indice donnerait la solution, l'agent s'arrête là. */
    stop?: boolean;
}

/** Ce que dit l'indice quand il s'arrête, sans appel si un indice d'avant s'est déjà arrêté. */
export const INDICE_STOP = 'Je ne peux plus t\'aider sans te donner la solution. Pose ta question dans le chat si tu es bloqué.';

/**
 * `precedents` : les réponses du même outil déjà données sur ce passage. Aider
 * s'en sert pour donner un indice plus poussé, et ne rappelle pas l'agent s'il
 * s'est déjà arrêté.
 */
export async function agir(outil: Outil, contexte: ContexteQuestion, precedents: ReponseOutil[] = []): Promise<ReponseOutil> {
    if (outil === 'aider' && precedents.some((p) => p.stop)) return { texte: INDICE_STOP, stop: true };

    return parAgent((lien) => agirParAgent(lien, outil, contexte, precedents), () => agirFactice(outil, contexte, precedents));
}

async function agirParAgent(lien: LienAgent, outil: Outil, contexte: ContexteQuestion, precedents: ReponseOutil[]): Promise<ReponseOutil> {
    const demande = outil === 'aider'
        ? { agent: outil, passage: passage(contexte), indices: precedents.map((p) => p.texte) }
        : { agent: outil, passage: passage(contexte) };
    const sortie = await lien.demander(demande);
    switch (outil) {
        case 'visualiser': {
            const v = sortie as Sorties['visualiser'];
            return v.possible && v.svg
                ? { texte: 'Visuel dessiné par l\'agent.', svg: v.svg }
                : { texte: v.raison ?? 'Ce passage ne se prête pas à un visuel.' };
        }
        case 'aider': {
            const a = sortie as Sorties['aider'];
            return a.stop ? { texte: a.texte || INDICE_STOP, stop: true } : { texte: a.texte };
        }
        case 'traduire':
            return { texte: (sortie as Sorties['traduire']).texte };
        default:
            return sortie as Sorties['definir'];
    }
}

// ── Le factice : aucune requête, pour voir l'affichage sans crédits ─────────

/** Le délai simulé d'un outil : assez long pour voir le cercle qui tourne. */
const LATENCE_OUTIL = 1500;

/** Ce que chaque outil renverrait. */
const FACTICE: Record<Outil, string> = {
    definir: 'Définition factice : l\'agent n\'est pas branché.',
    visualiser: 'Visualisation factice.',
    aider: 'Indice factice',
    traduire: 'Traduction factice : l\'agent traduira vers la langue du vault.',
    resumer: 'Résumé factice : l\'agent donnera les points clés de la sélection.',
};

/** Au-delà, l'indice factice s'arrête, comme le ferait l'agent. */
const INDICES_FACTICES = 3;

/** Une petite frise, pour voir le dessin dans la carte sans appeler l'agent. */
const SVG_FACTICE = '<svg viewBox="0 0 320 90" font-family="inherit" font-size="12">'
    + '<line x1="20" y1="45" x2="300" y2="45" stroke="currentColor" stroke-width="2"/>'
    + '<circle cx="40" cy="45" r="6" fill="var(--color-accent)"/><text x="40" y="28" text-anchor="middle" fill="currentColor">1941</text>'
    + '<text x="40" y="72" text-anchor="middle" fill="var(--text-muted)">Z3</text>'
    + '<circle cx="160" cy="45" r="6" fill="var(--color-accent)"/><text x="160" y="28" text-anchor="middle" fill="currentColor">1944</text>'
    + '<text x="160" y="72" text-anchor="middle" fill="var(--text-muted)">Colossus</text>'
    + '<circle cx="280" cy="45" r="6" fill="var(--color-accent)"/><text x="280" y="28" text-anchor="middle" fill="currentColor">1945</text>'
    + '<text x="280" y="72" text-anchor="middle" fill="var(--text-muted)">ENIAC</text></svg>';

async function agirFactice(outil: Outil, contexte: ContexteQuestion, precedents: ReponseOutil[]): Promise<ReponseOutil> {
    await new Promise((r) => setTimeout(r, LATENCE_OUTIL));
    const extrait = contexte.texte.length > 60 ? `${contexte.texte.slice(0, 60)}…` : contexte.texte;
    switch (outil) {
        case 'visualiser':
            return { texte: FACTICE.visualiser, svg: SVG_FACTICE };
        case 'aider':
            return precedents.length >= INDICES_FACTICES
                ? { texte: INDICE_STOP, stop: true }
                : { texte: `${FACTICE.aider} numéro ${precedents.length + 1}, sur « ${extrait} ».` };
        case 'definir':
            return { texte: `${FACTICE.definir} Passage : « ${extrait} ».`, source: 'web' };
        default:
            return { texte: `${FACTICE[outil]} Passage : « ${extrait} ».` };
    }
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
    return parAgent(
        async (lien) => (await lien.demander({ agent: 'bilan', passage: passage(contexte), historique }) as Sorties['bilan']).texte,
        async () => {
            await new Promise((r) => setTimeout(r, LATENCE_BILAN));
            const tours = historique.filter((m) => m.auteur === 'moi').length;
            const extrait = contexte.texte.length > 40 ? `${contexte.texte.slice(0, 40)}…` : contexte.texte;
            return `• Bilan factice : l'agent n'est pas branché ou est en pause.\n`
                + `• ${tours} tour${tours > 1 ? 's' : ''} de parole sur « ${extrait} ».\n`
                + `• L'agent donnera ici les points clés de la discussion.`;
        },
    );
}
