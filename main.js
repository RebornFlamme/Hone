"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => AgentPlugin
});
module.exports = __toCommonJS(main_exports);
var import_fragment9 = require("fragment");

// src/agentLayer.ts
var import_fragment8 = require("fragment");

// src/ActionAgent.ts
var import_fragment2 = require("fragment");

// src/eclosion.ts
var RAIDEUR = 300;
var AMORTISSEMENT = 30;
var RETARD_ETIREMENT = 150;
var FONDU = 140;
var RAYON_BULLE = 12;
var MARGE = 24;
var compteur = 0;
function eclore(bouton, bulle) {
  const sansAnimation = () => {
    bulle.style.opacity = "";
    return { fini: Promise.resolve(), annuler: () => {
    } };
  };
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return sansAnimation();
  const parent = bulle.parentElement;
  if (!parent) return sansAnimation();
  const rb = bulle.getBoundingClientRect();
  const rk = bouton instanceof DOMRect ? bouton : bouton.getBoundingClientRect();
  const dx = parseFloat(bulle.style.left || "0") - rb.left;
  const dy = parseFloat(bulle.style.top || "0") - rb.top;
  const cible = { x: rb.left + dx, y: rb.top + dy, w: rb.width, h: rb.height };
  const d = Math.min(rk.width, rk.height);
  const bouton0 = { x: rk.left + dx + (rk.width - d) / 2, y: rk.top + dy + (rk.height - d) / 2, w: d, h: d };
  const cx = bouton0.x + d / 2;
  const cy = bouton0.y + d / 2;
  const px = Math.min(Math.max(cx, cible.x + d / 2), cible.x + cible.w - d / 2);
  const py = Math.min(Math.max(cy, cible.y + d / 2), cible.y + cible.h - d / 2);
  const depart = { x: px - d / 2, y: py - d / 2, w: d, h: d };
  const gauche = Math.min(bouton0.x, cible.x) - MARGE;
  const haut = Math.min(bouton0.y, cible.y) - MARGE;
  const droite = Math.max(bouton0.x + d, cible.x + cible.w) + MARGE;
  const bas = Math.max(bouton0.y + d, cible.y + cible.h) + MARGE;
  const id = `agent-goo-${++compteur}`;
  const fantome = document.createElement("div");
  fantome.classList.add("agent-eclosion");
  Object.assign(fantome.style, {
    left: `${gauche}px`,
    top: `${haut}px`,
    width: `${droite - gauche}px`,
    height: `${bas - haut}px`,
    filter: `url(#${id})`
  });
  fantome.innerHTML = filtreGoo(id);
  const forme = (r) => {
    const el = fantome.appendChild(document.createElement("div"));
    el.classList.add("agent-eclosion-forme");
    Object.assign(el.style, {
      left: `${r.x - gauche}px`,
      top: `${r.y - haut}px`,
      width: `${r.w}px`,
      height: `${r.h}px`,
      borderRadius: "50%"
    });
    return el;
  };
  forme(bouton0);
  const goutte = forme(depart);
  bulle.style.opacity = "0";
  parent.appendChild(fantome);
  const { easing, duree } = ressort();
  const fuite = goutte.animate(
    [{ translate: `${bouton0.x - depart.x}px ${bouton0.y - depart.y}px` }, { translate: "0px 0px" }],
    { duration: duree, easing, fill: "both" }
  );
  const etirement = goutte.animate(
    [
      { left: `${depart.x - gauche}px`, top: `${depart.y - haut}px`, width: `${d}px`, height: `${d}px`, borderRadius: `${d / 2}px` },
      { left: `${cible.x - gauche}px`, top: `${cible.y - haut}px`, width: `${cible.w}px`, height: `${cible.h}px`, borderRadius: `${RAYON_BULLE}px` }
    ],
    { duration: duree, delay: RETARD_ETIREMENT, easing, fill: "both" }
  );
  const teinte = goutte.animate(
    [{ backgroundColor: getComputedStyle(goutte).backgroundColor }, { backgroundColor: getComputedStyle(bulle).backgroundColor }],
    { duration: duree, delay: RETARD_ETIREMENT, easing: "ease-in", fill: "both" }
  );
  let annule = false;
  const animations = [fuite, etirement, teinte];
  const nettoyer = () => {
    for (const a of animations) a.cancel();
    fantome.remove();
    bulle.style.opacity = "";
  };
  const fini = Promise.all([fuite.finished, etirement.finished, teinte.finished]).then(() => {
    if (annule) return;
    const apparition = bulle.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FONDU, easing: "ease-out" });
    const effacement = fantome.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FONDU, easing: "ease-out", fill: "forwards" });
    animations.push(apparition, effacement);
    bulle.style.opacity = "";
    return Promise.all([apparition.finished, effacement.finished]).then(() => void 0);
  }).catch(() => {
  }).finally(() => {
    if (!annule) nettoyer();
  });
  return {
    fini,
    annuler: () => {
      if (annule) return;
      annule = true;
      nettoyer();
    }
  };
}
function filtreGoo(id) {
  return `<svg width="0" height="0" style="position:absolute"><defs><filter id="${id}"><feGaussianBlur in="SourceGraphic" stdDeviation="4.4" result="blur"/><feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -7" result="goo"/><feBlend in="SourceGraphic" in2="goo"/></filter></defs></svg>`;
}
function ressort(raideur = RAIDEUR, amortissement = AMORTISSEMENT) {
  const dt = 1 / 1e3;
  let x = 0;
  let v = 0;
  const releves = [0];
  let t = 0;
  for (let pas = 0; pas < 2e3; pas++) {
    const a = -raideur * (x - 1) - amortissement * v;
    v += a * dt;
    x += v * dt;
    t += dt;
    if (pas % 10 === 9) releves.push(x);
    if (Math.abs(x - 1) < 1e-3 && Math.abs(v) < 0.01) break;
  }
  releves.push(1);
  return {
    easing: `linear(${releves.map((r) => Math.round(r * 1e3) / 1e3).join(", ")})`,
    duree: Math.round(t * 1e3)
  };
}

// src/placement.ts
var MARGE2 = 8;
var croise = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
function aCote(d) {
  const { ref, largeur: w, hauteur: h, cadre } = d;
  const hautMin = cadre.top + MARGE2;
  const hautMax = cadre.bottom - MARGE2 - h;
  const borneY = (y) => Math.max(hautMin, Math.min(y, hautMax));
  const y0 = borneY(d.haut === "centre" ? (ref.top + ref.bottom) / 2 - h / 2 : d.haut);
  const droite = ref.right + d.ecart;
  const gauche = ref.left - d.ecart - w;
  const boite2 = (x2, y) => ({ left: x2, top: y, right: x2 + w, bottom: y + h });
  const tient = (x2, y) => {
    const b = boite2(x2, y);
    return b.left >= cadre.left + MARGE2 && b.right <= cadre.right - MARGE2 && b.top >= hautMin - 0.5 && b.bottom <= cadre.bottom - MARGE2 + 0.5 && !d.obstacles.some((o) => croise(b, o));
  };
  const candidats = [{ x: droite, y: y0 }, { x: gauche, y: y0 }];
  for (const x2 of [droite, gauche]) {
    for (const o of d.obstacles) {
      if (!croise(boite2(x2, y0), o)) continue;
      candidats.push({ x: x2, y: borneY(o.bottom + MARGE2) }, { x: x2, y: borneY(o.top - MARGE2 - h) });
    }
  }
  const bon = candidats.find((c) => tient(c.x, c.y));
  if (bon) return bon;
  const x = Math.max(cadre.left + MARGE2, Math.min(droite, cadre.right - MARGE2 - w));
  return { x, y: y0 };
}

// src/fenetre.ts
var LARGEUR_MIN = 220;
var HAUTEUR_MIN = 120;
var BORDS = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];
var SEUIL = 4;
var Fenetre = class {
  el;
  repere;
  handle = null;
  /** Vrai dès qu'on l'a déplacée ou agrandie : sa place devient un choix. */
  touchee = false;
  constructor(el, poignee, repere) {
    this.el = el;
    this.repere = repere;
    el.classList.add("agent-widget");
    poignee.classList.add("agent-widget-poignee");
    this.geste(poignee, (e) => {
      if (e.target instanceof Element && e.target.closest("button, input, textarea")) return null;
      return (dx, dy, depart) => this.bornerDeplacement(dx, dy, depart);
    });
    for (const bord of BORDS) {
      const b = el.appendChild(document.createElement("div"));
      b.classList.add("agent-widget-bord", `mod-${bord}`);
      b.setAttribute("aria-hidden", "true");
      this.geste(b, () => (dx, dy, depart) => this.bornerTaille(bord, dx, dy, depart));
    }
  }
  estMontee() {
    return this.handle !== null;
  }
  /**
   * Monte le widget. Avec un cadre gardé, il reprend sa place et sa taille ;
   * sinon `placer` le pose à côté du trait (Repere.aCote).
   */
  monter(cadre, placer) {
    this.retirer();
    this.touchee = cadre !== null;
    if (cadre) this.appliquerTaille(this.plafonner(cadre));
    else {
      this.oublierTaille();
      const p = this.repere.paneClient();
      this.el.style.maxWidth = `${this.repere.ecartDocument(p.width - 2 * MARGE2, 0).dx}px`;
    }
    this.handle = this.repere.monter(this.el, cadre ? () => this.repere.ancreDuCadre(cadre) : placer);
  }
  /** Repose le widget ailleurs (le rond devenu carte, la pilule étirée). */
  ancrer(a) {
    if (a) this.handle?.setAnchor(a);
  }
  /**
   * Le cadre à garder : null si on n'y a pas touché (la prochaine ouverture
   * repart de la place automatique), ou si son texte a disparu (le cœur l'a
   * alors détaché en viewport).
   */
  cadre() {
    const a = this.handle?.getAnchor();
    if (!this.touchee || !a || a.mode !== "document") return null;
    const taille = this.repere.ecartDocument(this.el.offsetWidth, this.el.offsetHeight);
    return { dx: a.dx, dy: a.dy, width: taille.dx, height: taille.dy };
  }
  retirer() {
    this.handle?.remove();
    this.handle = null;
    this.el.remove();
  }
  // ── Les gestes ─────────────────────────────────────────────────────────
  /**
   * Déplacé, le widget reste dans son pane, à MARGE de ses bords : au-delà,
   * le pane le rogne. Seul le geste est borné : le défilement peut
   * l'emporter hors de l'écran avec son texte, comme le texte.
   */
  bornerDeplacement(dx, dy, depart) {
    const p = this.repere.paneClient();
    const x = Math.max(p.left + MARGE2, Math.min(depart.left + dx, p.right - MARGE2 - depart.width));
    const y = Math.max(p.top + MARGE2, Math.min(depart.top + dy, p.bottom - MARGE2 - depart.height));
    return new DOMRect(x, y, depart.width, depart.height);
  }
  /** Tirer le haut ou la gauche déplace le coin : le bord opposé ne bouge pas. */
  bornerTaille(bord, dx, dy, d) {
    const p = this.repere.paneClient();
    const lMin = Math.min(LARGEUR_MIN, d.width);
    const hMin = Math.min(HAUTEUR_MIN, d.height);
    let { left, top, right, bottom } = d;
    if (bord.includes("e")) right = Math.min(Math.max(left + lMin, right + dx), p.right - MARGE2);
    if (bord.includes("s")) bottom = Math.min(Math.max(top + hMin, bottom + dy), p.bottom - MARGE2);
    if (bord.includes("w")) left = Math.max(Math.min(right - lMin, left + dx), p.left + MARGE2);
    if (bord.includes("n")) top = Math.max(Math.min(bottom - hMin, top + dy), p.top + MARGE2);
    return new DOMRect(left, top, right - left, bottom - top);
  }
  /**
   * Un geste au pointeur sur `cible`. `debut` décide au pointerdown si le
   * geste a lieu, et rend la boîte CLIENT voulue pour un déplacement du
   * pointeur. On en déduit le décalage de l'ancre COURANTE (jamais d'une
   * copie : une frappe pendant le geste a pu la remapper) et la taille.
   */
  geste(cible, debut) {
    cible.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || !this.handle) return;
      const transformer = debut(e);
      if (!transformer) return;
      e.preventDefault();
      e.stopPropagation();
      const depart = this.el.getBoundingClientRect();
      const a0 = this.handle.getAnchor();
      const x0 = e.clientX;
      const y0 = e.clientY;
      let parti = false;
      cible.setPointerCapture(e.pointerId);
      const move = (ev) => {
        const dx = ev.clientX - x0;
        const dy = ev.clientY - y0;
        if (!parti && Math.abs(dx) < SEUIL && Math.abs(dy) < SEUIL) return;
        if (!parti) {
          parti = true;
          this.touchee = true;
          this.el.classList.add("is-geste");
        }
        const voulue = transformer(dx, dy, depart);
        const decalage = this.repere.ecartDocument(voulue.left - depart.left, voulue.top - depart.top);
        const a = this.handle?.getAnchor();
        if (!a) return;
        if (voulue.width !== depart.width || voulue.height !== depart.height) {
          const taille = this.repere.ecartDocument(voulue.width, voulue.height);
          this.appliquerTaille({ width: taille.dx, height: taille.dy });
        }
        this.handle?.setAnchor(decaler(a, a0, decalage));
      };
      const fin = (ev) => {
        cible.removeEventListener("pointermove", move);
        cible.removeEventListener("pointerup", fin);
        cible.removeEventListener("pointercancel", fin);
        cible.removeEventListener("lostpointercapture", fin);
        if (cible.hasPointerCapture(ev.pointerId)) cible.releasePointerCapture(ev.pointerId);
        this.el.classList.remove("is-geste");
      };
      cible.addEventListener("pointermove", move);
      cible.addEventListener("pointerup", fin);
      cible.addEventListener("pointercancel", fin);
      cible.addEventListener("lostpointercapture", fin);
    });
  }
  // ── La taille ──────────────────────────────────────────────────────────
  /**
   * Jamais plus grand que son pane : un cadre gardé dans une grande fenêtre
   * peut revenir dans un pane devenu plus étroit (fenêtre réduite, split).
   */
  plafonner(c) {
    const p = this.repere.paneClient();
    const max = this.repere.ecartDocument(p.width - 2 * MARGE2, p.height - 2 * MARGE2);
    return {
      ...c,
      width: Math.min(c.width, Math.max(Math.min(LARGEUR_MIN, c.width), max.dx)),
      height: Math.min(c.height, Math.max(Math.min(HAUTEUR_MIN, c.height), max.dy))
    };
  }
  appliquerTaille(t) {
    this.el.classList.add("is-cadre");
    this.el.style.maxWidth = "none";
    this.el.style.width = `${t.width}px`;
    this.el.style.height = `${t.height}px`;
  }
  oublierTaille() {
    this.el.classList.remove("is-cadre");
    this.el.style.width = "";
    this.el.style.height = "";
    this.el.style.maxWidth = "";
  }
};
function decaler(a, a0, d) {
  if (a.mode === "viewport" && a0.mode === "viewport") return { ...a, x: a0.x + d.dx, y: a0.y + d.dy };
  if (a.mode === "document" && a0.mode === "document") return { ...a, dx: a0.dx + d.dx, dy: a0.dy + d.dy };
  return a;
}

