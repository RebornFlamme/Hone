import fs from 'node:fs';
import { tool } from '@openai/agents';
import { z } from 'zod';
import { cheminSur, fichiersLisibles, RefusChemin } from './garde';

// ═══════════════════════════════════════════════════════════════════════════
//  Les outils de lecture du vault. Deux, et aucun outil d'écriture : l'agent
//  ne peut rien créer ni modifier sur le disque, il ne produit que le texte
//  que le plugin affiche dans ses widgets.
//
//  Un refus (chemin hors du vault, dossier caché, format) est RENDU au modèle
//  comme résultat de l'outil, pas levé : il lit pourquoi, et répond sans.
// ═══════════════════════════════════════════════════════════════════════════

/** Ce qu'un document peut coûter en contexte : au-delà, il est tronqué. */
export const CARACTERES_MAX = 20_000;
const RESULTATS_MAX = 8;
const AVANT = 200;
const APRES = 300;

/** Minuscules et sans accents : « Babbage » trouve « babbage », « entropie » trouve « Entropie ». */
function plier(texte: string): string {
    return texte.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

function lire(racine: string, rel: string): string {
    return fs.readFileSync(cheminSur(racine, rel), 'utf-8');
}

export function chercherDansLeVault(racine: string, requete: string): string {
    const q = plier(requete.trim());
    if (!q) return 'Requête vide.';
    const trouves: { chemin: string; extrait: string }[] = [];
    for (const rel of fichiersLisibles(racine)) {
        let texte: string;
        try {
            texte = lire(racine, rel);
        } catch {
            continue;
        }
        const plie = plier(texte);
        // plier() garde en général la longueur (é précomposé → e) : l'extrait est
        // alors pris dans le vrai texte, accents compris. Sinon, dans le texte plié.
        const source = plie.length === texte.length ? texte : plie;
        const i = plie.indexOf(q);
        const dansLeNom = plier(rel).includes(q);
        if (i === -1 && !dansLeNom) continue;
        trouves.push({
            chemin: rel,
            extrait: i === -1 ? texte.slice(0, APRES) : source.slice(Math.max(0, i - AVANT), i + APRES),
        });
        if (trouves.length >= RESULTATS_MAX) break;
    }
    return trouves.length > 0 ? JSON.stringify(trouves) : 'Aucun résultat dans le vault.';
}

export function lireDocument(racine: string, rel: string): string {
    try {
        const texte = lire(racine, rel);
        return texte.length > CARACTERES_MAX
            ? `${texte.slice(0, CARACTERES_MAX)}\n[… document tronqué à ${CARACTERES_MAX} caractères]`
            : texte;
    } catch (err) {
        if (err instanceof RefusChemin) return `Refusé : ${err.message}`;
        return 'Lecture impossible.';
    }
}

export function outilsVault(racine: string) {
    const searchVault = tool({
        name: 'search_vault',
        description:
            'Cherche un mot ou une expression dans les notes du vault (.md, .txt) et renvoie jusqu\'à 8 extraits '
            + 'avec leur chemin. À utiliser AVANT toute recherche web.',
        parameters: z.object({ requete: z.string().describe('Le mot ou l\'expression à chercher.') }),
        execute: async ({ requete }) => chercherDansLeVault(racine, requete),
    });

    const readDocument = tool({
        name: 'read_document',
        description:
            'Lit le texte d\'une note du vault. Le chemin est relatif à la racine du vault, tel que search_vault '
            + 'le donne. Les dossiers cachés et tout ce qui est hors du vault sont refusés.',
        parameters: z.object({ chemin: z.string().describe('Chemin relatif à la racine du vault.') }),
        execute: async ({ chemin }) => lireDocument(racine, chemin),
    });

    return [searchVault, readDocument];
}
