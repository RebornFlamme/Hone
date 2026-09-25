import fs from 'node:fs';
import { cheminSur, fichiersLisibles } from './garde';

// ═══════════════════════════════════════════════════════════════════════════
//  La langue du vault : celle vers laquelle Traduire traduit. C'est la langue
//  majoritaire des notes, comptée sur leurs mots les plus fréquents, sans
//  appel au modèle. Le français par défaut : l'app est française.
// ═══════════════════════════════════════════════════════════════════════════

export type Langue = 'français' | 'anglais';

const MOTS: Record<Langue, Set<string>> = {
    français: new Set(['le', 'la', 'les', 'des', 'est', 'et', 'une', 'du', 'que', 'qui', 'dans', 'pour', 'pas', 'sur', 'avec', 'sont', 'ce', 'il', 'au']),
    anglais: new Set(['the', 'of', 'and', 'is', 'to', 'in', 'that', 'it', 'for', 'with', 'are', 'on', 'this', 'as', 'be', 'by', 'was', 'from']),
};

/** Combien de mots de chaque langue dans un texte. */
export function compter(texte: string): Record<Langue, number> {
    const total: Record<Langue, number> = { français: 0, anglais: 0 };
    for (const mot of texte.toLowerCase().split(/[^\p{L}]+/u)) {
        if (MOTS.français.has(mot)) total.français += 1;
        if (MOTS.anglais.has(mot)) total.anglais += 1;
    }
    return total;
}

/** Assez de notes pour trancher, pas assez pour ralentir la première traduction. */
const ECHANTILLON = 40;
const CARACTERES_PAR_NOTE = 5000;

let enCache: { racine: string; langue: Langue } | null = null;

export function langueDuVault(racine: string): Langue {
    if (enCache?.racine === racine) return enCache.langue;
    const total: Record<Langue, number> = { français: 0, anglais: 0 };
    for (const rel of fichiersLisibles(racine).slice(0, ECHANTILLON)) {
        try {
            const texte = fs.readFileSync(cheminSur(racine, rel), 'utf-8').slice(0, CARACTERES_PAR_NOTE);
            const n = compter(texte);
            total.français += n.français;
            total.anglais += n.anglais;
        } catch {
            // une note illisible ne vote pas
        }
    }
    const langue: Langue = total.anglais > total.français ? 'anglais' : 'français';
    enCache = { racine, langue };
    return langue;
}
