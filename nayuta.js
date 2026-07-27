/*
 * Dialecte Macabre — moteur de conversion.
 *
 * Transfigure une phrase française ordinaire dans le parler de Nayuta,
 * l'enfant cornue de la nouvelle « La Prophétie de Nayuta » de Tatsuki
 * Fujimoto. Fidèle à la version française : Nayuta ne construit pas de
 * phrases — elle égrène une litanie de mots macabres, sans syntaxe.
 *
 *   « Bonjour, veux-tu manger avec moi demain ? »
 *   → « ténèbres… faim… chair… jugement… »
 *
 * Chaque mot porteur de sens de la phrase d'origine est traduit vers un mot
 * funeste : par correspondance thématique quand le concept est connu, sinon
 * par un tirage déterministe dans le vocabulaire général — un même mot
 * français donne donc toujours la même « traduction », comme un vrai
 * dictionnaire. Les mots-outils (articles, pronoms…) sont ignorés : la
 * grammaire est une faiblesse de mortel.
 *
 * La conversion est déterministe : même phrase, même niveau, même variante
 * produisent la même litanie. « Reformuler » incrémente la variante.
 *
 * Niveaux d'intensité :
 *   1 — Murmure      : litanie basse, tout en minuscules.
 *   2 — Malédiction  : ricanement d'ouverture, mots hurlés en majuscules.
 *   3 — Apocalypse   : mots funestes surnuméraires, ☠, sentence finale.
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

  // Générateur mulberry32 : rapide, suffisant pour choisir des mots.
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

  // Fonds général : les mots inconnus du thésaurus y puisent leur traduction.
  const VOCABULAIRE = [
    "mort", "sang", "cadavre", "ténèbres", "ruine", "cendre", "ossements",
    "charogne", "néant", "pourriture", "crâne", "tombe", "glas", "abîme",
    "fléau", "vermine", "agonie", "supplice", "crépuscule", "malédiction",
    "damnation", "sépulcre", "linceul", "spectre", "corbeau", "peste",
    "carnage", "massacre", "désolation", "extinction", "trépas", "entrailles",
    "fange", "asticots", "griffes", "cornes", "hurlement", "gouffre",
    "cauchemar", "effroi", "lamentation", "brasier", "poussière", "froid",
    "silence", "oubli", "déluge", "famine", "chair", "fosse", "tourment",
  ];

  // Thésaurus : concepts français connus → mots funestes apparentés.
  const THEMES = new Map(Object.entries({
    "bonjour": ["ténèbres", "glas", "effroi"],
    "bonsoir": ["crépuscule", "ténèbres"],
    "salut": ["effroi", "ossements"],
    "coucou": ["spectre", "effroi"],
    "merci": ["offrande", "servitude"],
    "pardon": ["repentir", "supplice"],
    "désolé": ["repentir", "supplice"],
    "revoir": ["adieux", "néant"],
    "oui": ["fatalité", "soumission"],
    "non": ["refus", "néant"],
    "manger": ["dévorer", "chair", "festin"], "mange": ["dévorer", "chair", "festin"],
    "mangé": ["dévorer", "chair", "festin"], "nourriture": ["chair", "festin"],
    "faim": ["dévorer", "famine"], "repas": ["festin", "chair"],
    "boire": ["sang", "fiel"], "bois": ["sang", "fiel"], "soif": ["sang", "fiel"],
    "maison": ["crypte", "tombeau", "tanière"], "chez": ["crypte", "tanière"],
    "école": ["purgatoire", "limbes"],
    "travail": ["labeur", "chaînes", "servitude"], "travaille": ["labeur", "chaînes"],
    "travailler": ["labeur", "chaînes"], "boulot": ["labeur", "servitude"],
    "argent": ["poussière", "avarice"],
    "ami": ["charogne", "ombre", "proie"], "amie": ["charogne", "ombre", "proie"],
    "amis": ["charognes", "ombres", "proies"], "amies": ["charognes", "ombres"],
    "copain": ["charogne", "proie"], "copine": ["charogne", "proie"],
    "famille": ["lignée", "sang"], "parents": ["lignée", "sang"],
    "frère": ["lignée", "sang"], "sœur": ["lignée", "sang"], "soeur": ["lignée", "sang"],
    "enfant": ["progéniture", "larve"], "enfants": ["progénitures", "larves"],
    "bébé": ["progéniture", "larve"],
    "gens": ["vermine", "troupeau"], "personnes": ["vermine", "troupeau"],
    "foule": ["vermine", "troupeau"],
    "monde": ["ruine", "apocalypse", "fin"],
    "ville": ["nécropole", "décombres"], "rue": ["nécropole", "décombres"],
    "soleil": ["brasier", "agonie"], "jour": ["brasier", "agonie"],
    "journée": ["agonie", "sursis"], "matin": ["brasier", "sursis"],
    "lune": ["spectre", "linceul"], "nuit": ["ténèbres", "linceul"],
    "soir": ["crépuscule", "ténèbres"], "soirée": ["crépuscule", "ténèbres"],
    "étoile": ["braises", "vide"], "étoiles": ["braises", "vide"],
    "ciel": ["voûte", "vide"],
    "pluie": ["larmes", "déluge"], "eau": ["noyade", "déluge"], "mer": ["noyade", "abysses"],
    "fleur": ["flétrissure", "épines"], "fleurs": ["flétrissures", "épines"],
    "jardin": ["flétrissure", "épines"],
    "chien": ["cerbère", "crocs"], "chat": ["spectre", "griffes"],
    "chats": ["spectres", "griffes"],
    "oiseau": ["charognard", "corbeau"], "oiseaux": ["charognards", "corbeaux"],
    "beau": ["funeste", "sépulcral"], "belle": ["funeste", "sépulcrale"],
    "joli": ["funeste", "sépulcral"], "jolie": ["funeste", "sépulcrale"],
    "magnifique": ["funeste", "sépulcral"],
    "bien": ["fatal", "funèbre"], "bon": ["fatal", "funèbre"],
    "bonne": ["fatale", "funèbre"], "super": ["fatal", "funèbre"],
    "génial": ["fatal", "funèbre"], "cool": ["fatal", "funèbre"],
    "heureux": ["désolation", "charnier"], "heureuse": ["désolation", "charnier"],
    "content": ["désolation", "charnier"], "contente": ["désolation", "charnier"],
    "joie": ["désolation", "charnier"], "bonheur": ["désolation", "charnier"],
    "triste": ["lamentation", "complainte"], "tristesse": ["lamentation", "complainte"],
    "pleure": ["lamentation", "larmes"], "pleurer": ["lamentation", "larmes"],
    "peur": ["effroi", "terreur"], "effrayant": ["effroi", "terreur"],
    "aime": ["morsure", "possession", "dévotion"], "aimes": ["morsure", "possession"],
    "aimer": ["morsure", "possession", "dévotion"], "amour": ["morsure", "possession"],
    "adore": ["dévotion", "possession"], "adorer": ["dévotion", "possession"],
    "veux": ["faim", "exigence"], "veut": ["faim", "exigence"],
    "voudrais": ["faim", "exigence"], "envie": ["faim", "exigence"],
    "désir": ["faim", "exigence"],
    "dors": ["gésir", "limbes"], "dormir": ["gésir", "limbes"],
    "dodo": ["gésir", "limbes"], "sommeil": ["limbes", "cauchemar"],
    "rêve": ["cauchemar", "limbes"], "rêves": ["cauchemars", "limbes"],
    "demain": ["jugement", "échéance"], "futur": ["jugement", "échéance"],
    "avenir": ["jugement", "échéance"],
    "aujourd'hui": ["agonie", "sursis"],
    "hier": ["cendres", "oubli"], "passé": ["cendres", "oubli"],
    "mourir": ["trépas", "massacre"], "mort": ["trépas", "charnier"],
    "morte": ["trépas", "charnier"], "meurt": ["trépas", "massacre"],
    "meurs": ["trépas", "massacre"], "tuer": ["massacre", "carnage"],
    "tue": ["massacre", "carnage"],
    "vie": ["sursis", "étincelle"], "vivre": ["sursis", "étincelle"],
    "vivant": ["sursis", "étincelle"], "vis": ["sursis", "étincelle"],
    "espoir": ["illusion", "mirage"], "chance": ["illusion", "mirage"],
    "dieu": ["abandon", "silence"], "dieux": ["abandon", "silence"],
    "fête": ["sarabande", "banquet"], "anniversaire": ["sarabande", "banquet"],
    "noël": ["sarabande", "banquet"],
    "musique": ["thrène", "complainte"], "chanson": ["thrène", "complainte"],
    "chante": ["thrène", "glas"], "chanter": ["thrène", "glas"],
    "gâteau": ["offrande", "festin"], "chocolat": ["offrande", "festin"],
    "bonbon": ["offrande", "festin"], "bonbons": ["offrandes", "festin"],
    "sucre": ["offrande", "festin"],
    "café": ["fiel", "abîme"], "thé": ["fiel", "abîme"],
    "vacances": ["trêve", "sursis"], "repos": ["trêve", "sursis"],
    "pause": ["trêve", "sursis"],
    "problème": ["présage", "fléau"], "problèmes": ["présages", "fléaux"],
    "souci": ["présage", "fléau"], "soucis": ["présages", "fléaux"],
    "merde": ["fange", "excréments"], "putain": ["fange", "excréments"],
    "petit": ["larve", "miettes"], "petite": ["larve", "miettes"],
    "petits": ["larves", "miettes"], "petites": ["larves", "miettes"],
    "grand": ["colosse", "gouffre"], "grande": ["colosse", "gouffre"],
    "grands": ["colosses", "gouffres"], "grandes": ["colosses", "gouffres"],
    "vite": ["hâte", "fuite"], "rapide": ["hâte", "fuite"],
    "bisou": ["morsure", "étreinte"], "bisous": ["morsures", "étreinte"],
    "câlin": ["étreinte", "morsure"],
  }));

  // Mots-outils ignorés : Nayuta ne s'abaisse pas à la grammaire.
  const MOTS_VIDES = new Set([
    "le", "la", "les", "l", "un", "une", "des", "de", "du", "d", "au", "aux",
    "et", "ou", "or", "ni", "car", "mais", "donc", "a", "à", "en", "dans",
    "sur", "sous", "vers", "avec", "sans", "pour", "par", "entre", "chez",
    "que", "qu", "qui", "quoi", "dont", "où", "quand", "comme", "si",
    "je", "j", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles",
    "me", "m", "te", "t", "se", "s", "moi", "toi", "lui", "leur", "eux", "y",
    "mon", "ma", "mes", "ton", "ta", "tes", "son", "sa", "ses",
    "notre", "nos", "votre", "vos", "leurs",
    "ce", "c", "cet", "cette", "ces", "ça", "cela", "ceci",
    "est", "es", "suis", "sommes", "êtes", "sont", "être", "était", "sera",
    "ai", "as", "avons", "avez", "ont", "avoir", "avait", "aura",
    "ne", "n", "pas", "plus", "très", "trop", "peu", "aussi", "alors",
    "tout", "tous", "toute", "toutes", "autre", "autres", "même", "encore",
  ]);

  // Sentences finales du niveau Apocalypse — toujours hurlées.
  const FINALES = [
    ["MOURREZ", "TOUS"],
    ["MORT", "MORT", "MORT"],
    ["LA FIN", "VIENT"],
    ["LE MONDE", "PÉRIRA"],
  ];

  /* ------------------------------------------------------------------ */
  /* Découpage et traduction                                             */
  /* ------------------------------------------------------------------ */

  const LETTRE = "A-Za-zÀ-ÖØ-öø-ÿŒœ";
  const REGEX_MOT = new RegExp(`[${LETTRE}][${LETTRE}'-]*`, "gu");

  // Extrait les mots porteurs de sens, en minuscules, mots-outils écartés.
  // Un mot composé inconnu du thésaurus (« veux-tu ») est éclaté en parties.
  function extraireMots(texte) {
    const brut = texte.replace(/’/g, "'").toLowerCase();
    const tokens = brut.match(REGEX_MOT) || [];
    const mots = [];
    for (const token of tokens) {
      if (THEMES.has(token)) {
        mots.push(token);
        continue;
      }
      for (const part of token.split(/['-]/)) {
        if (part && !MOTS_VIDES.has(part)) mots.push(part);
      }
    }
    return mots;
  }

  // Traduit un mot français en mot funeste. Le tirage est ancré sur le mot
  // lui-même : un même mot donne toujours la même traduction — le dialecte
  // a son dictionnaire, seul « Reformuler » (la variante) le rebat.
  function traduire(mot, variante) {
    const aleaMot = creerAlea(hacher(`${mot}§${variante}`));
    return choisir(aleaMot, THEMES.get(mot) || VOCABULAIRE);
  }

  /* ------------------------------------------------------------------ */
  /* Conversion                                                          */
  /* ------------------------------------------------------------------ */

  function convertir(texteBrut, niveau, variante) {
    const texte = texteBrut.trim();
    const alea = creerAlea(hacher(`${texte} ${niveau} ${variante}`));

    let mots = extraireMots(texte).map((mot) => traduire(mot, variante));

    // Une litanie digne de ce nom compte au moins trois mots.
    while (mots.length < 3) mots.push(choisir(alea, VOCABULAIRE));

    // Niveau 3 : des mots funestes surnuméraires s'invitent dans la litanie.
    if (niveau >= 3) {
      const enrichis = [];
      for (const mot of mots) {
        enrichis.push(mot);
        if (alea() < 0.3) enrichis.push(choisir(alea, VOCABULAIRE));
      }
      mots = enrichis;
    }

    // Niveau 2+ : certains mots sont hurlés ; niveau 3 : ☠ s'accroche.
    const objets = mots.map((mot) => {
      let doom = false;
      if (niveau >= 2 && alea() < (niveau >= 3 ? 0.45 : 0.25)) {
        mot = mot.toUpperCase();
        doom = true;
      }
      if (niveau >= 3 && alea() < 0.2) {
        mot += " ☠";
        doom = true;
      }
      return { mot, doom };
    });

    // Niveau 2+ : un ricanement ouvre parfois la litanie.
    if (niveau >= 2 && alea() < 0.6) {
      objets.unshift({ mot: "kekeke", doom: true });
    }

    // Niveau 3 : la sentence finale, hurlée, scelle la prophétie.
    if (niveau >= 3) {
      for (const mot of choisir(alea, FINALES)) {
        objets.push({ mot, doom: true });
      }
      objets.push({ mot: "☠", doom: true });
    }

    const segments = objets.map((objet, i) => {
      const dernier = i === objets.length - 1;
      let texteSegment;
      if (dernier) {
        texteSegment = objet.mot === "☠" ? objet.mot : objet.mot + "…";
      } else {
        texteSegment = objet.mot + "… ";
      }
      return { texte: texteSegment, doom: objet.doom };
    });

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
