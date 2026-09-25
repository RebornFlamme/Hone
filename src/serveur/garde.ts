import fs from 'node:fs';
import path from 'node:path';

// ═══════════════════════════════════════════════════════════════════════════
//  La garde des chemins : le SEUL passage entre l'agent et le disque. Les
//  outils de lecture n'ouvrent rien qui n'ait traversé `cheminSur`.
//
//  ★ Ce qu'elle refuse, et pourquoi :
//    - un chemin absolu, un octet nul : le modèle n'a pas à choisir d'où il part ;
//    - tout segment qui commence par un point (`..`, `.fragment`, `.git`,
//      `.env`) : `..` sort du vault, et `.fragment/` contient le `.env` de CE
//      plugin (la clé) et les `data.json` des autres ;
//    - un lien symbolique qui mène dehors : on compare les chemins APRÈS
//      `realpath`, pas avant, sinon `notes/lien -> /etc` passe ;
//    - une extension hors liste, un fichier trop gros.
//
//  La logique suit `resolveInside` (app/src/shared/vaultPath.ts) et y ajoute
//  `realpath`, les segments cachés et l'extension.
// ═══════════════════════════════════════════════════════════════════════════

/** Ce que l'agent a le droit de lire. Les PDF viendront à une étape suivante. */
export const EXTENSIONS_LUES = ['.md', '.txt'];

/** Au-delà, un fichier n'est pas une note : on ne l'envoie pas au modèle. */
export const TAILLE_MAX = 2_000_000;

/** Un refus : son message est rendu au modèle tel quel, jamais levé plus haut. */
export class RefusChemin extends Error {}

/** Un segment caché, ou `.` et `..`. */
function segmentInterdit(segment: string): boolean {
    return segment.startsWith('.');
}

function segments(rel: string): string[] {
    return rel.split(/[\\/]+/).filter((s) => s.length > 0);
}

/** `enfant` est `racine` elle-même ou vit dessous (chemins déjà réels). */
function estDans(racine: string, enfant: string): boolean {
    return enfant === racine || enfant.startsWith(racine + path.sep);
}

/**
 * Le chemin réel d'un fichier du vault que l'agent peut lire, ou un refus.
 * `rel` est relatif à la racine du vault, tel que le modèle l'a écrit.
 */
export function cheminSur(racine: string, rel: string): string {
    if (typeof rel !== 'string' || rel.trim() === '') throw new RefusChemin('Chemin vide.');
    if (rel.includes('\0')) throw new RefusChemin('Chemin invalide.');
    if (path.isAbsolute(rel) || /^[a-zA-Z]:/.test(rel)) {
        throw new RefusChemin('Chemin absolu refusé : donne un chemin relatif à la racine du vault.');
    }
    if (segments(rel).some(segmentInterdit)) {
        throw new RefusChemin('Accès refusé : ce chemin sort du vault ou vise un dossier caché.');
    }

    const racineReelle = fs.realpathSync(racine);
    let reel: string;
    try {
        reel = fs.realpathSync(path.resolve(racineReelle, rel));
    } catch {
        throw new RefusChemin(`Aucun fichier à ce chemin : ${rel}`);
    }

    // Après realpath : un lien symbolique ne peut ni sortir ni mener dans un dossier caché.
    if (!estDans(racineReelle, reel)) throw new RefusChemin('Accès refusé : ce chemin sort du vault.');
    if (segments(path.relative(racineReelle, reel)).some(segmentInterdit)) {
        throw new RefusChemin('Accès refusé : ce chemin vise un dossier caché.');
    }

    const stat = fs.statSync(reel);
    if (!stat.isFile()) throw new RefusChemin(`Ce n'est pas un fichier : ${rel}`);
    const ext = path.extname(reel).toLowerCase();
    if (!EXTENSIONS_LUES.includes(ext)) {
        throw new RefusChemin(`Format non lu pour l'instant : ${ext || 'sans extension'} (seulement ${EXTENSIONS_LUES.join(', ')}).`);
    }
    if (stat.size > TAILLE_MAX) throw new RefusChemin('Fichier trop gros pour être lu.');
    return reel;
}

/** Plafond du parcours : un vault énorme ne doit pas bloquer une recherche. */
export const FICHIERS_MAX = 3000;

/**
 * Les fichiers lisibles du vault, en chemins relatifs. Même règles que
 * `cheminSur` : ni dossier caché, ni lien symbolique suivi, ni extension hors liste.
 */
export function fichiersLisibles(racine: string): string[] {
    const racineReelle = fs.realpathSync(racine);
    const trouves: string[] = [];
    const aVoir = [racineReelle];
    while (aVoir.length > 0 && trouves.length < FICHIERS_MAX) {
        const dossier = aVoir.pop()!;
        let entrees: fs.Dirent[];
        try {
            entrees = fs.readdirSync(dossier, { withFileTypes: true });
        } catch {
            continue;
        }
        for (const e of entrees) {
            if (segmentInterdit(e.name) || e.isSymbolicLink()) continue;
            const complet = path.join(dossier, e.name);
            if (e.isDirectory()) aVoir.push(complet);
            else if (e.isFile() && EXTENSIONS_LUES.includes(path.extname(e.name).toLowerCase())) {
                trouves.push(path.relative(racineReelle, complet));
                if (trouves.length >= FICHIERS_MAX) break;
            }
        }
    }
    return trouves.sort();
}
