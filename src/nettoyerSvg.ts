// ═══════════════════════════════════════════════════════════════════════════
//  Le SVG de Visualiser est écrit par le modèle : c'est du texte venu de
//  dehors, que la page va insérer dans son DOM. Et la page a Node : un script
//  qui s'y exécuterait aurait accès au disque. On ne l'insère donc jamais tel
//  quel. On le relit, et on RECONSTRUIT un SVG neuf à partir d'une liste
//  blanche : balises de dessin, attributs de présentation. Tout le reste
//  tombe : script, foreignObject, image, liens, attributs `on*`, url() externes.
// ═══════════════════════════════════════════════════════════════════════════

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Au-delà, ce n'est plus un schéma de carte : on refuse plutôt que de ralentir la page. */
export const SVG_TAILLE_MAX = 60_000;
const ELEMENTS_MAX = 400;

const BALISES = new Set([
    'svg', 'g', 'rect', 'circle', 'ellipse', 'line', 'path', 'polyline', 'polygon',
    'text', 'tspan', 'marker', 'defs', 'title',
]);

const ATTRIBUTS = new Set([
    'viewBox', 'preserveAspectRatio',
    'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height',
    'd', 'points', 'transform', 'dx', 'dy',
    'fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-dasharray',
    'stroke-linecap', 'stroke-linejoin', 'opacity',
    'font-family', 'font-size', 'font-weight', 'font-style', 'text-anchor', 'dominant-baseline',
    'id', 'marker-start', 'marker-mid', 'marker-end',
    'markerWidth', 'markerHeight', 'refX', 'refY', 'orient', 'markerUnits',
]);

/**
 * Une valeur d'attribut acceptable : pas de `url()` sauf vers un marqueur du
 * même SVG (`url(#fleche)`), pas de `javascript:`, pas d'expression.
 */
function valeurSure(valeur: string): boolean {
    const v = valeur.toLowerCase();
    if (/javascript:|data:|expression\(|@import/.test(v)) return false;
    const urls = v.match(/url\(([^)]*)\)/g) ?? [];
    return urls.every((u) => /^url\(\s*['"]?#[\w-]+['"]?\s*\)$/.test(u));
}

function copier(source: Element, compte: { n: number }): Element | null {
    const nom = source.localName;
    if (!BALISES.has(nom) || source.namespaceURI !== SVG_NS) return null;
    if (++compte.n > ELEMENTS_MAX) return null;

    const el = document.createElementNS(SVG_NS, nom);
    for (const attr of Array.from(source.attributes)) {
        if (attr.namespaceURI !== null && attr.namespaceURI !== SVG_NS) continue; // xlink:href, xml:base…
        if (!ATTRIBUTS.has(attr.name) || !valeurSure(attr.value)) continue;
        el.setAttribute(attr.name, attr.value);
    }
    for (const enfant of Array.from(source.childNodes)) {
        if (enfant.nodeType === Node.TEXT_NODE) {
            // Le texte n'est gardé que dans ce qui en affiche : pas de CSS glissé dans un <g>.
            if (nom === 'text' || nom === 'tspan' || nom === 'title') el.appendChild(document.createTextNode(enfant.textContent ?? ''));
        } else if (enfant.nodeType === Node.ELEMENT_NODE) {
            const copie = copier(enfant as Element, compte);
            if (copie) el.appendChild(copie);
        }
    }
    return el;
}

/**
 * Un `<svg>` neuf, sûr à insérer, ou null si la source n'est pas un SVG
 * lisible. Sa taille suit la carte : ni largeur ni hauteur, seulement le viewBox.
 */
export function nettoyerSvg(source: string): SVGSVGElement | null {
    if (source.length > SVG_TAILLE_MAX) return null;
    // Le modèle oublie souvent l'espace de noms : sans lui, rien ne serait du SVG.
    const avecNs = /<svg\b[^>]*\bxmlns=/.test(source) ? source : source.replace(/<svg\b/, `<svg xmlns="${SVG_NS}"`);
    const doc = new DOMParser().parseFromString(avecNs, 'image/svg+xml');
    const racine = doc.documentElement;
    if (!racine || racine.localName !== 'svg' || doc.getElementsByTagName('parsererror').length > 0) return null;

    const svg = copier(racine, { n: 0 }) as SVGSVGElement | null;
    if (!svg) return null;
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.setAttribute('role', 'img');
    return svg;
}
