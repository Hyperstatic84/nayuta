/*
 * Dialecte Macabre — moteur de conversion.
 *
 * Transforme une phrase française ordinaire dans le parler apocalyptique de
 * Nayuta, l'enfant cornue de la nouvelle « La Prophétie de Nayuta » de
 * Tatsuki Fujimoto.
 *
 * La conversion est déterministe : une même phrase, au même niveau et à la
 * même variante, produit toujours la même prophétie. Le bouton « Reformuler »
 * incrémente la variante pour tirer une autre formulation.
 *
 * Niveaux d'intensité :
 *   1 — Murmure      : substitutions lexicales seulement.
 *   2 — Malédiction  : + interjections, ponctuation funeste, apartés.
 *   3 — Apocalypse   : + sentence finale de ruine, emphase en majuscules, ☠.
 */

const Nayuta = (() => {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* Aléa déterministe                                                   */
  /* ------------------------------------------------------------------ */

  // Hachage FNV-1a 32 bits d'une chaîne, pour ancrer le générateur.
  function hacher(chaine) {
    let h = 0x811c9dc5;
    for (let i = 0; i < chaine.length; i++) {
      h ^= chaine.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  // Générateur mulberry32 : rapide, suffisant pour choisir des formules.
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
  /* Lexique macabre                                                     */
  /* ------------------------------------------------------------------ */

  // Chaque entrée : motif (insensible à la casse, bornes de mots) → variantes.
  // Les motifs les plus longs sont testés en premier pour éviter qu'un mot
  // court ne « vole » une expression entière (ex. « bonne nuit » avant « nuit »).
  const LEXIQUE = [
    ["bonne nuit", ["que les cauchemars te bercent", "sombre dans la petite mort du sommeil"]],
    ["s'il te plaît", ["si tu tiens à ton âme", "avant que ma patience ne pourrisse"]],
    ["s'il vous plaît", ["si vous tenez à vos âmes", "avant que ma patience ne pourrisse"]],
    ["tout le monde", ["chaque mortel condamné", "toutes les âmes promises au néant"]],
    ["au revoir", ["retourne au néant", "que la poussière te reprenne"]],
    ["bonjour", ["sombres salutations", "que les ténèbres te trouvent", "salutations, futur cadavre"]],
    ["bonsoir", ["que le crépuscule t'engloutisse", "sinistres salutations vespérales"]],
    ["salut", ["sombres salutations", "salutations, chair périssable"]],
    ["merci", ["ta servitude est notée", "les ténèbres retiendront ton offrande"]],
    ["oui", ["ainsi soit la ruine", "qu'il en soit ainsi, jusqu'à la fin"]],
    ["non", ["jamais, même dans la mort", "plutôt le néant"]],
    ["demain", ["à l'aube du Jugement", "quand le monde aura encore pourri d'un jour"]],
    ["aujourd'hui", ["en ce jour de ruine", "en cette ère agonisante"]],
    ["hier", ["au temps où le monde respirait encore", "dans les cendres d'avant"]],
    ["toujours", ["jusqu'à l'extinction des étoiles", "tant que la ruine durera"]],
    ["jamais", ["pas même quand les étoiles s'éteindront", "jamais, ni en ce monde ni dans ses cendres"]],
    ["manger", ["dévorer", "engloutir comme la tombe engloutit"]],
    ["mange", ["dévore", "engloutis"]],
    ["mangé", ["dévoré", "englouti"]],
    ["boire", ["s'abreuver aux dernières sources du monde"]],
    ["dormir", ["gésir dans la petite mort", "sombrer dans les limbes"]],
    ["maison", ["crypte", "tanière funèbre", "sanctuaire de l'enfant cornue"]],
    ["école", ["sanctuaire des âmes perdues", "purgatoire des jeunes mortels"]],
    ["travail", ["labeur sépulcral", "servitude terrestre"]],
    ["travailler", ["s'user jusqu'à l'os", "servir en attendant la fin"]],
    ["argent", ["poussière que les morts n'emportent pas", "métal des vivants naïfs"]],
    ["amis", ["âmes condamnées", "compagnons de ruine", "futures ombres"]],
    ["amie", ["âme condamnée", "compagne de ruine"]],
    ["ami", ["âme condamnée", "compagnon de ruine", "future ombre"]],
    ["famille", ["lignée maudite", "sang partagé avant la fin"]],
    ["frère", ["frère de malédiction", "gardien de l'enfant cornue"]],
    ["sœur", ["sœur de malédiction"]],
    ["soeur", ["sœur de malédiction"]],
    ["enfants", ["progénitures du crépuscule", "petites âmes en sursis"]],
    ["enfant", ["progéniture du crépuscule", "petite âme en sursis"]],
    ["gens", ["mortels", "âmes en sursis", "foule promise au néant"]],
    ["personnes", ["âmes en sursis", "mortels"]],
    ["monde", ["monde condamné", "monde agonisant", "monde promis à ma main"]],
    ["ville", ["nécropole en devenir", "cité aux fondations de cendre"]],
    ["soleil", ["astre agonisant", "brasier moribond du ciel"]],
    ["lune", ["œil blafard des ténèbres", "lanterne des trépassés"]],
    ["étoiles", ["braises mourantes du firmament"]],
    ["ciel", ["voûte qui s'effondrera", "linceul céleste"]],
    ["pluie", ["larmes du ciel condamné"]],
    ["fleurs", ["efflorescences du dernier jour", "fleurs écloses sur les ruines"]],
    ["fleur", ["efflorescence du dernier jour", "fleur éclose sur les ruines"]],
    ["chien", ["cerbère domestique", "limier des limbes"]],
    ["chat", ["spectre félin", "familier des ténèbres"]],
    ["oiseau", ["charognard en habit de fête"]],
    ["beau", ["funeste", "d'une splendeur sépulcrale"]],
    ["belle", ["funeste", "d'une splendeur sépulcrale"]],
    ["joli", ["délicieusement funèbre"]],
    ["jolie", ["délicieusement funèbre"]],
    ["bien", ["conformément à la prophétie"]],
    ["bon", ["digne d'un dernier festin"]],
    ["bonne", ["digne d'un dernier festin"]],
    ["heureux", ["repu de désolation", "comblé comme un charnier"]],
    ["heureuse", ["repue de désolation", "comblée comme un charnier"]],
    ["content", ["repu de désolation"]],
    ["contente", ["repue de désolation"]],
    ["triste", ["rongé par le crépuscule"]],
    ["peur", ["l'effroi qui précède la fin", "la juste terreur des mortels"]],
    ["aimer", ["vouer un culte funèbre à"]],
    ["adore", ["voue un culte funèbre à"]],
    ["aime", ["voue un culte funèbre à"]],
    ["veux", ["exige, par les cornes de la fin,"]],
    ["voudrais", ["exigerais, si le monde durait assez,"]],
    ["vite", ["plus vite que la fin ne vient"]],
    ["dodo", ["repos sépulcral"]],
    ["bisous", ["morsures affectueuses"]],
    ["gâteau", ["offrande sucrée du condamné"]],
    ["chocolat", ["ténèbres comestibles"]],
    ["café", ["décoction noire comme l'abîme"]],
    ["eau", ["eau des dernières sources"]],
    ["nuit", ["longue répétition du néant"]],
    ["matin", ["sursis d'aube"]],
    ["vacances", ["trêve avant l'anéantissement"]],
    ["fête", ["danse macabre", "dernier banquet"]],
    ["musique", ["thrène", "chant du glas"]],
    ["chanson", ["complainte funèbre"]],
    ["dieu", ["celui qui a détourné les yeux"]],
    ["merde", ["excrément du destin"]],
    ["super", ["digne des dernières splendeurs"]],
    ["génial", ["glorieusement funeste"]],
    ["petit", ["chétif comme un espoir humain"]],
    ["petite", ["chétive comme un espoir humain"]],
    ["grand", ["vaste comme le néant"]],
    ["grande", ["vaste comme le néant"]],
    ["vivre", ["s'attarder parmi les condamnés"]],
    ["mourir", ["rejoindre enfin la grande promesse"]],
    ["mort", ["délivrance annoncée"]],
    ["vie", ["brève étincelle avant l'obscur"]],
    ["amour", ["attachement de condamnés"]],
    ["espoir", ["douce illusion de mortel"]],
    ["avenir", ["compte à rebours"]],
    ["problème", ["présage"]],
    ["chance", ["sursis accordé par la fin"]],
  ];

  // Compilation en un unique motif alterné, appliqué en une seule passe :
  // ainsi le texte issu d'une substitution n'est jamais re-substitué par une
  // règle suivante (pas de cascade). Bornes de mots compatibles avec les
  // lettres accentuées (\b de JS échoue sur « é », « ï », etc.) ; le trait
  // d'union compte comme une lettre pour ne pas découper « veux-tu ».
  const LETTRE = "A-Za-zÀ-ÖØ-öø-ÿŒœ\\-";
  const PAR_MOTIF = new Map(LEXIQUE.map(([motif, variantes]) => [motif, variantes]));
  const MOTIF_GLOBAL = (() => {
    const alternation = LEXIQUE
      .map(([motif]) => motif)
      .sort((a, b) => b.length - a.length)
      .map((motif) => motif.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");
    return new RegExp(`(^|[^${LETTRE}])(${alternation})(?=[^${LETTRE}]|$)`, "giu");
  })();

  // Restitue la casse du mot d'origine sur son remplacement.
  function appliquerCasse(original, remplacement) {
    if (original === original.toUpperCase() && original.length > 1) {
      return remplacement.toUpperCase();
    }
    if (original[0] === original[0].toUpperCase()) {
      return remplacement.charAt(0).toUpperCase() + remplacement.slice(1);
    }
    return remplacement;
  }

  /* ------------------------------------------------------------------ */
  /* Formules prophétiques                                               */
  /* ------------------------------------------------------------------ */

  const INTERJECTIONS = [
    "Kekeke…",
    "Écoute, mortel :",
    "La prophétie l'a dit :",
    "Par mes cornes,",
    "Tremble, vermine :",
    "Les entrailles du monde murmurent :",
    "Ainsi grince la fin :",
  ];

  const APARTES = [
    " — et les corbeaux approuvent — ",
    " — le glas sonne déjà — ",
    " — la terre s'en souviendra — ",
    " — les ombres en témoignent — ",
  ];

  const SENTENCES_FINALES = [
    "Et le monde périra.",
    "Ainsi parle Nayuta, et nul n'en réchappera.",
    "Les cornes de la fin se dressent déjà.",
    "Nul n'échappera au crépuscule. MOURREZ TOUS.",
    "Que les fleurs de la ruine recouvrent le ciel.",
    "Le compte à rebours du monde continue.",
  ];

  const QUESTIONS = [
    " Réponds, vermine.",
    " Réponds, avant que le monde ne s'éteigne.",
    " La fin attend ta réponse.",
  ];

  /* ------------------------------------------------------------------ */
  /* Conversion                                                          */
  /* ------------------------------------------------------------------ */

  function substituerLexique(texte, alea) {
    return texte.replace(MOTIF_GLOBAL, (tout, avant, mot) => {
      const variantes = PAR_MOTIF.get(mot.toLowerCase());
      if (!variantes) return tout;
      return avant + appliquerCasse(mot, choisir(alea, variantes));
    });
  }

  function transformerPonctuation(texte, alea) {
    return texte
      .replace(/\s*!+/g, " !!! ☠")
      .replace(/\s*\?+/g, () => " ?!" + choisir(alea, QUESTIONS));
  }

  // Met en majuscules un mot « long » de la phrase pour l'emphase du niveau 3.
  function emphaseApocalyptique(texte, alea) {
    const mots = texte.split(" ");
    const candidats = mots
      .map((mot, i) => ({ mot, i }))
      .filter(({ mot }) => mot.replace(/[^A-Za-zÀ-ÖØ-öø-ÿŒœ]/gu, "").length >= 6);
    if (candidats.length === 0) return texte;
    const cible = choisir(alea, candidats);
    mots[cible.i] = mots[cible.i].toUpperCase();
    return mots.join(" ");
  }

  function convertir(texteBrut, niveau, variante) {
    // L'apostrophe typographique est ramenée à l'apostrophe droite pour que
    // « aujourd’hui » et « s’il te plaît » soient reconnus par le lexique.
    const texte = texteBrut.trim().replace(/’/g, "'");
    const alea = creerAlea(hacher(`${texte} ${niveau} ${variante}`));

    // Niveau 1 : le lexique seul.
    let corps = substituerLexique(texte, alea);
    const segments = [];

    // Niveau 2 : interjection d'ouverture, ponctuation funeste, aparté.
    if (niveau >= 2) {
      corps = transformerPonctuation(corps, alea);
      if (alea() < 0.5) {
        const virgules = corps.indexOf(", ");
        if (virgules !== -1) {
          corps =
            corps.slice(0, virgules) + choisir(alea, APARTES) + corps.slice(virgules + 2);
        }
      }
      segments.push({ texte: choisir(alea, INTERJECTIONS) + " ", doom: true });
    }

    // Niveau 3 : emphase hurlée et sentence de ruine.
    if (niveau >= 3) {
      corps = emphaseApocalyptique(corps, alea);
    }

    // La phrase du mortel, transfigurée.
    if (!/[.!?…☠]\s*$/.test(corps)) corps += "…";
    segments.push({ texte: corps, doom: false });

    if (niveau >= 3) {
      const prefixe = corps.endsWith("☠") ? " " : " ☠ ";
      segments.push({ texte: prefixe + choisir(alea, SENTENCES_FINALES), doom: true });
    }

    return {
      texte: segments.map((s) => s.texte).join(""),
      segments,
    };
  }

  return { convertir };
})();

// Export pour les tests sous Node ; sans effet dans le navigateur.
if (typeof module !== "undefined" && module.exports) {
  module.exports = Nayuta;
}
