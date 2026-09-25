import path from 'node:path';
import {
    assistant,
    MaxTurnsExceededError,
    run,
    setDefaultOpenAIKey,
    setTracingDisabled,
    user,
    type AgentInputItem,
    type RunItem,
} from '@openai/agents';
import type { Demande, Requete, Retour, Sortie, Source, Tour } from '../protocole';
import { creerAgents, type Agents } from './agents';
import { Compteur } from './couts';
import { langueDuVault } from './langue';

// ═══════════════════════════════════════════════════════════════════════════
//  Le processus de l'agent. Lancé par le plugin (lienAgent.ts), il tourne à
//  part de la page : c'est LUI qui lit le .env et tient la clé, lui seul qui
//  parle à OpenAI. La page ne voit passer que des demandes et des réponses.
//
//  ★ Pourquoi pas dans la page : la CSP de Fragment n'y laisse pas joindre
//    api.openai.com, une recherche dans le vault y gèlerait l'éditeur, et la
//    clé y serait lisible par tout script de la page.
//
//  Lancé avec : --vault=<racine du vault> --plugin=<dossier du plugin>
// ═══════════════════════════════════════════════════════════════════════════

function argument(nom: string): string {
    const prefixe = `--${nom}=`;
    const arg = process.argv.find((a) => a.startsWith(prefixe));
    if (!arg) throw new Error(`Argument manquant : ${prefixe}`);
    return arg.slice(prefixe.length);
}

const racineVault = argument('vault');
const dossierPlugin = argument('plugin');

try {
    process.loadEnvFile(path.join(dossierPlugin, '.env'));
} catch {
    // pas de .env : chaque demande répondra « clé manquante »
}

const cle = process.env.OPENAI_API_KEY?.trim() ?? '';
// La clé n'a plus à traîner dans l'environnement : un sous-processus éventuel ne l'hériterait pas.
delete process.env.OPENAI_API_KEY;

const modeles = {
    fort: process.env.AGENT_MODELE_FORT?.trim() || 'gpt-5.4',
    leger: process.env.AGENT_MODELE_LEGER?.trim() || 'gpt-5.4-mini',
};
const compteur = new Compteur(
    path.join(dossierPlugin, 'couts.jsonl'),
    Number(process.env.AGENT_PLAFOND_TOKENS ?? 500_000) || 0,
);

setTracingDisabled(true);
let agents: Agents | null = null;
if (cle) {
    setDefaultOpenAIKey(cle);
    agents = creerAgents(racineVault, modeles);
}

/** Les derniers tours seulement : chaque question renvoie tout l'historique, et se paie. */
const TOURS_MAX = 12;

function historique(tours: Tour[]): AgentInputItem[] {
    return tours.slice(-TOURS_MAX).map((t) => (t.auteur === 'moi' ? user(t.texte) : assistant(t.texte)));
}

function citer(demande: Demande): string {
    const { texte, chemin } = demande.passage;
    return `Document ouvert : ${chemin || '(sans fichier)'}\nPassage sélectionné :\n"""\n${texte}\n"""`;
}