// src/repondre.ts
var LATENCE_FACTICE = 700;
async function repondre(question, contexte, historique = []) {
  await new Promise((r) => setTimeout(r, LATENCE_FACTICE));
  const extrait = contexte.texte.length > 60 ? `${contexte.texte.slice(0, 60)}\u2026` : contexte.texte;
  const suite = historique.length > 0 ? ` (apr\xE8s ${historique.length} message${historique.length > 1 ? "s" : ""})` : "";
  return `R\xE9ponse factice : le back n'est pas encore branch\xE9. Question re\xE7ue : \xAB ${question} \xBB${suite}, sur \xAB ${extrait} \xBB.`;
}
var LATENCE_OUTIL = 1500;
var FACTICE = {
  definir: "D\xE9finition factice : le back n'est pas encore branch\xE9.",
  visualiser: "Visualisation factice : frise, mind map ou sch\xE9ma viendront du back.",
  aider: "Indice factice : le back donnera des indices successifs, jamais la solution.",
  traduire: "Traduction factice : le back traduira vers la langue du vault.",
  resumer: "R\xE9sum\xE9 factice : le back donnera les points cl\xE9s de la s\xE9lection."
};
async function agir(outil, contexte) {
  await new Promise((r) => setTimeout(r, LATENCE_OUTIL));
  const extrait = contexte.texte.length > 60 ? `${contexte.texte.slice(0, 60)}\u2026` : contexte.texte;
  return `${FACTICE[outil]} Passage : \xAB ${extrait} \xBB.`;
}
var LATENCE_ORALE = 1e3;
async function parler(audio, contexte, historique = []) {
  await new Promise((r) => setTimeout(r, LATENCE_ORALE));
  const tour = historique.filter((m) => m.auteur === "moi").length + 1;
  const extrait = contexte.texte.length > 40 ? `${contexte.texte.slice(0, 40)}\u2026` : contexte.texte;
  return {
    texte: `R\xE9ponse orale factice num\xE9ro ${tour}. J'ai bien re\xE7u ${audio.size > 0 ? "ton enregistrement" : "un enregistrement vide"}, sur le passage \xAB ${extrait} \xBB. Le back n'est pas encore branch\xE9.`,
    transcription: `Transcription factice du tour ${tour}.`
  };
}
var LATENCE_BILAN = 1200;
async function resumerOral(historique, contexte) {
  await new Promise((r) => setTimeout(r, LATENCE_BILAN));
  const tours = historique.filter((m) => m.auteur === "moi").length;
  const extrait = contexte.texte.length > 40 ? `${contexte.texte.slice(0, 40)}\u2026` : contexte.texte;
  return `\u2022 Bilan factice : le back n'est pas encore branch\xE9.
\u2022 ${tours} tour${tours > 1 ? "s" : ""} de parole sur \xAB ${extrait} \xBB.
\u2022 Le back donnera ici les points cl\xE9s de la discussion.`;
}

// src/supprimer.ts
var import_fragment = require("fragment");
var PiedSupprimer = class {
  el;
  poubelleEl;
  confirmationEl;
  annulerEl;
  /** La tête de chat : absente du pied d'un chat, qui est déjà une conversation. */
  discuterEl = null;
  poubelle = false;
  discuter = false;
  constructor(app, onSupprimer, onDiscuter) {
    this.el = document.createElement("div");
    this.el.classList.add("agent-pied");
    this.el.hidden = true;
    this.poubelleEl = this.el.appendChild(document.createElement("button"));
    this.poubelleEl.type = "button";
    this.poubelleEl.classList.add("agent-pied-bouton", "agent-pied-poubelle");
    this.poubelleEl.setAttribute("aria-label", "Supprimer l'annotation");
    this.poubelleEl.title = "Supprimer l'annotation";
    (0, import_fragment.setIcon)(app, this.poubelleEl, "trash-2");
    this.poubelleEl.addEventListener("click", () => this.confirmer(true));
    this.confirmationEl = this.el.appendChild(document.createElement("div"));
    this.confirmationEl.classList.add("agent-pied-confirmation");
    this.confirmationEl.setAttribute("role", "group");
    this.confirmationEl.setAttribute("aria-label", "Supprimer l'annotation ?");
    const question = this.confirmationEl.appendChild(document.createElement("span"));
    question.textContent = "Supprimer l'annotation ?";
    this.annulerEl = this.confirmationEl.appendChild(document.createElement("button"));
    this.annulerEl.type = "button";
    this.annulerEl.classList.add("agent-pied-annuler");
    this.annulerEl.textContent = "Annuler";
    this.annulerEl.addEventListener("click", () => {
      this.confirmer(false);
      this.poubelleEl.focus();
    });
    const supprimerEl = this.confirmationEl.appendChild(document.createElement("button"));
    supprimerEl.type = "button";
    supprimerEl.classList.add("agent-pied-supprimer");
    supprimerEl.textContent = "Supprimer";
    supprimerEl.addEventListener("click", () => onSupprimer());
    if (onDiscuter) {
      const el = this.el.appendChild(document.createElement("button"));
      el.type = "button";
      el.classList.add("agent-pied-bouton", "agent-pied-discuter");
      el.setAttribute("aria-label", "Discuter de cette r\xE9ponse");
      el.title = "Discuter de cette r\xE9ponse";
      (0, import_fragment.setIcon)(app, el, "cat");
      el.addEventListener("click", () => onDiscuter());
      this.discuterEl = el;
    }
    this.confirmationEl.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      this.confirmer(false);
      this.poubelleEl.focus();
    });
    this.confirmer(false);
  }
  /** Montre ou masque la poubelle (réponse rouverte depuis la marge). */
  montrer(visible) {
    this.poubelle = visible;
    this.confirmer(false);
  }
  /** Montre ou masque la tête de chat (réponse arrivée, pas en erreur). */
  montrerDiscuter(visible) {
    this.discuter = visible;
    this.confirmer(false);
  }
  confirmer(oui) {
    this.el.hidden = !this.poubelle && !(this.discuter && this.discuterEl);
    this.poubelleEl.hidden = oui || !this.poubelle;
    if (this.discuterEl) this.discuterEl.hidden = oui || !this.discuter;
    this.confirmationEl.hidden = !oui;
    if (oui) this.annulerEl.focus();
  }
};

