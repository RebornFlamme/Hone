import * as fragment from 'fragment';
import { Plugin } from 'fragment';
import { createAgentLayer } from './agentLayer';

// ═══════════════════════════════════════════════════════════════════════════
//  Le plugin « Agent » : une barre qui s'ouvre sur un trait d'annotation, et
//  la conversation qu'elle lance. Il ne fait qu'inscrire un calque ; tout le
//  reste est monté par vue et meurt avec elle.
//
//  Plugin communautaire : il vit dans <vault>/.fragment/plugins/agent/, hors
//  du cœur. Le chargeur (core/plugins.ts) lit main.js et styles.css.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Ce que l'agent attend du cœur et qu'il n'exporte pas encore (fragment.d.ts).
 * Sans eux, le calque planterait à l'ouverture de chaque note, et avec lui le
 * démarrage de l'app : l'agent se retire plutôt, et le dit.
 */
const ATTENDUS = ['WidgetLayer', 'posVisibility', 'hasText'] as const;

export default class AgentPlugin extends Plugin {
    onload(): void {
        const api = fragment as unknown as Record<string, unknown>;
        const manquants = ATTENDUS.filter((nom) => typeof api[nom] !== 'function');
        if (manquants.length > 0) {
            console.error(`[agent] désactivé : le cœur n'exporte pas encore ${manquants.join(', ')} (core/api.ts).`);
            return;
        }
        this.registerLayer({
            id: 'agent',
            name: 'Agent',
            icon: 'message-circle',
            // Activé d'office, contrairement au dessin : il ne s'arme sur rien,
            // il attend un trait d'annotation.
            defaultEnabled: true,
            // Même garde que doc-widget et annotation : pas dans une feuille flottante.
            appliesTo: (view) => view.leaf.parent !== null,
            create: (ctx) => createAgentLayer(ctx),
        });
    }
}
