/*
 * Dialecte Macabre — générateur de litanies.
 *
 * Nayuta, l'enfant cornue de la nouvelle « La Prophétie de Nayuta » de Tatsuki
 * Fujimoto, ne construit pas de phrases : elle égrène une suite de mots
 * macabres, sans syntaxe.
 *
 *   → « chant du glas… ASTICOTS… entrailles fumantes… linceul… ☠ »
 *
 * Le générateur tire ses éléments dans deux fonds : des mots isolés et des
 * locutions funestes. Toutes sont des groupes nominaux — jamais de sujet ni de
 * verbe conjugué, donc rien qui puisse se recoller en phrase. Un test veille
 * sur cet invariant.
 *
 * `generer()` tire une litanie au hasard ; `generer(graine)` rejoue toujours
 * la même, ce dont les tests se servent.
 */

const Nayuta = (() => {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* Aléa                                                                */
  /* ------------------------------------------------------------------ */

  // Générateur mulberry32 : à graine égale, litanie égale.
  function creerAlea(graine) {
    let a = graine >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function choisir(alea, liste) {
    return liste[Math.floor(alea() * liste.length)];
  }

  /* ------------------------------------------------------------------ */
  /* Vocabulaire du dialecte                                             */
  /* ------------------------------------------------------------------ */

  // Deux règles pour toute entrée ajoutée ici :
  //   1. mot ou locution attestés en français — jamais de terme forgé ;
  //   2. groupe nominal, jamais de proposition (un test le vérifie).
  const MOTS = [
    "abattoir", "abîme", "abysses", "agonie", "agonisant", "anéantissement",
    "apocalypse", "asphyxie", "asticots", "billot", "boucherie", "boyaux",
    "brasier", "bûcher", "cachot", "cadavre", "calcination", "calvaire",
    "carcasse", "carnage", "cataclysme", "catacombes", "cauchemar", "caveau",
    "cendres", "cercueil", "chaînes", "chair", "chairs", "chaos", "charnier",
    "charognards", "charogne", "châtiment", "contagion", "convulsions",
    "corbeaux", "cornes", "crâne", "crépuscule", "crocs", "crypte", "curée",
    "damnation", "décapitation", "décombres", "décomposition", "décrépitude",
    "déluge", "démence", "démon", "dépeçage", "dépouille", "désastre",
    "désolation", "douleur", "écartèlement", "échafaud", "échine", "écorché",
    "effondrement", "effroi", "égorgement", "empalement", "entrailles",
    "épidémie", "épouvante", "éventration", "éviscération", "excréments",
    "extermination", "extinction", "famine", "fange", "fantôme", "faucheuse",
    "fauve", "fémurs", "fers", "fléau", "folie", "fosse", "fournaise",
    "funérailles", "fureur", "gangrène", "gémissement", "gibet", "glas",
    "gouffre", "goule", "griffes", "gueule", "guillotine", "hécatombe",
    "hémorragie", "horreur", "hurlement", "hyène", "immolation", "incendie",
    "jugement", "lamentation", "lapidation", "larves", "linceul", "mâchoire",
    "malédiction", "martyre", "massacre", "mausolée", "meurtre", "meute",
    "miasme", "moelle", "moignons", "moisissure", "monstre", "moribond",
    "mort", "mouroir", "mutilation", "naufrage", "néant", "nécropole",
    "nécrose", "noyade", "noyé", "orbites", "ossements", "ossuaire",
    "oubliettes", "pendu", "peste", "pestilence", "phalanges", "plaie",
    "poison", "potence", "pourriture", "présage", "puanteur", "pus",
    "putréfaction", "putrescence", "rage", "râle", "requiem", "revenant",
    "ricanement", "rictus", "ruine", "saignée", "saigneur", "sang", "sanglot",
    "sanie", "sarcophage", "scorpion", "sépulcre", "serres", "sévices",
    "spasmes", "spectre", "squelette", "stèle", "strangulation", "suaire",
    "supplice", "supplicié", "ténèbres", "terreur", "thrène", "tombe",
    "tombeau", "torture", "tourment", "trépas", "tripes", "tuerie", "vautour",
    "venin", "vermine", "vermisseaux", "vertèbres", "vipère", "viscères",
  ];

  const LOCUTIONS = [
    "aube écarlate", "bave écarlate", "brume rouge", "caillot noir",
    "cercueil vide", "chair à vif", "chair putréfiée", "chairs déchirées",
    "champ de ruines", "chant du glas", "chœur de damnés", "ciel de suie",
    "cité engloutie", "corbeaux repus", "corps démembré", "cortège funèbre",
    "coup de grâce", "crâne défoncé", "crâne fracassé", "cri d'agonie",
    "cri étranglé", "crocs rougis", "danse macabre", "décomposition putride",
    "dents brisées", "dernier souffle", "écume sanglante",
    "entrailles fumantes", "flaque de bile", "flot de sang", "fosse commune",
    "froid de sépulcre", "gerbe de sang", "gorge ouverte", "gorge tranchée",
    "griffes sanglantes", "grouillement d'asticots", "haleine fétide",
    "hurlement sourd", "lente putréfaction", "linceul souillé", "lune rouge",
    "mâchoire décrochée", "mare de sang", "marée de sang", "membres arrachés",
    "membres épars", "mer de cendres", "meute affamée", "monceau de cadavres",
    "monde calciné", "morsure profonde", "mort lente", "mort subite",
    "murmure d'outre-tombe", "nuée de mouches", "nuit sans fin",
    "odeur de charnier", "odeur de sang", "ombre difforme", "orbites vides",
    "os à nu", "os brisés", "peau arrachée", "plaie béante",
    "pluie de cendres", "pluie de sang", "présage écarlate",
    "procession de spectres", "prophétie funeste", "râle d'agonie",
    "regard vide", "rire dément", "sang caillé", "sang noir",
    "sanglot étouffé", "silence de mort", "silence de tombe", "soif de sang",
    "soleil noir", "souffle putride", "sourire édenté", "terre remuée",
    "tombe ouverte", "ultime râle", "vautours affamés", "veillée mortuaire",
    "vent de peste", "ventre ouvert", "viscères épars", "yeux crevés",
    "yeux vitreux",
  ];

  /* ------------------------------------------------------------------ */
  /* Génération                                                          */
  /* ------------------------------------------------------------------ */

  const LONGUEUR_MIN = 4;
  const LONGUEUR_MAX = 9;

  // Une locution de temps en temps : assez pour donner du relief, pas assez
  // pour noyer les mots isolés qui font le rythme de la litanie.
  const PART_LOCUTIONS = 0.3;
  const PART_HURLEMENTS = 0.3;

  function generer(graine) {
    const alea = creerAlea(graine === undefined ? (Math.random() * 2 ** 32) >>> 0 : graine);
    const longueur = LONGUEUR_MIN + Math.floor(alea() * (LONGUEUR_MAX - LONGUEUR_MIN + 1));

    const elements = [];
    while (elements.length < longueur) {
      const element = choisir(alea, alea() < PART_LOCUTIONS ? LOCUTIONS : MOTS);
      // Jamais deux fois de suite le même élément : la litanie bégaierait.
      if (element !== elements[elements.length - 1]) elements.push(element);
    }

    const segments = elements.map((element, i) => {
      const hurle = alea() < PART_HURLEMENTS;
      const dernier = i === elements.length - 1;
      return {
        texte: (hurle ? element.toUpperCase() : element) + "…" + (dernier ? "" : " "),
        doom: hurle,
      };
    });

    segments.push({ texte: " ☠", doom: true });

    return {
      texte: segments.map((s) => s.texte).join(""),
      segments,
    };
  }

  return { generer };
})();

// Export pour les tests sous Node ; sans effet dans le navigateur.
if (typeof module !== "undefined" && module.exports) {
  module.exports = Nayuta;
}