// src/ActionAgent.ts
var OUTILS = {
  definir: { icone: "book-a", libelle: "D\xE9finir" },
  visualiser: { icone: "chart-network", libelle: "Visualiser" },
  aider: { icone: "lightbulb", libelle: "Aider" },
  traduire: { icone: "languages", libelle: "Traduire" },
  resumer: { icone: "list", libelle: "R\xE9sumer" }
};
var BILAN = { icone: "mic", libelle: "Bilan" };
var RAIDEUR2 = 700;
var AMORTISSEMENT2 = 48;
var ActionAgent = class extends import_fragment2.Component {
  cercleEl;
  carteEl;
  iconeCercleEl;
  iconeCarteEl;
  titreEl;
  corpsEl;
  pied;
  /** La carte en widget du cœur (fenetre.ts). */
  fenetre;
  /** Le rond en widget du cœur, le temps que l'agent réfléchit. */
  rond = null;
  /** Le numéro du lancement en cours : une réponse d'un lancement fermé est ignorée. */
  lancement = 0;
  /** Le cadre de la carte, relevé juste avant son retrait : le calque le lit à la fermeture. */
  cadreFerme = null;
  animations = [];
  /** Ce que montre la carte, lu par le calque à la fermeture. */
  montre = null;
  app;
  repere;
  onFermer;
  constructor(app, repere, onFermer, onSupprimer, onDiscuter) {
    super();
    this.app = app;
    this.repere = repere;
    this.onFermer = onFermer;
    this.cercleEl = document.createElement("div");
    this.cercleEl.classList.add("agent-action-cercle");
    this.cercleEl.setAttribute("role", "status");
    this.iconeCercleEl = this.cercleEl.appendChild(document.createElement("span"));
    this.iconeCercleEl.classList.add("agent-action-icone");
    this.cercleEl.insertAdjacentHTML(
      "beforeend",
      '<svg class="agent-action-arc" viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="28" pathLength="100"/></svg>'
    );
    this.carteEl = document.createElement("div");
    this.carteEl.classList.add("agent-action-carte");
    this.carteEl.setAttribute("role", "dialog");
    const tete = this.carteEl.appendChild(document.createElement("div"));
    tete.classList.add("agent-action-tete");
    this.iconeCarteEl = tete.appendChild(document.createElement("span"));
    this.iconeCarteEl.classList.add("agent-action-icone");
    this.titreEl = tete.appendChild(document.createElement("span"));
    this.titreEl.classList.add("agent-action-titre");
    const fermerEl = tete.appendChild(document.createElement("button"));
    fermerEl.type = "button";
    fermerEl.classList.add("agent-bulle-fermer");
    fermerEl.setAttribute("aria-label", "Fermer");
    fermerEl.title = "Fermer";
    (0, import_fragment2.setIcon)(app, fermerEl, "x");
    fermerEl.addEventListener("click", () => this.fermer());
    this.corpsEl = this.carteEl.appendChild(document.createElement("div"));
    this.corpsEl.classList.add("agent-action-corps");
    this.corpsEl.setAttribute("aria-live", "polite");
    this.pied = new PiedSupprimer(app, onSupprimer, onDiscuter);
    this.carteEl.appendChild(this.pied.el);
    this.fenetre = new Fenetre(this.carteEl, tete, repere);
    this.carteEl.addEventListener("keydown", (e) => e.stopPropagation());
  }
  estOuverte() {
    return this._loaded;
  }
  /** La réponse que la carte montre, ou null (l'agent réfléchit encore, ou a échoué). */
  resultat() {
    return this.montre;
  }
  /**
   * La boîte client de la tête de chat du pied, à lire AVANT de fermer la
   * carte : le chat qui la remplace sort de là (eclosion.ts).
   */
  boutonDiscuter() {
    return this.pied.discuterEl?.getBoundingClientRect() ?? this.carteEl.getBoundingClientRect();
  }
  /** Où la carte a été posée et à quelle taille, null si on n'y a pas touché. */
  cadre() {
    return this.fenetre.estMontee() ? this.fenetre.cadre() : this.cadreFerme;
  }
  /**
   * Lance `outil` sur le passage. `depuis` est la boîte CLIENT de la barre,
   * juste avant qu'elle ne soit retirée : le rond en sort.
   */
  lancer(outil, contexte, depuis) {
    this.attendre(
      OUTILS[outil],
      depuis,
      agir(outil, contexte),
      (texte) => ({ type: "outil", outil, texte })
    );
  }
  /**
   * Le bilan d'une discussion orale : `depuis` est la boîte CLIENT de la
   * pilule, juste avant son retrait. Le rond du micro en sort.
   */
  lancerBilan(contexte, messages, depuis) {
    this.attendre(
      BILAN,
      depuis,
      resumerOral(messages, contexte),
      (texte) => ({ type: "oral", messages, texte }),
      "Bilan indisponible."
    );
  }
  /** Le rond tourne pendant `reponse`, puis s'ouvre en carte. */
  attendre(aspect, depuis, reponse, resultat, texteSiErreur) {
    this.cercleEl.setAttribute("aria-label", `${aspect.libelle} : l'agent r\xE9fl\xE9chit`);
    this.preparer(aspect);
    if (texteSiErreur !== void 0) this.montre = resultat(texteSiErreur);
    this.lancement++;
    const lancement = this.lancement;
    const estCourant = () => this._loaded && this.lancement === lancement;
    this.cercleEl.style.opacity = "0";
    this.load();
    this.rond = this.repere.monter(this.cercleEl, (el) => this.repere.aCote(el));
    this.animations.push(resorber(depuis, this.cercleEl));
    reponse.then((texte) => {
      if (!estCourant()) return;
      this.montre = resultat(texte);
      this.ouvrirCarte(texte, false);
    }).catch((err) => {
      if (estCourant()) {
        if (texteSiErreur !== void 0) this.montre = resultat(texteSiErreur);
        this.ouvrirCarte(`L'agent n'a pas pu r\xE9pondre : ${err instanceof Error ? err.message : String(err)}`, true);
      }
    });
  }
  /**
   * Rouvre une réponse déjà reçue (une icône de l'historique, traces.ts) :
   * pas de rond, la carte sort directement de l'icône.
   */
  montrer(outil, texte, depuis, cadre) {
    this.preparer(OUTILS[outil]);
    this.pied.montrer(true);
    this.pied.montrerDiscuter(true);
    this.montre = { type: "outil", outil, texte };
    this.corpsEl.textContent = texte;
    this.lancement++;
    this.carteEl.style.opacity = "0";
    this.load();
    this.fenetre.monter(cadre, (el) => {
      const trait = this.repere.boiteTrait();
      return this.repere.aCote(el, { haut: trait?.top ?? "centre", evites: [trait] });
    });
    this.animations.push(eclore(depuis, this.carteEl));
  }
  fermer() {
    this.unload();
  }
  /** L'icône et le nom (de l'outil, ou du bilan) sur le rond et la carte, le corps vidé. */
  preparer({ icone, libelle }) {
    (0, import_fragment2.setIcon)(this.app, this.iconeCercleEl, icone);
    (0, import_fragment2.setIcon)(this.app, this.iconeCarteEl, icone);
    this.titreEl.textContent = libelle;
    this.carteEl.setAttribute("aria-label", libelle);
    this.corpsEl.textContent = "";
    this.corpsEl.classList.remove("is-error");
    this.pied.montrer(false);
    this.pied.montrerDiscuter(false);
    this.montre = null;
  }
  onunload() {
    for (const a of this.animations) a.annuler();
    this.animations = [];
    this.cadreFerme = this.fenetre.estMontee() ? this.fenetre.cadre() : null;
    this.retirerRond();
    this.fenetre.retirer();
    this.cercleEl.classList.remove("is-fini");
    this.cercleEl.style.opacity = "";
    this.carteEl.style.opacity = "";
    this.onFermer();
  }
  retirerRond() {
    this.rond?.remove();
    this.rond = null;
    this.cercleEl.remove();
  }
  /** Le rond s'ouvre en carte : la goutte du chat (eclosion.ts), depuis le rond. */
  ouvrirCarte(texte, erreur) {
    this.corpsEl.textContent = texte;
    this.corpsEl.classList.toggle("is-error", erreur);
    this.pied.montrerDiscuter(!erreur);
    this.carteEl.style.opacity = "0";
    const lancement = this.lancement;
    const rond = this.repere.boiteDe(this.cercleEl);
    this.fenetre.monter(null, (el) => this.repere.aCote(el, {
      haut: rond?.top ?? "centre",
      evites: [this.repere.boiteTrait()]
    }));
    this.cercleEl.classList.add("is-fini");
    const eclosion = eclore(this.cercleEl, this.carteEl);
    this.animations.push(eclosion);
    void eclosion.fini.then(() => {
      if (this._loaded && this.lancement === lancement) this.retirerRond();
    });
  }
};
function resorber(depuis, cercle) {
  const montrer = () => {
    cercle.style.opacity = "";
  };
  const parent = cercle.parentElement;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !parent) {
    montrer();
    return { fini: Promise.resolve(), annuler: () => {
    } };
  }
  const rc = cercle.getBoundingClientRect();
  const dx = parseFloat(cercle.style.left || "0") - rc.left;
  const dy = parseFloat(cercle.style.top || "0") - rc.top;
  const forme = document.createElement("div");
  forme.classList.add("agent-action-forme");
  parent.appendChild(forme);
  const { easing, duree } = ressort(RAIDEUR2, AMORTISSEMENT2);
  const anim = forme.animate(
    [
      { left: `${depuis.left + dx}px`, top: `${depuis.top + dy}px`, width: `${depuis.width}px`, height: `${depuis.height}px`, borderRadius: "10px" },
      { left: `${rc.left + dx}px`, top: `${rc.top + dy}px`, width: `${rc.width}px`, height: `${rc.height}px`, borderRadius: `${rc.width / 2}px` }
    ],
    { duration: duree, easing, fill: "both" }
  );
  let annule = false;
  const fini = anim.finished.then(() => {
    if (annule) return;
    forme.remove();
    montrer();
    cercle.firstElementChild?.animate(
      [{ opacity: 0, scale: "0.5" }, { opacity: 1, scale: "1" }],
      { duration: 140, easing: "cubic-bezier(0.2, 0.9, 0.3, 1.2)" }
    );
  }).catch(() => {
  });
  return {
    fini,
    annuler: () => {
      annule = true;
      anim.cancel();
      forme.remove();
      montrer();
    }
  };
}

// src/annotation.ts
function brancherAnnotation(app, paneEl, chemin) {
  const interne = app;
  const source = interne.plugins?.plugins?.get("annotation")?.source;
  const vus = /* @__PURE__ */ new Set();
  const connaitre = () => {
    for (const s of source?.strokes(chemin()) ?? []) vus.add(s.id);
  };
  connaitre();
  const abonnes = [];
  const ref = source?.on("change", (path) => {
    if (path !== chemin()) return;
    const neuf = source.strokes(path).filter((s) => !vus.has(s.id)).at(-1);
    connaitre();
    if (neuf) for (const cb of abonnes) cb(path, neuf);
  });
  let suspendu = false;
  const bloquer = (e) => {
    if (!suspendu || !(e.target instanceof Element) || !e.target.closest(".annotation-surface")) return;
    e.preventDefault();
    e.stopPropagation();
  };
  paneEl.addEventListener("pointerdown", bloquer, true);
  return {
    surTraitPose: (cb) => {
      abonnes.push(cb);
    },
    effacer: (path, id) => source?.erase(path, id),
    // Demande 2 : la barre d'annotation est la Toolbar du pane qui n'est pas
    // celle de l'agent.
    barre: () => paneEl.querySelector(".toolbar:not(.agent-barre)")?.getBoundingClientRect() ?? null,
    suspendre: (oui) => {
      suspendu = oui;
      paneEl.classList.toggle("agent-occupe", oui);
    },
    connaitre,
    detruire: () => {
      ref?.off();
      paneEl.removeEventListener("pointerdown", bloquer, true);
      paneEl.classList.remove("agent-occupe");
    }
  };
}

// src/BarreAgent.ts
var import_fragment3 = require("fragment");

// src/rallonge.ts
var RAIDEUR3 = 520;
var AMORTISSEMENT3 = 38;
var RETARD = 70;
var CASCADE = 35;
var APPARITION = 220;
function rallonger(barre, plus, nouveaux) {
  const avant = barre.offsetHeight;
  plus.style.display = "none";
  for (const el of nouveaux) el.hidden = false;
  const apres = barre.offsetHeight;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || apres <= avant) {
    return { fini: Promise.resolve(), annuler: () => {
    } };
  }
  const { easing, duree } = ressort(RAIDEUR3, AMORTISSEMENT3);
  barre.style.boxSizing = "border-box";
  barre.style.overflow = "hidden";
  const hauteur = barre.animate(
    [{ height: `${avant}px` }, { height: `${apres}px` }],
    { duration: duree, easing }
  );
  const apparitions = nouveaux.map((el, i) => el.animate(
    [
      { opacity: 0, scale: "0.5", filter: "blur(4px)" },
      { opacity: 1, scale: "1", filter: "blur(0px)" }
    ],
    { duration: APPARITION, delay: RETARD + i * CASCADE, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "backwards" }
  ));
  const animations = [hauteur, ...apparitions];
  let annule = false;
  const nettoyer = () => {
    for (const a of animations) a.cancel();
    barre.style.boxSizing = "";
    barre.style.overflow = "";
  };
  const fini = Promise.all(animations.map((a) => a.finished)).then(() => void 0).catch(() => {
  }).finally(() => {
    if (!annule) nettoyer();
  });
  return {
    fini,
    annuler: () => {
      if (annule) return;
      annule = true;
      nettoyer();
    }
  };
}

