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

  const MOTS = [
    "abattoir", "abîme", "abysses", "adieux", "agonie", "anéantissement",
    "angoisse", "apocalypse", "arcane", "asticots", "banquet", "billot",
    "boyaux", "braise", "braises", "brasier", "brouet", "bûcher", "cachot",
    "cadavre", "calcination", "calvaire", "carcasse", "carnage", "cataclysme",
    "catacombes", "cauchemar", "cauchemars", "caveau", "cendre", "cendres",
    "cerbère", "cercueil", "chaînes", "chair", "chaos", "charnier",
    "charognard", "charognards", "charogne", "charognes", "châtiment",
    "chimère", "chronique", "cloporte", "colosse", "colosses", "complainte",
    "complot", "conciliabule", "condamnation", "contagion", "convocation",
    "corbeau", "corbeaux", "corneille", "cornes", "crâne", "crépuscule",
    "croc", "crocs", "crypte", "damnation", "débris", "décombres",
    "décomposition", "décrépitude", "délire", "déluge", "démence", "démon",
    "dépouille", "désastre", "désespoir", "désolation", "dessein", "détresse",
    "deuil", "disette", "douleur", "duel", "éboulis", "écailles", "échafaud",
    "échéance", "échéances", "échine", "effondrement", "effroi", "embuscade",
    "énigme", "entrailles", "épidémie", "épines", "épitaphe", "épouvante",
    "épuisement", "errance", "essaim", "étau", "étincelle", "excréments",
    "exode", "extinction", "famine", "fange", "fantôme", "faucheuse", "fauve",
    "fémur", "fémurs", "fers", "festin", "fléau", "fléaux", "flétrissure",
    "flétrissures", "folie", "fosse", "fourberie", "fournaise", "froid",
    "fuite", "funèbre", "funérailles", "funeste", "fureur", "gangrène",
    "gargouille", "gémissement", "geôle", "geôlier", "germe", "gibet",
    "givre", "glas", "gouffre", "gouffres", "goule", "griffe", "griffes",
    "grimace", "grimoire", "guet", "gueule", "guillotine", "haillons",
    "hantise", "hâte", "hémorragie", "horde", "horreur", "hurlement", "hyène",
    "illusions", "incendie", "jugement", "lamentation", "langueur", "larmes",
    "larve", "larves", "léthé", "limbes", "linceul", "lutte", "lymphe",
    "mâchoire", "malédiction", "martyre", "massacre", "mausolée", "mêlée",
    "meute", "miasme", "moelle", "moignon", "moignons", "moisissure",
    "monstre", "mort", "mouroir", "murmure", "mutilation", "naufrage",
    "néant", "nécropole", "noyade", "nuée", "obscurité", "offrande",
    "offrandes", "ombre", "ombres", "opprobre", "oracle", "orbite", "orbites",
    "ossements", "ossuaire", "oubli", "oubliettes", "pénombre", "perdition",
    "peste", "pestilence", "phalange", "phalanges", "plaie", "potence",
    "pourriture", "pourritures", "poussière", "présage", "présages",
    "procession", "progéniture", "progénitures", "puanteur", "purgatoire",
    "putréfaction", "rage", "râle", "rapine", "repentir", "requiem",
    "revenant", "ricanement", "rictus", "ronces", "rouille", "ruine",
    "rumeur", "rumeurs", "sable", "sablier", "sabot", "sabots", "saigneur",
    "sanglot", "sanie", "sarabande", "sarabandes", "sarcophage", "scorpion",
    "sépulcral", "sépulcrale", "sépulcre", "serre", "serres", "solitude",
    "sortilège", "souffle", "spectre", "spectres", "squelette", "stèle",
    "styx", "suaire", "suie", "suif", "supplice", "tanière", "ténèbres",
    "terreur", "thrène", "toile", "tombe", "tombeau", "tombes", "tonnerre",
    "torpeur", "torture", "tourment", "transe", "trépas", "trêve", "tyran",
    "vautour", "veille", "verdict", "vermine", "vermisseaux", "vertèbres",
    "vertige", "vide", "vipère", "viscère", "viscères", "voile", "voiles",
  ];

  const LOCUTIONS = [
    "aube écarlate", "bave écarlate", "brume rouge", "caillot noir",
    "cercueil vide", "chair putréfiée", "champ de ruines", "chant du glas",
    "chœur de damnés", "ciel de suie", "cité engloutie", "cloches fêlées",
    "compte à rebours", "corbeaux repus", "cortège funèbre", "crâne fracassé",
    "cri étranglé", "crocs rougis", "danse macabre", "décomposition putride",
    "dents brisées", "dernier souffle", "écume sanglante",
    "entrailles fumantes", "flaque de bile", "fosse commune",
    "froid de sépulcre", "gerbe de sang", "gorge tranchée", "griffes noires",
    "grouillement d'asticots", "haleine fétide", "heure dernière",
    "hurlement sourd", "lente putréfaction", "linceul souillé", "lune rouge",
    "mâchoire décrochée", "marée de sang", "membres arrachés",
    "mer de cendres", "meute affamée", "monde calciné", "mort lente",
    "mort subite", "murmure d'outre-tombe", "nuée de mouches",
    "nuit sans fin", "odeur de charnier", "ombre difforme", "orbites vides",
    "os brisés", "plaie béante", "pluie de cendres", "pluie de sang",
    "présage écarlate", "procession de spectres", "prophétie funeste",
    "regard vide", "rire dément", "ruine annoncée", "sang caillé",
    "sang noir", "sanglot étouffé", "sentence irrévocable",
    "silence de tombe", "soleil noir", "souffle putride", "sourire édenté",
    "terre remuée", "terre stérile", "tombe ouverte", "ultime râle",
    "vautours patients", "veillée mortuaire", "vent de peste",
    "viscères épars", "yeux crevés",
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
