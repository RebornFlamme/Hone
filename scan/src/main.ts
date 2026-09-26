import { Plugin, App, Modal, Notice } from 'fragment';
import QRCodeStyling from 'qr-code-styling';
import { Relais } from './relais'

// Le site téléphone : GitHub Pages du dossier docs/ de Hone
const SITE_URL = "https://rebornflamme.github.io/Hone/";

// Durée de l'animation de fermeture, la même que dans styles.css
const CLOSE_MS = 140;

export default class ScanPlugin extends Plugin {
    sessionId: string = crypto.randomUUID();          // l'id de la session, créé une fois au chargement du plugin
    relais: Relais |null = null;
    onload(): void {
        if (this.relais === null) {
            this.relais = new Relais(this.sessionId, (connected) => { new Notice(connected ? "Téléphone connecté" : "Téléphone déconnecté") });
            this.relais.connect();
            this.register(() => this.relais?.close());   
        }   
        const button = this.addRibbonIcon('qr-code', 'Scanner une feuille', () => {
            new ScanModal(this.app, `${SITE_URL}#${this.sessionId}`, button).open();
        });
    }
}

class ScanModal extends Modal {
    url: string;
    anchor: HTMLElement;       // l'icône du ribbon d'où sort le widget
    closing = false;

    constructor(app: App, url: string, anchor: HTMLElement) {
        super(app);
        this.url = url;
        this.anchor = anchor;
        // Nos classes à nous : styles.css ne touche qu'à cette fenêtre-là
        this.containerEl.classList.remove('mod-dim');
        this.containerEl.classList.add('scan-popover');
    }

    onOpen(): void {
        this.closing = false;
        this.containerEl.classList.remove('is-closing');
        this.anchor.classList.add('scan-ribbon-open');

        const qrBox = document.createElement('div');
        qrBox.classList.add('scan-qr');
        showQrCode(this.url, qrBox);
        this.contentEl.append(qrBox);

        this.placeNextToAnchor();
    }

    // Pose le widget à droite de l'icône, centré sur elle, sans sortir de l'écran
    placeNextToAnchor(): void {
        const icon = this.anchor.getBoundingClientRect();
        // offsetHeight et pas getBoundingClientRect : la vraie taille, sans le scale de l'animation d'entrée
        const height = this.modalEl.offsetHeight;
        const margin = 8;

        const left = icon.right + 12;
        const iconCenter = icon.top + icon.height / 2;
        const top = Math.min(
            Math.max(iconCenter - height / 2, margin),
            window.innerHeight - height - margin,
        );

        this.modalEl.style.left = `${left}px`;
        this.modalEl.style.top = `${top}px`;
        // La petite pointe et l'origine de l'animation restent en face de l'icône
        this.modalEl.style.setProperty('--scan-anchor-y', `${iconCenter - top}px`);
    }

    // Échap, clic à côté et croix passent tous par close() : on joue l'animation de sortie avant de démonter
    close(): void {
        if (!this._loaded || this.closing) return;
        this.closing = true;
        this.anchor.classList.remove('scan-ribbon-open');

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduceMotion) {
            super.close();
            return;
        }
        this.containerEl.classList.add('is-closing');
        window.setTimeout(() => super.close(), CLOSE_MS);
    }

    onClose(): void {
        this.contentEl.replaceChildren();
    }
}

// Affiche un QR code de `url` à l'intérieur de `container` (repris de la page de test)
function showQrCode(url: string, container: HTMLElement): void {
    const qr = new QRCodeStyling({
        type: "svg",   // net à toutes les tailles d'écran, contrairement au canvas
        width: 200,
        height: 200,
        data: url,
        margin: 8, // zone blanche autour : aide les téléphones à repérer le QR
        dotsOptions: { color: "#16161a", type: "rounded" },
        cornersSquareOptions: { color: "#646cff", type: "extra-rounded" },
        cornersDotOptions: { color: "#646cff" },
        backgroundOptions: { color: "#ffffff" },
    });
    qr.append(container);
}