// src/BarreAgent.ts
var BarreAgent = class extends import_fragment3.Component {
  /** La racine de la Toolbar, lue par le calque (le rond en sort). */
  get dom() {
    return this.toolbar.dom;
  }
  /** La tête de chat : le chat s'aligne sur elle et en sort. */
  chatEl;
  toolbar;
  hote;
  handle = null;
  repere;
  actions;
  rallonge = null;
  /** Vrai pendant cacher() : le démontage ne prévient pas le calque. */
  silencieux = false;
  /** Vrai pendant que l'agent retire lui-même la Toolbar : ce n'est pas Échap. */
  enRetrait = false;
  plus;
  caches = [];
  constructor(repere, actions) {
    super();
    this.repere = repere;
    this.actions = actions;
    this.hote = document.createElement("div");
    this.hote.classList.add("agent-barre-hote");
    this.toolbar = new import_fragment3.Toolbar(this.hote);
    this.toolbar.dom.classList.add("agent-barre");
    this.toolbar.dom.setAttribute("role", "toolbar");
    this.toolbar.dom.setAttribute("aria-orientation", "vertical");
    this.toolbar.dom.setAttribute("aria-label", "Agent");
    this.toolbar.setOrientation("vertical").setColumns(1);
    this.toolbar.addItem((i) => {
      i.setIcon("x").setTooltip("Fermer").onClick(() => this.fermer());
      i.dom.classList.add("agent-barre-fermer");
    });
    this.toolbar.addItem((i) => {
      i.setIcon("cat").setTooltip("Discuter avec l'agent").onClick(() => this.actions.onChat());
      i.dom.classList.add("agent-barre-bouton");
      this.chatEl = i.dom;
    });
    this.toolbar.addItem((i) => {
      i.setIcon("mic").setTooltip("Parler \xE0 l'agent").onClick(() => this.actions.onVoix());
      i.dom.classList.add("agent-barre-bouton");
    });
    const outil = (id) => {
      let item;
      this.toolbar.addItem((i) => {
        item = i.setIcon(OUTILS[id].icone).setTooltip(OUTILS[id].libelle).onClick(() => this.actions.onOutil(id));
        i.dom.classList.add("agent-barre-bouton");
      });
      return item;
    };
    outil("definir");
    outil("visualiser");
    for (const id of ["aider", "traduire", "resumer"]) {
      const item = outil(id);
      item.dom.hidden = true;
      this.caches.push(item);
    }
    this.toolbar.addItem((i) => {
      this.plus = i.setIcon("ellipsis").setTooltip("Plus d'outils").onClick(() => this.allonger());
      i.dom.classList.add("agent-barre-plus");
    });
    this.toolbar.onHide(() => {
      if (this._loaded && !this.enRetrait) this.fermer();
    });
    this.toolbar.dom.addEventListener("keydown", (e) => e.stopPropagation());
  }
  estOuverte() {
    return this._loaded;
  }
  /** Montre la barre à côté du trait courant (Repere). */
  montrer() {
    if (this._loaded) this.retirerHote();
    this.load();
    this.handle = this.repere.monter(this.hote, () => {
      this.toolbar.showAtPosition(0, 0);
      const a = this.repere.aCote(this.toolbar.dom);
      return a && a.mode === "document" ? { ...a, dx: a.dx - DECALAGE, dy: a.dy - DECALAGE } : a;
    });
  }
  fermer() {
    this.unload();
  }
  /**
   * Retire la barre SANS la fermer au sens du calque : un outil prend sa
   * place, le passage reste visé. onFermer n'est pas appelé.
   */
  cacher() {
    this.silencieux = true;
    this.unload();
    this.silencieux = false;
  }
  onunload() {
    this.replier();
    this.retirerHote();
    if (!this.silencieux) this.actions.onFermer();
  }
  retirerHote() {
    this.enRetrait = true;
    this.toolbar.hide();
    this.enRetrait = false;
    this.handle?.remove();
    this.handle = null;
    this.hote.remove();
  }
  /** « … » : la barre s'allonge vers le bas et montre les autres outils, puis « … » s'en va. */
  allonger() {
    if (this.rallonge) return;
    const rallonge = rallonger(this.toolbar.dom, this.plus.dom, this.caches.map((i) => i.dom));
    this.rallonge = rallonge;
    void rallonge.fini.then(() => {
      if (this.rallonge === rallonge) this.plus.dom.hidden = true;
    });
  }
  /** La barre est réutilisée d'un trait à l'autre : elle rouvre courte. */
  replier() {
    this.rallonge?.annuler();
    this.rallonge = null;
    for (const i of this.caches) i.dom.hidden = true;
    this.plus.dom.hidden = false;
    this.plus.dom.style.display = "";
  }
};
var DECALAGE = 8;

// src/BulleAgent.ts
var import_fragment4 = require("fragment");
var BulleAgent = class extends import_fragment4.Component {
  /** La racine, montée dans le pane à l'ouverture, retirée à la fermeture. */
  dom;
  extraitEl;
  filEl;
  champEl;
  envoyerEl;
  /** Le micro de la saisie : seulement sur une discussion orale, qu'il reprend. */
  microEl;
  pied;
  /** Le widget du cœur qui porte la bulle (fenetre.ts). */
  fenetre;
  /** La zone sur laquelle porte la conversation, `null` bulle fermée. */
  contexte = null;
  enAttente = false;
  /**
   * Le numéro de l'ouverture en cours. Une réponse ne sait pas annuler sa
   * requête : fermée puis rouverte pendant l'attente, la bulle recevrait la
   * réponse de l'ANCIENNE conversation. Chaque réponse compare donc le numéro
   * de son ouverture à celui-ci avant de toucher à quoi que ce soit.
   */
  ouverture = 0;
  /** L'animation d'ouverture en cours, à annuler si on ferme pendant. */
  eclosion = null;
  repere;
  /** La barre et sa tête de chat : la bulle se pose à côté, alignée sur le bouton. */
  barre;
  /**
   * Une conversation rouverte depuis la marge (voir rouvrir()) : la bulle se
   * tient seule contre le trait, sans la barre, et sort de `depuis`. null
   * pour une bulle ouverte par la tête de chat de la barre.
   */
  seule = null;
  /** L'outil dont la conversation continue la réponse, null pour un chat né de la barre. */
  origine = null;
  /**
   * Le bilan d'une discussion orale relue par écrit, null sinon. Posé en
   * tête du fil, et rendu au calque à la fermeture : la trace reste orale.
   */
  bilan = null;
  /**
   * Prévenu à chaque fermeture, avec la conversation et son passage tels
   * qu'ils étaient : le calque en garde une trace dans la marge (traces.ts).
   */
  onFermer;
  constructor(app, repere, barre, onFermer, onSupprimer, onMicro) {
    super();
    this.repere = repere;
    this.barre = barre;
    this.onFermer = onFermer;
    this.dom = document.createElement("div");
    this.dom.classList.add("agent-bulle");
    this.dom.setAttribute("role", "dialog");
    this.dom.setAttribute("aria-label", "Question \xE0 l'agent");
    const tete = this.dom.appendChild(document.createElement("div"));
    tete.classList.add("agent-bulle-tete");
    this.extraitEl = tete.appendChild(document.createElement("div"));
    this.extraitEl.classList.add("agent-bulle-extrait");
    const fermerEl = tete.appendChild(document.createElement("button"));
    fermerEl.type = "button";
    fermerEl.classList.add("agent-bulle-fermer");
    fermerEl.setAttribute("aria-label", "Fermer");
    fermerEl.title = "Fermer";
    (0, import_fragment4.setIcon)(app, fermerEl, "x");
    fermerEl.addEventListener("click", () => this.fermer());
    this.filEl = this.dom.appendChild(document.createElement("div"));
    this.filEl.classList.add("agent-bulle-fil");
    this.filEl.setAttribute("aria-live", "polite");
    const saisie = this.dom.appendChild(document.createElement("form"));
    saisie.classList.add("agent-bulle-saisie");
    saisie.addEventListener("submit", (e) => {
      e.preventDefault();
      void this.envoyer();
    });
    this.champEl = saisie.appendChild(document.createElement("textarea"));
    this.champEl.classList.add("agent-bulle-champ");
    this.champEl.rows = 1;
    this.champEl.placeholder = "Poser une question sur ce passage";
    this.champEl.setAttribute("aria-label", "Question");
    this.champEl.addEventListener("input", () => this.ajusterChamp());
    this.champEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        void this.envoyer();
      }
    });
    this.microEl = saisie.appendChild(document.createElement("button"));
    this.microEl.type = "button";
    this.microEl.classList.add("agent-bulle-micro");
    this.microEl.setAttribute("aria-label", "Reprendre la discussion \xE0 voix haute");
    this.microEl.title = "Reprendre la discussion \xE0 voix haute";
    this.microEl.hidden = true;
    (0, import_fragment4.setIcon)(app, this.microEl, "mic");
    this.microEl.addEventListener("click", () => onMicro());
    this.envoyerEl = saisie.appendChild(document.createElement("button"));
    this.envoyerEl.type = "submit";
    this.envoyerEl.classList.add("agent-bulle-envoyer");
    this.envoyerEl.setAttribute("aria-label", "Envoyer");
    this.envoyerEl.title = "Envoyer";
    (0, import_fragment4.setIcon)(app, this.envoyerEl, "arrow-up");
    this.pied = new PiedSupprimer(app, onSupprimer);
    this.dom.appendChild(this.pied.el);
    this.fenetre = new Fenetre(this.dom, tete, repere);
    this.dom.addEventListener("keydown", (e) => e.stopPropagation());
  }
  // ── L'état, vu de l'extérieur ─────────────────────────────────────────
  estOuverte() {
    return this._loaded;
  }
  /**
   * La conversation, sans la réponse qu'on attend encore : c'est ce que
   * l'historique de la marge garde et rouvre.
   */
  conversation() {
    return [...this.filEl.children].filter((el) => el.classList.contains("agent-message") && !el.classList.contains("is-pending")).map((el) => ({
      auteur: el.classList.contains("mod-moi") ? "moi" : "agent",
      texte: el.textContent ?? ""
    }));
  }
  /**
   * Rouvre une conversation gardée dans la marge, SANS la barre : la bulle se
   * pose à droite du trait, comme la carte d'un outil, et sort
   * de l'icône cliquée (`depuis`). On relit une discussion, on n'en lance pas
   * une autre : les outils de la barre n'ont rien à y faire.
   *
   * Sert aussi à la carte d'un outil qui devient un chat : `depuis` est alors
   * la boîte de sa tête de chat, déjà retirée, et `outil` son outil. La
   * poubelle n'y est que si la carte venait de la marge.
   *
   * `bilan` : une discussion orale relue par écrit. Le bilan ouvre le fil,
   * les tours transcrits suivent, et un micro à côté d'Envoyer la reprend à
   * voix haute (le calque, `onMicro`).
   */
  rouvrir(contexte, messages, depuis, cadre, options) {
    this.fermer();
    this.seule = { depuis, cadre };
    this.origine = options.outil ?? null;
    this.bilan = options.bilan ?? null;
    this.ouvrir(contexte);
    this.filEl.replaceChildren();
    if (this.bilan !== null) this.ajouterBilan(this.bilan);
    this.microEl.hidden = this.bilan === null;
    for (const m of messages) this.ajouterMessage(m.auteur, m.texte);
    if (this.bilan !== null) this.filEl.scrollTop = 0;
    this.pied.montrer(options.poubelle);
  }
  /** Le bilan d'une discussion orale relue par écrit, null pour un chat ordinaire. */
  bilanOral() {
    return this.bilan;
  }
  /** La boîte CLIENT de la bulle, à lire avant de la fermer : le rond du micro en sort. */
  boite() {
    return this.dom.getBoundingClientRect();
  }
  /** Ouverte seule, depuis la marge : sa croix ferme tout, il n'y a pas de barre. */
  estSeule() {
    return this._loaded && this.seule !== null;
  }
  /** La zone suivie : lue par le calque pour ancrer et surligner. */
  zone() {
    return this.contexte;
  }
  // ── Ouvrir, suivre, fermer ────────────────────────────────────────────
  /**
   * Ouvre la bulle sur une zone, ou la déplace sur une nouvelle si elle est
   * déjà ouverte. Le champ prend le focus : on vient de cliquer sur la tête
   * de chat, c'est pour poser une question.
   */
  ouvrir(contexte) {
    this.contexte = contexte;
    this.extraitEl.textContent = contexte.texte.replace(/\s+/g, " ").trim();
    this.extraitEl.title = contexte.texte;
    if (!this._loaded) {
      this.ouverture++;
      this.dom.style.opacity = "0";
      this.load();
      this.poser();
      this.eclosion = eclore(this.seule?.depuis ?? this.barre().chatEl, this.dom);
    }
    this.champEl.focus({ preventScroll: true });
  }
  /**
   * Le texte a été édité : la zone a de nouvelles bornes, et peut-être un
   * nouveau contenu (une frappe DANS le passage). La question suivante doit
   * partir avec le texte qu'on voit surligné, pas avec celui d'avant.
   */
  deplacerZone(from, to, texte) {
    if (!this.contexte) return;
    this.contexte = { ...this.contexte, from, to, texte };
    this.extraitEl.textContent = texte.replace(/\s+/g, " ").trim();
    this.extraitEl.title = texte;
  }
  fermer() {
    this.unload();
  }
  onunload() {
    const messages = this.conversation();
    const contexte = this.contexte;
    const cadre = this.fenetre.cadre();
    const origine = this.origine;
    const bilan = this.bilan;
    this.origine = null;
    this.bilan = null;
    this.microEl.hidden = true;
    this.eclosion?.annuler();
    this.eclosion = null;
    this.dom.style.opacity = "";
    this.fenetre.retirer();
    this.filEl.replaceChildren();
    this.champEl.value = "";
    this.champEl.style.height = "";
    this.contexte = null;
    this.pied.montrer(false);
    this.enAttente = false;
    this.seule = null;
    this.envoyerEl.disabled = false;
    this.onFermer(messages, contexte, cadre, origine, bilan);
  }
  /**
   * La première place : le cadre gardé d'une conversation rouverte, sinon à
   * côté de la barre, alignée sur la tête de chat, à 8 px de son bord ;
   * seule, à 12 px du trait, sur son haut, comme la carte d'un outil.
   */
  poser() {
    const seule = this.seule;
    this.fenetre.monter(seule?.cadre ?? null, (el) => {
      const trait = this.repere.boiteTrait();
      if (seule) return this.repere.aCote(el, { haut: trait?.top ?? "centre", evites: [trait] });
      const { dom, chatEl } = this.barre();
      const barre = this.repere.boiteDe(dom);
      const chat = this.repere.boiteDe(chatEl);
      return this.repere.aCote(el, { ref: barre, haut: chat?.top ?? "centre", ecart: 8, evites: [trait, barre] });
    });
  }
  // ── La conversation ───────────────────────────────────────────────────
  async envoyer() {
    const question = this.champEl.value.trim();
    const contexte = this.contexte;
    if (!question || !contexte || this.enAttente) return;
    const historique = this.conversation();
    this.ajouterMessage("moi", question);
    this.champEl.value = "";
    this.ajusterChamp();
    const ouverture = this.ouverture;
    const estCourante = () => this._loaded && this.ouverture === ouverture;
    this.enAttente = true;
    this.envoyerEl.disabled = true;
    const reponseEl = this.ajouterMessage("agent", "\u2026");
    reponseEl.classList.add("is-pending");
    try {
      const reponse = await repondre(question, contexte, historique);
      if (!estCourante()) return;
      reponseEl.textContent = reponse;
    } catch (err) {
      if (!estCourante()) return;
      reponseEl.textContent = `L'agent n'a pas pu r\xE9pondre : ${err instanceof Error ? err.message : String(err)}`;
      reponseEl.classList.add("is-error");
    } finally {
      if (estCourante()) {
        reponseEl.classList.remove("is-pending");
        this.enAttente = false;
        this.envoyerEl.disabled = false;
      }
    }
    if (!estCourante()) return;
    this.filEl.scrollTop = this.filEl.scrollHeight;
  }
  /** Le bilan d'une discussion orale, en tête du fil : pas un message, conversation() l'ignore. */
  ajouterBilan(texte) {
    const el = this.filEl.appendChild(document.createElement("div"));
    el.classList.add("agent-bilan");
    const titre = el.appendChild(document.createElement("div"));
    titre.classList.add("agent-bilan-titre");
    titre.textContent = "Bilan";
    el.appendChild(document.createElement("div")).textContent = texte;
  }
  ajouterMessage(auteur, texte) {
    const el = this.filEl.appendChild(document.createElement("div"));
    el.classList.add("agent-message", `mod-${auteur}`);
    el.textContent = texte;
    this.filEl.scrollTop = this.filEl.scrollHeight;
    return el;
  }
  /** Le champ grandit avec le texte, jusqu'au plafond fixé en CSS. */
  ajusterChamp() {
    this.champEl.style.height = "auto";
    const bordure = this.champEl.offsetHeight - this.champEl.clientHeight;
    this.champEl.style.height = `${this.champEl.scrollHeight + bordure}px`;
  }
};