function entree(demande: Demande): string | AgentInputItem[] {
    switch (demande.agent) {
        case 'chat':
            return [...historique(demande.historique), user(`${citer(demande)}\n\nQuestion : ${demande.question}`)];
        case 'bilan':
            return `${citer(demande)}\n\nDiscussion :\n${demande.historique
                .map((t) => `${t.auteur === 'moi' ? 'Utilisateur' : 'Agent'} : ${t.texte}`)
                .join('\n')}`;
        case 'aider':
            return `${citer(demande)}\n\n${demande.indices.length > 0
                ? `Indices déjà donnés :\n${demande.indices.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
                : 'Aucun indice donné pour l\'instant.'}`;
        case 'traduire':
            return `${citer(demande)}\n\nLangue cible : ${langueDuVault(racineVault)}.`;
        default:
            return citer(demande);
    }
}

/** D'où vient la réponse, d'après les outils réellement appelés : le web prime, puis le vault. */
function source(items: RunItem[]): Source {
    let vault = false;
    for (const item of items) {
        if (item.type !== 'tool_call_item') continue;
        const brut = item.rawItem as { type: string; name?: string };
        if (brut.type === 'hosted_tool_call' && brut.name === 'web_search_call') return 'web';
        if (brut.type === 'function_call' && (brut.name === 'search_vault' || brut.name === 'read_document')) vault = true;
    }
    return vault ? 'vault' : 'modele';
}

function messagePourUtilisateur(err: unknown): string {
    if (err instanceof MaxTurnsExceededError) return 'Question trop complexe, je n\'arrive pas à y répondre.';
    const msg = String((err as Error)?.message ?? err);
    if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|fetch failed|network/i.test(msg)) {
        return 'Pas de connexion : vérifie ta connexion internet.';
    }
    if (/401|invalid api key|incorrect api key/i.test(msg)) return 'Clé API refusée par OpenAI : vérifie le .env du plugin.';
    if (/429|quota|rate limit/i.test(msg)) return 'Limite ou crédits OpenAI atteints : réessaie plus tard.';
    if (/model.*(not found|does not exist)/i.test(msg)) return 'Modèle introuvable : vérifie AGENT_MODELE_FORT et AGENT_MODELE_LEGER dans le .env.';
    return 'Une erreur est survenue.';
}

function envoyer(retour: Retour): void {
    process.send?.(retour);
}

const MAX_TURNS = { chat: 10, outil: 6 };

/** L'interrupteur du .env : à 1, aucune requête ne part vers OpenAI, quoi qu'il arrive. */
const bloque = process.env.AGENT_BLOQUE?.trim() === '1';

async function traiter({ id, demande }: Requete): Promise<void> {
    if (bloque) {
        envoyer({ id, type: 'erreur', message: 'Agent en pause : aucun appel à OpenAI (AGENT_BLOQUE=1 dans le .env du plugin).' });
        return;
    }
    if (!agents) {
        envoyer({ id, type: 'erreur', message: 'Clé API manquante : ajoute OPENAI_API_KEY dans le .env du plugin.' });
        return;
    }
    const refus = compteur.refus();
    if (refus) {
        envoyer({ id, type: 'erreur', message: refus });
        return;
    }

    const agent = agents[demande.agent];
    const modele = String(agent.model);
    try {
        let sortie: Sortie;
        if (demande.agent === 'chat') {
            const flux = await run(agent, entree(demande), { stream: true, maxTurns: MAX_TURNS.chat });
            for await (const ev of flux) {
                if (ev.type === 'raw_model_stream_event' && ev.data.type === 'output_text_delta') {
                    envoyer({ id, type: 'morceau', texte: ev.data.delta });
                }
            }
            await flux.completed;
            compteur.noter(demande.agent, modele, flux.state.usage);
            sortie = { texte: String(flux.finalOutput ?? ''), source: source(flux.newItems) };
        } else {
            const resultat = await run(agent, entree(demande), { maxTurns: MAX_TURNS.outil });
            compteur.noter(demande.agent, modele, resultat.state.usage);
            const final = resultat.finalOutput as Record<string, unknown> | string | undefined;
            sortie = demande.agent === 'bilan'
                ? { texte: String(final ?? '') }
                : demande.agent === 'definir' || demande.agent === 'resumer'
                    ? { texte: String((final as { texte: string }).texte), source: source(resultat.newItems) }
                    : (final as Sortie);
        }
        envoyer({ id, type: 'fin', sortie });
    } catch (err) {
        // Le détail reste dans le terminal de l'app. OpenAI y recopie un bout de la clé : on l'efface.
        const detail = String((err as Error)?.message ?? err).replace(/sk-[\w*-]+/g, 'sk-…');
        console.error(`[agent] ${demande.agent} :`, detail);
        envoyer({ id, type: 'erreur', message: messagePourUtilisateur(err) });
    }
}

process.on('message', (m) => void traiter(m as Requete));
// Le plugin mort (app fermée, plugin déchargé) : le processus s'en va avec lui.
process.on('disconnect', () => process.exit(0));