// src/traces.ts
var import_fragment5 = require("fragment");
var TAILLE = 24;
var ECART = 6;
var prochainId = 1;
var CarnetTraces = class {
  traces = [];
  icones = /* @__PURE__ */ new Map();
  /**
   * La trace dont la carte ou le chat est ouvert : son icône s'efface le temps
   * de la lecture, mais garde sa place, pour que ses voisines ne glissent pas.
   */
  ouverte = null;
  app;
  editor;
  widgets;
  chemin;
  onOuvrir;
  constructor(app, editor, widgets, chemin, onOuvrir) {
    this.app = app;
    this.editor = editor;
    this.widgets = widgets;
    this.chemin = chemin;
    this.onOuvrir = onOuvrir;
  }
  /**
   * Ce qu'on vient de fermer. Si c'est une trace rouverte, elle reprend sa
   * place (avec la conversation, peut-être allongée) ; sinon, une trace neuve.
   */
  fermer(zone, trait, contenu, cadre) {
    const rouverte = this.traces.find((t) => t.id === this.ouverte);
    this.ouverte = null;
    if (rouverte) {
      rouverte.contenu = contenu;
      rouverte.cadre = cadre;
      this.placer();
      return;
    }
    this.traces.push({ id: prochainId++, zone, trait, decalageTrait: trait.pos - zone.from, contenu, cadre });
    this.placer();
  }
  /** Une carte ou un chat rouvert depuis une icône a été fermé sans rien à garder. */
  oublierOuverte() {
    this.ouverte = null;
    this.placer();
  }
  /**
   * Supprime la trace dont la réponse est ouverte (la poubelle de la carte ou
   * du chat) et la rend, pour que le calque efface son trait. null s'il n'y
   * en a pas.
   */
  supprimerOuverte() {
    const i = this.traces.findIndex((t) => t.id === this.ouverte);
    this.ouverte = null;
    if (i < 0) return null;
    const [trace] = this.traces.splice(i, 1);
    this.retirer(trace.id);
    this.placer();
    return trace;
  }
  /** Une réponse est ouverte depuis la marge : c'est déjà une annotation. */
  aUneOuverte() {
    return this.ouverte !== null;
  }
  /** Le trait de la trace, recalé sur son passage (le texte a pu bouger). */
  traitDe(trace) {
    return { ...trace.trait, pos: trace.zone.from + trace.decalageTrait };
  }
  /** Le passage suit le texte, et disparaît avec lui. */
  remapper(mapPos) {
    const chemin = this.chemin();
    for (let i = this.traces.length - 1; i >= 0; i--) {
      const t = this.traces[i];
      if (t.zone.chemin !== chemin) continue;
      const from = mapPos(t.zone.from, 1).pos;
      const to = mapPos(t.zone.to, -1).pos;
      if (to <= from) {
        this.retirer(t.id);
        this.traces.splice(i, 1);
        continue;
      }
      t.zone = { ...t.zone, from, to, texte: texteEntre(this.editor, from, to) };
    }
  }
  /** Pose les icônes du document affiché, et retire les autres. */
  placer() {
    const chemin = this.chemin();
    const visibles = this.traces.filter((t) => t.zone.chemin === chemin);
    for (const id of [...this.icones.keys()]) {
      if (!visibles.some((t) => t.id === id)) this.retirer(id);
    }
    const colonnes = [];
    const places = visibles.map((t) => ({ t, ligne: this.editor.coordsForRange(t.zone.from, t.zone.from + 1)[0] ?? null })).sort((a, b) => (a.ligne?.top ?? 0) - (b.ligne?.top ?? 0));
    for (const { t, ligne } of places) {
      const { el, handle } = this.icone(t);
      el.classList.toggle("is-ouverte", t.id === this.ouverte);
      if (!ligne) continue;
      const top = (ligne.top + ligne.bottom) / 2 - TAILLE / 2;
      let col = 0;
      while ((colonnes[col] ?? []).some((y) => Math.abs(y - top) < TAILLE + 2)) col++;
      (colonnes[col] ??= []).push(top);
      el.style.marginRight = `${col * (TAILLE + ECART)}px`;
      handle.setAnchor({ mode: "gutter", side: "left", pos: t.zone.from, dy: top - ligne.top });
    }
  }
  detruire() {
    for (const id of [...this.icones.keys()]) this.retirer(id);
  }
  icone(t) {
    const deja = this.icones.get(t.id);
    if (deja) return deja;
    const el = document.createElement("button");
    el.type = "button";
    el.classList.add("agent-trace");
    const outil = t.contenu.type === "oral" ? void 0 : t.contenu.outil;
    const { libelle, icone } = t.contenu.type === "oral" ? { libelle: "Discussion orale", icone: "mic" } : outil ? OUTILS[outil] : { libelle: "Conversation", icone: "cat" };
    const extrait = t.zone.texte.replace(/\s+/g, " ").trim();
    el.setAttribute("aria-label", `${libelle} : ${extrait}`);
    el.title = `${libelle} : \xAB ${extrait.length > 60 ? `${extrait.slice(0, 60)}\u2026` : extrait} \xBB`;
    (0, import_fragment5.setIcon)(this.app, el, icone);
    el.addEventListener("click", () => {
      this.onOuvrir(t, el);
      this.ouverte = t.id;
      requestAnimationFrame(() => this.placer());
    });
    const rangee = document.createElement("div");
    rangee.classList.add("agent-trace-rangee");
    rangee.appendChild(el);
    const handle = this.widgets.addWidget(rangee, { mode: "gutter", side: "left", pos: t.zone.from, dy: 0 });
    rangee.style.pointerEvents = "none";
    const posee = { el, rangee, handle };
    this.icones.set(t.id, posee);
    return posee;
  }
  retirer(id) {
    const icone = this.icones.get(id);
    icone?.handle.remove();
    icone?.rangee.remove();
    this.icones.delete(id);
  }
};
function texteEntre(editor, from, to) {
  const debut = editor.offsetToPos(from);
  const fin = editor.offsetToPos(to);
  if (debut.line === fin.line) return editor.getLine(debut.line).slice(debut.ch, fin.ch);
  const lignes = [editor.getLine(debut.line).slice(debut.ch)];
  for (let n = debut.line + 1; n < fin.line; n++) lignes.push(editor.getLine(n));
  lignes.push(editor.getLine(fin.line).slice(0, fin.ch));
  return lignes.join("\n");
}

// src/zoneDuTrait.ts
var COTE_MIN_CERCLE = 20;
var HAUTEUR_MAX_SOULIGNE = 14;
var PAS = 4;
function formeDuTrait(points, outil) {
  if (points.length < 2) return null;
  const b = boite(points);
  const largeur = b.maxX - b.minX;
  const hauteur = b.maxY - b.minY;
  const ecart = Math.hypot(points[0].x - points[points.length - 1].x, points[0].y - points[points.length - 1].y);
  const ferme = ecart <= Math.max(24, Math.max(largeur, hauteur) / 3);
  if (ferme && largeur >= COTE_MIN_CERCLE && hauteur >= COTE_MIN_CERCLE) return "entoure";
  if (outil === "surligneur") return "surligne";
  if (hauteur <= HAUTEUR_MAX_SOULIGNE && largeur > hauteur * 2) return "souligne";
  return null;
}
function plageDuTrait(points, outil, mesure) {
  const forme = formeDuTrait(points, outil);
  if (!forme) return null;
  const plage = forme === "entoure" ? plageEntouree(points, mesure) : plageLeLong(points, forme, mesure);
  return plage ? rogner(plage, mesure) : null;
}
function plageEntouree(points, mesure) {
  const b = boite(points);
  const bornes = [];
  for (let y = b.minY; y <= b.maxY + PAS; y += PAS) {
    const yb = Math.min(y, b.maxY);
    for (const x of [b.minX, b.maxX]) {
      const off = mesure.posAt(x, yb);
      if (off !== null) bornes.push(off);
    }
  }
  if (bornes.length === 0) return null;
  const debut = Math.min(...bornes);
  const fin = Math.max(...bornes);
  let from = Infinity;
  let to = -Infinity;
  for (let off = debut; off <= fin; off++) {
    const r = mesure.coordsAt(off);
    if (!r || r.right <= r.left) continue;
    const centre = { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 };
    if (dansPolygone(centre, points)) {
      from = Math.min(from, off);
      to = Math.max(to, off + 1);
    }
  }
  return from < to ? { from, to } : null;
}
function plageLeLong(points, forme, mesure) {
  let remontee = 0;
  if (forme === "souligne") {
    const p0 = mesure.posAt(points[0].x, points[0].y);
    const r = p0 === null ? null : mesure.coordsAt(p0);
    remontee = r ? (r.bottom - r.top) / 2 + 2 : 10;
  }
  let from = Infinity;
  let to = -Infinity;
  for (const p of echantillonner(points)) {
    const off = mesure.posAt(p.x, p.y - remontee);
    if (off === null) continue;
    from = Math.min(from, off);
    to = Math.max(to, off);
  }
  return from < to ? { from, to } : null;
}
function rogner(plage, mesure) {
  let { from, to } = plage;
  while (from < to && /\s/.test(mesure.charAt(from))) from++;
  while (to > from && /\s/.test(mesure.charAt(to - 1))) to--;
  return from < to ? { from, to } : null;
}
function echantillonner(points) {
  const out = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / PAS));
    for (let k = 1; k <= n; k++) out.push({ x: a.x + (b.x - a.x) * k / n, y: a.y + (b.y - a.y) * k / n });
  }
  return out;
}
function boite(points) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY };
}
function dansPolygone(p, poly) {
  let dedans = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) {
      dedans = !dedans;
    }
  }
  return dedans;
}

// src/declencheur.ts
var SELECTION = "selection-";
function brancherDeclencheurs(editor, repere, annotation, chemin, occupe, surPassage) {
  const mesure = {
    posAt: (x, y) => {
      const c = repere.versClient(x, y);
      return c ? editor.posAtCoords(c.x, c.y) : null;
    },
    coordsAt: (off) => {
      const rects = editor.coordsForRange(off, off + 1);
      return rects.length === 1 ? rects[0] : null;
    },
    charAt: (off) => texteEntre(editor, off, off + 1)
  };
  annotation.surTraitPose((path, stroke) => {
    if (path !== chemin() || occupe()) return;
    const glyphe = editor.coordsAtPos(stroke.pos);
    if (!glyphe) return;
    const points = stroke.points.map((p) => ({ x: glyphe.left + p.dx, y: glyphe.top + p.dy }));
    const plage = plageDuTrait(points, stroke.tool, mesure);
    if (!plage) return;
    surPassage({ texte: texteEntre(editor, plage.from, plage.to), chemin: path, ...plage }, stroke);
  });
  let pointeurEnfonce = false;
  let minuterie = 0;
  const surSelection = () => {
    if (occupe()) return;
    const { from, to } = editor.getSelection();
    if (from === to) return;
    const glyphe = editor.coordsAtPos(from);
    const rects = editor.coordsForRange(from, to);
    if (!glyphe || rects.length === 0) return;
    const left = Math.min(...rects.map((r) => r.left));
    const top = Math.min(...rects.map((r) => r.top));
    const right = Math.max(...rects.map((r) => r.right));
    const bottom = Math.max(...rects.map((r) => r.bottom));
    const coin = (x, y) => ({ dx: x - glyphe.left, dy: y - glyphe.top });
    surPassage({ texte: texteEntre(editor, from, to), chemin: chemin(), from, to }, {
      id: `${SELECTION}${Date.now()}`,
      pos: from,
      points: [coin(left, top), coin(right, top), coin(right, bottom), coin(left, bottom)],
      color: "",
      width: 0,
      tool: "surligneur"
    });
  };
  const surPointerDown = () => {
    pointeurEnfonce = true;
    window.clearTimeout(minuterie);
  };
  const surPointerUp = () => {
    if (!pointeurEnfonce) return;
    pointeurEnfonce = false;
    minuterie = window.setTimeout(surSelection, 0);
  };
  const surTouche = () => window.clearTimeout(minuterie);
  editor.contentEl.addEventListener("pointerdown", surPointerDown);
  document.addEventListener("pointerup", surPointerUp);
  document.addEventListener("keydown", surTouche, true);
  return () => {
    editor.contentEl.removeEventListener("pointerdown", surPointerDown);
    document.removeEventListener("pointerup", surPointerUp);
    document.removeEventListener("keydown", surTouche, true);
    window.clearTimeout(minuterie);
  };
}

// src/repere.ts
var import_fragment6 = require("fragment");
var Repere = class {
  widgets;
  editor;
  overlays;
  paneEl;
  trait;
  barreAnnotation;
  constructor(editor, overlays, paneEl, trait, barreAnnotation) {
    this.editor = editor;
    this.overlays = overlays;
    this.paneEl = paneEl;
    this.trait = trait;
    this.barreAnnotation = barreAnnotation;
    this.widgets = new import_fragment6.WidgetLayer(editor, overlays);
  }
  detruire() {
    this.widgets.destroy();
  }
  // ── Conversions ────────────────────────────────────────────────────────
  /** Une boîte CLIENT (getBoundingClientRect) en coordonnées document. */
  versDocument(r) {
    const a = this.overlays.clientToDocument(r.left, r.top);
    const b = this.overlays.clientToDocument(r.right, r.bottom);
    return a && b ? { left: a.x, top: a.y, right: b.x, bottom: b.y } : null;
  }
  /** Un déplacement CLIENT (un geste de pointeur) en déplacement document. */
  ecartDocument(dx, dy) {
    const o = this.overlays.clientToDocument(0, 0);
    const p = this.overlays.clientToDocument(dx, dy);
    return o && p ? { dx: p.x - o.x, dy: p.y - o.y } : { dx, dy };
  }
  /**
   * Un point document en coordonnées client, pour `posAtCoords` qui les
   * attend. L'inverse de `clientToDocument`, déduit de deux points : le
   * cœur ne l'expose pas, et l'échelle du document y est comprise.
   */
  versClient(x, y) {
    const o = this.overlays.clientToDocument(0, 0);
    const p = this.overlays.clientToDocument(1, 1);
    if (!o || !p || p.x === o.x || p.y === o.y) return null;
    return { x: (x - o.x) / (p.x - o.x), y: (y - o.y) / (p.y - o.y) };
  }
  /** Le pane visible, en coordonnées client : un geste y reste. */
  paneClient() {
    return this.paneEl.getBoundingClientRect();
  }
  // ── Le trait ───────────────────────────────────────────────────────────
  /**
   * La boîte du trait, en coordonnées document : ses points sont des écarts
   * au glyphe de `pos`, et l'encre en déborde de la moitié de son épaisseur.
   *
   * ★ POURQUOI le trait et pas le texte couvert : un cercle qui mord sur cinq
   *   lignes couvre un texte qui va d'une marge à l'autre. Posée à côté de ce
   *   rectangle, la barre n'avait de place ni à droite ni à gauche.
   */
  boiteTrait() {
    const t = this.trait();
    if (!t) return null;
    const g = this.editor.coordsAtPos(t.pos);
    if (!g) return null;
    const m = t.width / 2;
    const xs = t.points.map((p) => g.left + p.dx);
    const ys = t.points.map((p) => g.top + p.dy);
    return {
      left: Math.min(...xs) - m,
      top: Math.min(...ys) - m,
      right: Math.max(...xs) + m,
      bottom: Math.max(...ys) + m
    };
  }
  /** L'ancre document qui met le coin haut gauche d'un widget en (x, y). */
  ancre(x, y) {
    const t = this.trait();
    const g = t ? this.editor.coordsAtPos(t.pos) : null;
    if (!t || !g) return null;
    return { mode: "document", pos: t.pos, dx: x - g.left, dy: y - g.top };
  }
  /** L'ancre d'un cadre gardé (fenetre.ts) : un écart au glyphe du trait. */
  ancreDuCadre(c) {
    const t = this.trait();
    return t ? { mode: "document", pos: t.pos, dx: c.dx, dy: c.dy } : null;
  }
  // ── Poser un widget la première fois ───────────────────────────────────
  /**
   * L'ancre qui pose `el` à côté de `ref` (le trait par défaut), hors de la
   * barre d'annotation et des `evites`. `el` doit être monté : on le mesure.
   */
  aCote(el, options = {}) {
    const ref = options.ref ?? this.boiteTrait();
    const cadre = this.versDocument(this.paneClient());
    if (!ref || !cadre) return null;
    const annotation = this.barreAnnotation();
    const obstacles = [annotation ? this.versDocument(annotation) : null, ...options.evites ?? []].filter((b) => b !== null);
    const taille = this.ecartDocument(el.offsetWidth, el.offsetHeight);
    const { x, y } = aCote({
      ref,
      largeur: taille.dx,
      hauteur: taille.dy,
      haut: options.haut ?? "centre",
      ecart: options.ecart ?? 12,
      cadre,
      obstacles
    });
    return this.ancre(x, y);
  }
  /**
   * Monte `el` comme widget, puis le pose avec `placer` : il faut être monté
   * pour se mesurer. Le premier placement et le second ont lieu dans la même
   * tâche, avant tout rendu : on ne voit jamais la position provisoire.
   */
  monter(el, placer) {
    const provisoire = this.ancre(0, 0);
    if (!provisoire) return null;
    const handle = this.widgets.addWidget(el, provisoire);
    const a = placer(el);
    if (a) handle.setAnchor(a);
    return handle;
  }
  /** La boîte document d'un élément monté. */
  boiteDe(el) {
    return this.versDocument(el.getBoundingClientRect());
  }
};

// src/VoixAgent.ts
var import_fragment7 = require("fragment");

// src/onde.ts
var TRAITS = 5;
var HAUTEUR = 14;
var HAUTEUR_MIN2 = 4;
var PLANCHER = 0.2;
var REPOS = 0.1;
var PERIODE = 100;
var HZ_BAS = 80;
var HZ_HAUT = 4e3;
var PLEIN = 160;
function niveaux(spectre, hzParCase) {
  const ratio = Math.pow(HZ_HAUT / HZ_BAS, 1 / TRAITS);
  return Array.from({ length: TRAITS }, (_, i) => {
    const debut = Math.floor(HZ_BAS * Math.pow(ratio, i) / hzParCase);
    const fin = Math.max(debut + 1, Math.floor(HZ_BAS * Math.pow(ratio, i + 1) / hzParCase));
    let somme = 0;
    let n = 0;
    for (let k = debut; k < fin && k < spectre.length; k++) {
      somme += spectre[k];
      n++;
    }
    const moyenne = n > 0 ? somme / n : 0;
    return PLANCHER + (1 - PLANCHER) * Math.min(1, moyenne / PLEIN);
  });
}
function auHasard() {
  return Array.from({ length: TRAITS }, () => Math.random() * (1 - PLANCHER) + PLANCHER);
}
var transition = null;
var Onde = class {
  el;
  traits;
  minuterie = 0;
  constructor() {
    this.el = document.createElement("div");
    this.el.classList.add("agent-onde");
    this.el.setAttribute("aria-hidden", "true");
    if (!transition) {
      const { easing, duree } = ressort(300, 10);
      transition = `transform ${duree}ms ${easing}`;
    }
    this.traits = Array.from({ length: TRAITS }, () => {
      const trait = this.el.appendChild(document.createElement("span"));
      trait.classList.add("agent-onde-trait");
      trait.style.transition = transition ?? "";
      return trait;
    });
    this.repos();
  }
  /** Relit `lire` toutes les 100 ms et pose les traits à ces niveaux. */
  suivre(lire) {
    this.arreter();
    const poser = () => this.poser(lire());
    poser();
    this.minuterie = window.setInterval(poser, PERIODE);
  }
  /** Les traits retombent à plat. */
  repos() {
    this.arreter();
    this.poser(Array(TRAITS).fill(REPOS));
  }
  detruire() {
    this.arreter();
    this.el.remove();
  }
  arreter() {
    window.clearInterval(this.minuterie);
    this.minuterie = 0;
  }
  poser(niveaux2) {
    this.traits.forEach((trait, i) => {
      const hauteur = Math.max(HAUTEUR_MIN2, (niveaux2[i] ?? REPOS) * HAUTEUR);
      trait.style.transform = `scaleY(${hauteur / HAUTEUR})`;
    });
  }
};

// src/VoixAgent.ts
var RAIDEUR4 = 520;
var AMORTISSEMENT4 = 38;
var RETARD_CONTENU = 250;
var APPARITION2 = 220;
var RAIDEUR_SURVOL = (2 * Math.PI) ** 2;
var AMORTISSEMENT_SURVOL = 2 * (1 - 0.6) * Math.sqrt(RAIDEUR_SURVOL);
var MS_PAR_CARACTERE = 90;
var LISSAGE = 0.4;
var VoixAgent = class extends import_fragment7.Component {
  el;
  contenuEl;
  stopEl;
  messageEl;
  onde = new Onde();
  /** Le numéro du lancement en cours : ce qui arrive d'un lancement fermé est ignoré. */
  lancement = 0;
  /** Le numéro de la réponse en cours : la fin d'une voix coupée ne relance rien. */
  parole = 0;
  etat = "rond";
  animations = [];
  zone = null;
  historique = [];
  minuterie = 0;
  // Le micro, ouvert du premier tour à la croix.
  flux = null;
  audio = null;
  analyseur = null;
  enregistreur = null;
  morceaux = [];
  /** La voix de l'agent, quand le back en renvoie une. */
  lecture = null;
  repere;
  handle = null;
  /**
   * Prévenu à la fermeture, avec les tours de la discussion et la boîte
   * CLIENT de la pilule juste avant son retrait : le bilan en sort.
   * `parCroix` : faux quand le calque la ferme (une autre trace rouverte,
   * un autre document, la vue démontée).
   */
  onFermer;
  /** Fermée par sa croix : seul ce geste demande un bilan. */
  parCroix = false;
  constructor(app, repere, onFermer) {
    super();
    this.repere = repere;
    this.onFermer = onFermer;
    this.el = document.createElement("div");
    this.el.classList.add("agent-voix");
    this.el.setAttribute("role", "group");
    this.el.setAttribute("aria-label", "Discussion orale");
    const microEl = this.el.appendChild(document.createElement("span"));
    microEl.classList.add("agent-voix-micro");
    (0, import_fragment7.setIcon)(app, microEl, "mic");
    this.contenuEl = this.el.appendChild(document.createElement("div"));
    this.contenuEl.classList.add("agent-voix-contenu");
    const fermerEl = this.contenuEl.appendChild(document.createElement("button"));
    fermerEl.type = "button";
    fermerEl.classList.add("agent-voix-fermer");
    fermerEl.setAttribute("aria-label", "Fermer");
    fermerEl.title = "Fermer";
    (0, import_fragment7.setIcon)(app, fermerEl, "x");
    fermerEl.addEventListener("click", () => {
      this.parCroix = true;
      this.fermer();
    });
    this.contenuEl.appendChild(this.onde.el);
    this.messageEl = this.contenuEl.appendChild(document.createElement("span"));
    this.messageEl.classList.add("agent-voix-message");
    this.messageEl.setAttribute("role", "status");
    const pointEl = this.contenuEl.appendChild(document.createElement("span"));
    pointEl.classList.add("agent-voix-point");
    this.stopEl = this.contenuEl.appendChild(document.createElement("button"));
    this.stopEl.type = "button";
    this.stopEl.classList.add("agent-voix-stop");
    this.stopEl.appendChild(document.createElement("span")).classList.add("agent-voix-carre");
    this.stopEl.insertAdjacentHTML(
      "beforeend",
      '<svg class="agent-action-arc" viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="28" pathLength="100"/></svg>'
    );
    this.stopEl.addEventListener("click", () => this.surStop());
    this.el.addEventListener("keydown", (e) => e.stopPropagation());
    this.poserEtat("rond");
  }
  estOuverte() {
    return this._loaded;
  }
  /**
   * Ouvre la discussion sur `zone`. `depuis` est la boîte CLIENT de ce qui
   * fond dans le rond (la barre, ou le chat d'une discussion reprise), juste
   * avant son retrait. `historique` : les tours d'une discussion qu'on reprend.
   */
  lancer(zone, depuis, historique = []) {
    this.lancement++;
    const lancement = this.lancement;
    const estCourant = () => this._loaded && this.lancement === lancement;
    this.zone = { ...zone };
    this.historique = [...historique];
    this.poserEtat("rond");
    this.el.style.opacity = "0";
    this.load();
    this.handle = this.repere.monter(this.el, (el) => this.repere.aCote(el));
    const micro = this.ouvrirMicro(estCourant);
    const resorption = resorber(depuis, this.el);
    this.animations.push(resorption);
    void resorption.fini.then(async () => {
      const ok = await micro;
      if (estCourant()) this.etirer(ok);
    });
  }
  fermer() {
    this.unload();
  }
  onunload() {
    const historique = this.historique;
    const boite2 = this.el.getBoundingClientRect();
    const parCroix = this.parCroix;
    this.parCroix = false;
    this.historique = [];
    this.lancement++;
    for (const a of this.animations) a.annuler();
    this.animations = [];
    this.couperVoix();
    this.onde.repos();
    if (this.enregistreur && this.enregistreur.state !== "inactive") this.enregistreur.stop();
    for (const piste of this.flux?.getTracks() ?? []) piste.stop();
    void this.audio?.close();
    this.flux = null;
    this.audio = null;
    this.analyseur = null;
    this.enregistreur = null;
    this.morceaux = [];
    this.zone = null;
    this.handle?.remove();
    this.handle = null;
    this.el.remove();
    this.el.style.opacity = "";
    this.el.style.transition = "";
    this.el.classList.remove("est-posee");
    this.poserEtat("rond");
    this.onFermer(historique, boite2, parCroix);
  }
  // ── Le micro ────────────────────────────────────────────────────────────
  /** Vrai si le micro est ouvert. Refusé, absent ou lancement fermé : faux. */
  async ouvrirMicro(estCourant) {
    let flux;
    try {
      flux = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch {
      return false;
    }
    if (!estCourant()) {
      for (const piste of flux.getTracks()) piste.stop();
      return false;
    }
    this.flux = flux;
    this.audio = new AudioContext();
    this.analyseur = this.audio.createAnalyser();
    this.analyseur.fftSize = 1024;
    this.audio.createMediaStreamSource(flux).connect(this.analyseur);
    this.enregistreur = new MediaRecorder(flux);
    this.enregistreur.addEventListener("dataavailable", (e) => {
      if (e.data.size > 0) this.morceaux.push(e.data);
    });
    return true;
  }
  /** Les niveaux de l'onde, lus dans le spectre de `analyseur`. */
  lecteur(analyseur) {
    const spectre = new Uint8Array(analyseur.frequencyBinCount);
    const hzParCase = analyseur.context.sampleRate / analyseur.fftSize;
    analyseur.smoothingTimeConstant = LISSAGE;
    return () => {
      analyseur.getByteFrequencyData(spectre);
      return niveaux(spectre, hzParCase);
    };
  }
  // ── Les tours de parole ─────────────────────────────────────────────────
  ecouter() {
    if (!this.enregistreur || !this.analyseur) return;
    this.poserEtat("ecoute");
    this.morceaux = [];
    if (this.enregistreur.state === "inactive") this.enregistreur.start();
    void this.audio?.resume();
    this.onde.suivre(this.lecteur(this.analyseur));
  }
  surStop() {
    if (this.etat === "ecoute") void this.finirTour();
    else if (this.etat === "repond") {
      this.couperVoix();
      this.ecouter();
    }
  }
  /** ■ : le tour part à l'agent, qui répond à voix haute. */
  async finirTour() {
    const lancement = this.lancement;
    const estCourant = () => this._loaded && this.lancement === lancement;
    this.poserEtat("reflechit");
    this.onde.repos();
    const enregistrement = await this.arreterEnregistrement();
    if (!estCourant() || !this.zone) return;
    let reponse;
    try {
      reponse = await parler(enregistrement, this.zone, this.historique);
    } catch (err) {
      if (!estCourant()) return;
      this.messageEl.textContent = `L'agent n'a pas pu r\xE9pondre : ${err instanceof Error ? err.message : String(err)}`;
      this.ecouter();
      return;
    }
    if (!estCourant()) return;
    this.historique.push(
      { auteur: "moi", texte: reponse.transcription ?? "(message vocal)" },
      { auteur: "agent", texte: reponse.texte }
    );
    this.dire(reponse);
  }
  arreterEnregistrement() {
    const enregistreur = this.enregistreur;
    if (!enregistreur || enregistreur.state === "inactive") return Promise.resolve(new Blob(this.morceaux));
    return new Promise((resoudre) => {
      enregistreur.addEventListener("stop", () => {
        resoudre(new Blob(this.morceaux, { type: enregistreur.mimeType }));
      }, { once: true });
      enregistreur.stop();
    });
  }
  /** L'agent parle : sa vraie voix si le back en renvoie une, la synthèse du système sinon. */
  dire(reponse) {
    this.parole++;
    const parole = this.parole;
    const fin = () => {
      if (this._loaded && this.parole === parole && this.etat === "repond") this.ecouter();
    };
    this.poserEtat("repond");
    this.messageEl.textContent = "";
    const audio = this.audio;
    if (reponse.audio && audio) {
      audio.decodeAudioData(reponse.audio.slice(0)).then((tampon) => {
        if (this.parole !== parole || this.etat !== "repond") return;
        const source = audio.createBufferSource();
        source.buffer = tampon;
        const analyseur = audio.createAnalyser();
        analyseur.fftSize = 1024;
        source.connect(analyseur);
        analyseur.connect(audio.destination);
        source.addEventListener("ended", fin);
        this.lecture = source;
        source.start();
        this.onde.suivre(this.lecteur(analyseur));
      }).catch(() => {
        if (this._loaded && this.parole === parole && this.etat === "repond") this.direTexte(reponse.texte, fin);
      });
      return;
    }
    this.direTexte(reponse.texte, fin);
  }
  /**
   * La synthèse vocale du système : on n'entend pas sa sortie, l'onde
   * tourne au hasard comme dans Skiper25.
   */
  direTexte(texte, fin) {
    this.onde.suivre(auHasard);
    this.minuterie = window.setTimeout(fin, Math.max(2e3, texte.length * MS_PAR_CARACTERE));
    if (!("speechSynthesis" in window)) return;
    const enonce = new SpeechSynthesisUtterance(texte);
    enonce.lang = "fr-FR";
    enonce.addEventListener("start", () => window.clearTimeout(this.minuterie));
    enonce.addEventListener("end", fin);
    enonce.addEventListener("error", fin);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(enonce);
  }
  /** Fait taire l'agent, quelle que soit sa voix. */
  couperVoix() {
    this.parole++;
    window.clearTimeout(this.minuterie);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    try {
      this.lecture?.stop();
    } catch {
    }
    this.lecture = null;
  }
  // ── L'aspect ────────────────────────────────────────────────────────────
  poserEtat(etat) {
    this.etat = etat;
    this.el.dataset.etat = etat;
    const libelles = {
      ecoute: "Finir de parler",
      reflechit: "L'agent r\xE9fl\xE9chit",
      repond: "Couper la parole \xE0 l'agent"
    };
    const libelle = libelles[etat] ?? "";
    this.stopEl.setAttribute("aria-label", libelle);
    this.stopEl.title = libelle;
    this.stopEl.disabled = etat !== "ecoute" && etat !== "repond";
    if (etat === "refuse") this.messageEl.textContent = "Micro refus\xE9";
    else if (etat === "rond") this.messageEl.textContent = "";
  }
  /**
   * Le rond s'étire en pilule. La pilule prend sa taille finale et sa place
   * (à droite du passage, ou à gauche si la droite est prise), puis on
   * anime sa boîte depuis celle du rond : le bord côté passage ne bouge pas.
   */
  etirer(micro) {
    const rond = this.el.getBoundingClientRect();
    this.poserEtat(micro ? "ecoute" : "refuse");
    if (micro) this.ecouter();
    const lancement = this.lancement;
    if (this.handle) {
      const a = this.repere.aCote(this.el);
      if (a) this.handle.setAnchor(a);
    }
    const poser = () => {
      this.el.classList.add("est-posee");
      const { easing: easing2, duree: duree2 } = ressort(RAIDEUR_SURVOL, AMORTISSEMENT_SURVOL);
      this.el.style.transition = `width ${duree2}ms ${easing2}`;
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      poser();
      return;
    }
    const pilule = this.el.getBoundingClientRect();
    const dx = parseFloat(this.el.style.left || "0") - pilule.left;
    const dy = parseFloat(this.el.style.top || "0") - pilule.top;
    const { easing, duree } = ressort(RAIDEUR4, AMORTISSEMENT4);
    const etirement = this.el.animate(
      [
        { left: `${rond.left + dx}px`, top: `${rond.top + dy}px`, width: `${rond.width}px` },
        { left: `${pilule.left + dx}px`, top: `${pilule.top + dy}px`, width: `${pilule.width}px` }
      ],
      { duration: duree, easing }
    );
    const contenu = this.contenuEl.animate(
      [
        { opacity: 0, filter: "blur(4px)", scale: "0.5" },
        { opacity: 1, filter: "blur(0px)", scale: "1" }
      ],
      { duration: APPARITION2, delay: RETARD_CONTENU, easing: "ease-out", fill: "backwards" }
    );
    this.animations.push({ annuler: () => {
      etirement.cancel();
      contenu.cancel();
    } });
    void etirement.finished.then(() => {
      if (this._loaded && this.lancement === lancement) poser();
    }).catch(() => {
    });
  }
};

// src/agentLayer.ts
function createAgentLayer(ctx) {
  const surface = ctx.editor;
  if (!surface || !(0, import_fragment8.hasText)(surface)) return () => {
  };
  const editor = surface;
  const paneEl = ctx.view.contentEl;
  const chemin = () => ctx.view.file?.path ?? "";
  let zone = null;
  let trait = null;
  const annotation = brancherAnnotation(ctx.app, paneEl, chemin);
  const repere = new Repere(editor, ctx.overlays, paneEl, () => trait, () => annotation.barre());
  const barre = new BarreAgent(repere, {
    onChat: () => {
      if (zone) bulle.ouvrir(zone);
      majOccupe();
    },
    // La croix de la barre ferme tout : le chat, posé à côté de la barre,
    // n'aurait plus rien à côté de quoi se tenir.
    onFermer: () => {
      zone = null;
      bulle.fermer();
      editor.requestUpdate();
    },
    // Un outil : le chat se ferme, la barre fond dans le rond de l'outil.
    onOutil: (outil) => {
      if (!zone) return;
      const depuis = barre.dom.getBoundingClientRect();
      bulle.fermer();
      barre.cacher();
      action.lancer(outil, zone, depuis);
      majOccupe();
    },
    // Le micro : pareil, la barre fond dans le rond du micro.
    onVoix: () => {
      if (!zone) return;
      const depuis = barre.dom.getBoundingClientRect();
      bulle.fermer();
      barre.cacher();
      voix.lancer(zone, depuis);
      majOccupe();
    }
  });
  const bulle = new BulleAgent(ctx.app, repere, () => barre, (messages, contexte, cadre, origine, bilan) => {
    if (enchainement) return;
    if (!suppression && contexte && trait && bilan !== null) {
      carnet.fermer(contexte, trait, { type: "oral", messages, bilan }, cadre);
    } else if (!suppression && contexte && trait && messages.length > 0) {
      carnet.fermer(contexte, trait, { type: "chat", messages, ...origine ? { outil: origine } : {} }, cadre);
    } else carnet.oublierOuverte();
    if (!barre.estOuverte()) {
      zone = null;
      editor.requestUpdate();
    }
    majOccupe();
  }, () => supprimer(), () => reprendreAVoix());
  const action = new ActionAgent(ctx.app, repere, () => {
    if (enchainement) return;
    const resultat = action.resultat();
    if (!suppression && resultat && zone && trait) {
      carnet.fermer(zone, trait, resultat.type === "outil" ? resultat : { type: "oral", messages: resultat.messages, bilan: resultat.texte }, action.cadre());
    } else carnet.oublierOuverte();
    zone = null;
    majOccupe();
    editor.requestUpdate();
  }, () => supprimer(), () => discuter());
  const voix = new VoixAgent(ctx.app, repere, (historique, boite2, parCroix) => {
    const reprise = voixReprise;
    voixReprise = null;
    const inchangee = reprise !== null && historique.length === reprise.tours;
    if (parCroix && zone && historique.length > 0 && !inchangee) {
      action.lancerBilan(zone, historique, boite2);
      majOccupe();
      return;
    }
    if (!suppression && zone && trait && historique.length > 0) {
      const bilan = inchangee ? reprise.bilan : "Bilan non \xE9crit : la discussion a \xE9t\xE9 interrompue.";
      carnet.fermer(zone, trait, { type: "oral", messages: historique, bilan }, null);
    } else carnet.oublierOuverte();
    zone = null;
    majOccupe();
    editor.requestUpdate();
  });
  let enchainement = false;
  const discuter = () => {
    const resultat = action.resultat();
    if (!resultat || !zone || !trait) return;
    const depuis = action.boutonDiscuter();
    const cadre = action.cadre();
    const poubelle = carnet.aUneOuverte();
    enchainement = true;
    try {
      action.fermer();
    } finally {
      enchainement = false;
    }
    if (resultat.type === "oral") {
      bulle.rouvrir(zone, resultat.messages, depuis, cadre, { bilan: resultat.texte, poubelle });
    } else {
      bulle.rouvrir(
        zone,
        [{ auteur: "agent", texte: resultat.texte }],
        depuis,
        cadre,
        { outil: resultat.outil, poubelle }
      );
    }
    majOccupe();
    editor.requestUpdate();
  };
  let voixReprise = null;
  const reprendreAVoix = () => {
    if (!zone) return;
    const messages = bulle.conversation();
    const depuis = bulle.boite();
    const bilan = bulle.bilanOral();
    voixReprise = bilan === null ? null : { tours: messages.length, bilan };
    enchainement = true;
    try {
      bulle.fermer();
    } finally {
      enchainement = false;
    }
    voix.lancer(zone, depuis, messages);
    majOccupe();
    editor.requestUpdate();
  };
  const rouvrir = (t, depuis) => {
    voix.fermer();
    action.fermer();
    barre.fermer();
    bulle.fermer();
    zone = { ...t.zone };
    trait = carnet.traitDe(t);
    if (t.contenu.type === "outil") {
      action.montrer(t.contenu.outil, t.contenu.texte, depuis, t.cadre);
    } else if (t.contenu.type === "oral") {
      bulle.rouvrir(zone, t.contenu.messages, depuis, t.cadre, { bilan: t.contenu.bilan, poubelle: true });
    } else {
      bulle.rouvrir(zone, t.contenu.messages, depuis, t.cadre, { outil: t.contenu.outil, poubelle: true });
    }
    majOccupe();
    editor.requestUpdate();
  };
  let suppression = false;
  const supprimer = () => {
    const t = carnet.supprimerOuverte();
    if (!t) return;
    suppression = true;
    try {
      bulle.fermer();
      action.fermer();
      voix.fermer();
      barre.fermer();
    } finally {
      suppression = false;
    }
    zone = null;
    if (!t.trait.id.startsWith(SELECTION)) annotation.effacer(t.zone.chemin, t.trait.id);
    majOccupe();
    editor.requestUpdate();
  };
  const carnet = new CarnetTraces(ctx.app, editor, repere.widgets, chemin, rouvrir);
  const occupe = () => bulle.estOuverte() || action.estOuverte() || voix.estOuverte();
  const majOccupe = () => annotation.suspendre(occupe());
  const offDeclencheurs = brancherDeclencheurs(editor, repere, annotation, chemin, occupe, (z, t) => {
    zone = z;
    trait = t;
    barre.montrer();
    editor.requestUpdate();
  });
  const offChange = editor.onChange((c) => {
    if (c.docChanged) carnet.remapper(c.mapPos);
    if (c.docChanged && zone) {
      const from = c.mapPos(zone.from, 1).pos;
      const to = c.mapPos(zone.to, -1).pos;
      zone = { ...zone, from, to, texte: texteEntre(editor, from, to) };
      bulle.deplacerZone(from, to, zone.texte);
    }
    if (c.docChanged || c.viewportChanged) carnet.placer();
  });
  const offSurlignage = editor.addLayer({
    above: false,
    markers: (e) => {
      if (!zone || !(0, import_fragment8.hasText)(e)) return [];
      return e.coordsForRange(zone.from, zone.to).map((r) => new MarqueZone(r));
    }
  });
  const refFichier = ctx.app.workspace.on("file-open", () => {
    annotation.connaitre();
    if (zone && zone.chemin !== chemin()) {
      barre.fermer();
      bulle.fermer();
      action.fermer();
      voix.fermer();
    }
    carnet.placer();
  });
  return () => {
    offDeclencheurs();
    refFichier.off();
    offSurlignage();
    offChange();
    barre.fermer();
    bulle.fermer();
    action.fermer();
    voix.fermer();
    carnet.detruire();
    annotation.detruire();
    repere.detruire();
  };
}
var MarqueZone = class _MarqueZone {
  r;
  constructor(r) {
    this.r = r;
  }
  eq(other) {
    return other instanceof _MarqueZone && Math.round(other.r.left) === Math.round(this.r.left) && Math.round(other.r.top) === Math.round(this.r.top) && Math.round(other.r.right) === Math.round(this.r.right) && Math.round(other.r.bottom) === Math.round(this.r.bottom);
  }
  draw() {
    const el = document.createElement("div");
    el.classList.add("agent-zone");
    el.style.left = `${this.r.left}px`;
    el.style.top = `${this.r.top}px`;
    el.style.width = `${this.r.right - this.r.left}px`;
    el.style.height = `${this.r.bottom - this.r.top}px`;
    return el;
  }
};

// src/main.ts
var AgentPlugin = class extends import_fragment9.Plugin {
  onload() {
    this.registerLayer({
      id: "agent",
      name: "Agent",
      icon: "message-circle",
      // Activé d'office, contrairement au dessin : il ne s'arme sur rien,
      // il attend un trait d'annotation.
      defaultEnabled: true,
      // Même garde que doc-widget et annotation : pas dans une feuille flottante.
      appliesTo: (view) => view.leaf.parent !== null,
      create: (ctx) => createAgentLayer(ctx)
    });
  }
};
