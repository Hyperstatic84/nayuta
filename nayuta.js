/*
 * Dialecte Macabre — moteur de conversion.
 *
 * Transfigure une phrase française ordinaire dans le parler de Nayuta,
 * l'enfant cornue de la nouvelle « La Prophétie de Nayuta » de Tatsuki
 * Fujimoto. Nayuta ne construit pas de phrases : elle égrène une suite de
 * mots macabres, sans syntaxe et sans sentence.
 *
 *   « Bonjour, veux-tu manger avec moi demain ? »
 *   → « glas… faim… CHAIR… jugement… ☠ »
 *
 * Chaque mot porteur de sens de la phrase d'origine est traduit vers un mot
 * funeste : par correspondance thématique quand le concept est connu, sinon
 * par un tirage déterministe dans le vocabulaire général — un même mot
 * français donne donc toujours la même « traduction », comme un vrai
 * dictionnaire. Les mots-outils (articles, pronoms…) sont ignorés : la
 * grammaire est une faiblesse de mortel.
 *
 * La conversion est déterministe : une même phrase donne toujours la même
 * litanie. « Reformuler » incrémente la variante pour en tirer une autre.
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

  // Le vocabulaire mêle mots isolés et locutions macabres (« gerbe de sang »,
  // « mort subite »). Toutes sont des groupes nominaux : jamais de sujet ni de
  // verbe conjugué, donc rien qui puisse se recoller en phrase. Un test veille
  // sur cet invariant.

  // Fonds général : les mots inconnus du thésaurus y puisent leur traduction.
  const VOCABULAIRE = [
    // Mort et sépulture
    "mort", "cadavre", "charogne", "dépouille", "carcasse", "ossements",
    "squelette", "crâne", "mâchoire", "fémur", "vertèbres", "moelle",
    "tombe", "fosse", "sépulcre", "caveau", "cercueil", "sarcophage",
    "ossuaire", "catacombes", "mausolée", "charnier", "linceul", "suaire",
    "épitaphe", "stèle", "funérailles", "deuil", "requiem", "trépas",
    // Décomposition et immondices
    "pourriture", "putréfaction", "décomposition", "gangrène", "moisissure",
    "rouille", "décrépitude", "asticots", "vermine", "cloporte", "fange",
    "miasme", "pestilence", "puanteur", "sanie", "suif", "entrailles",
    "viscères", "boyaux", "chair", "sang", "hémorragie", "plaie", "venin",
    // Fléaux et cataclysmes
    "fléau", "peste", "épidémie", "contagion", "famine", "disette", "déluge",
    "cataclysme", "désastre", "effondrement", "naufrage", "incendie",
    "brasier", "fournaise", "calcination", "suie", "cendre", "décombres",
    "éboulis", "ruine", "désolation", "extinction", "anéantissement",
    // Violence et châtiment
    "carnage", "massacre", "mutilation", "supplice", "tourment", "torture",
    "calvaire", "martyre", "châtiment", "condamnation", "verdict", "gibet",
    "potence", "échafaud", "guillotine", "bûcher", "billot", "abattoir",
    "cachot", "geôle", "oubliettes", "fers", "chaînes", "étau",
    // Ténèbres et néant
    "ténèbres", "pénombre", "obscurité", "abîme", "gouffre", "néant", "vide",
    "chaos", "oubli", "silence", "froid", "givre", "poussière", "crépuscule",
    "styx", "léthé", "sablier", "échéance",
    // Effroi et démence
    "effroi", "terreur", "horreur", "épouvante", "hantise", "angoisse",
    "détresse", "désespoir", "vertige", "obsession", "cauchemar", "démence",
    "délire", "folie", "transe", "torpeur", "langueur", "épuisement",
    // Voix funestes
    "hurlement", "râle", "gémissement", "sanglot", "lamentation", "thrène",
    "complainte", "glas", "ricanement", "rictus", "murmure", "malédiction",
    "damnation", "sortilège", "arcane", "grimoire", "oracle", "présage",
    // Créatures et bêtes
    "spectre", "fantôme", "revenant", "goule", "démon", "monstre", "chimère",
    "gargouille", "faucheuse", "corbeau", "vautour", "hyène", "corneille",
    "scorpion", "vipère", "fauve", "meute", "essaim", "nuée", "toile",
    "griffes", "crocs", "cornes", "écailles", "ronces", "épines",
    // Errance et perdition
    "exode", "errance", "perdition", "agonie", "guet", "veille", "haillons",
    // Locutions — chairs et humeurs
    "gerbe de sang", "sang caillé", "sang noir", "caillot noir",
    "écume sanglante", "bave écarlate", "flaque de bile", "haleine fétide",
    "chair putréfiée", "plaie béante", "entrailles fumantes", "viscères épars",
    "membres arrachés", "gorge tranchée", "yeux crevés", "orbites vides",
    "mâchoire décrochée", "dents brisées", "crâne fracassé", "os brisés",
    // Locutions — mort et pourriture
    "mort subite", "mort lente", "décomposition putride", "lente putréfaction",
    "odeur de charnier", "souffle putride", "grouillement d'asticots",
    "nuée de mouches", "fosse commune", "tombe ouverte", "terre remuée",
    "linceul souillé", "cercueil vide", "veillée mortuaire", "cortège funèbre",
    "procession de spectres", "chœur de damnés", "danse macabre",
    // Locutions — cieux et ruines
    "soleil noir", "lune rouge", "aube écarlate", "ciel de suie",
    "pluie de cendres", "pluie de sang", "marée de sang", "brume rouge",
    "vent de peste", "terre stérile", "champ de ruines", "cité engloutie",
    "monde calciné", "mer de cendres", "nuit sans fin",
    // Locutions — voix et présages
    "chant du glas", "cloches fêlées", "hurlement sourd", "cri étranglé",
    "sanglot étouffé", "murmure d'outre-tombe", "silence de tombe",
    "froid de sépulcre", "prophétie funeste", "présage écarlate",
    "sentence irrévocable", "compte à rebours", "heure dernière",
    "dernier souffle", "ultime râle", "ruine annoncée",
    // Locutions — bêtes et ombres
    "corbeaux repus", "vautours patients", "meute affamée", "crocs rougis",
    "griffes noires", "ombre difforme", "regard vide", "sourire édenté",
    "rire dément",
  ];

  // Thésaurus : concepts français connus → mots funestes apparentés.
  const THEMES = new Map(Object.entries({
    /* Salutations, politesse, assentiment */
    "bonjour": ["ténèbres", "glas", "effroi", "chant du glas"],
    "bonsoir": ["crépuscule", "ténèbres", "ciel de suie"],
    "salut": ["effroi", "ossements", "sourire édenté"],
    "coucou": ["spectre", "effroi"],
    "hello": ["ténèbres", "glas"], "allô": ["silence", "vide"], "allo": ["silence", "vide"],
    "bienvenue": ["seuil", "gueule"],
    "merci": ["offrande", "servitude"],
    "pardon": ["repentir", "supplice"], "désolé": ["repentir", "supplice"],
    "revoir": ["adieux", "néant"], "adieu": ["adieux", "néant"],
    "félicitations": ["condoléances", "raillerie"], "bravo": ["condoléances", "raillerie"],
    "santé": ["décrépitude", "agonie"],
    "oui": ["fatalité", "soumission"], "non": ["refus", "néant"],
    "ok": ["soumission", "fatalité"], "peut-être": ["présage", "fatalité"],
    "accord": ["pacte", "serment"],

    /* Temps et calendrier */
    "demain": ["jugement", "échéance"], "futur": ["jugement", "échéance"],
    "avenir": ["jugement", "échéance"],
    "aujourd'hui": ["agonie", "sursis"],
    "hier": ["cendres", "oubli"], "passé": ["cendres", "oubli"],
    "jour": ["brasier", "agonie"], "journée": ["agonie", "sursis"],
    "matin": ["brasier", "sursis"], "midi": ["brasier", "zénith"],
    "soir": ["crépuscule", "ténèbres"], "soirée": ["crépuscule", "ténèbres"],
    "nuit": ["ténèbres", "linceul", "nuit sans fin"],
    "minuit": ["ténèbres", "glas", "heure dernière"],
    "semaine": ["cycle", "sursis"], "week-end": ["trêve", "sursis"],
    "weekend": ["trêve", "sursis"],
    "lundi": ["labeur", "chaînes"], "mardi": ["labeur", "cycle"],
    "mercredi": ["cycle", "sursis"], "jeudi": ["cycle", "sursis"],
    "vendredi": ["sarabande", "sursis"], "samedi": ["sarabande", "trêve"],
    "dimanche": ["trêve", "silence"],
    "mois": ["cycle", "déclin"], "année": ["cycle", "déclin"],
    "an": ["cycle", "déclin"], "ans": ["cycles", "déclin"],
    "heure": ["échéance", "glas"], "heures": ["échéances", "glas"],
    "minute": ["sursis", "échéance"], "seconde": ["sursis", "échéance"],
    "printemps": ["flétrissure", "épines"], "automne": ["flétrissure", "pourriture"],
    "hiver": ["givre", "famine"],
    "temps": ["échéance", "sablier"], "tard": ["crépuscule", "échéance"],
    "début": ["genèse", "présage"], "fin": ["extinction", "terme"],
    "destin": ["fatalité", "verdict"],

    /* Ciel, éléments, paysages */
    "soleil": ["brasier", "agonie", "soleil noir"],
    "lune": ["spectre", "linceul", "lune rouge"],
    "étoile": ["braise", "vide"], "étoiles": ["braises", "vide"],
    "ciel": ["voûte", "vide"],
    "pluie": ["larmes", "déluge", "pluie de cendres", "pluie de sang"],
    "neige": ["linceul", "givre"],
    "vent": ["souffle", "râle"], "orage": ["fureur", "tonnerre"],
    "tempête": ["fureur", "déluge"], "brouillard": ["voile", "pénombre"],
    "nuage": ["voile", "pénombre"], "nuages": ["voiles", "pénombre"],
    "chaleur": ["brasier", "fièvre"], "chaud": ["brasier", "fièvre"],
    "froid": ["givre", "silence"], "glace": ["givre", "engourdissement"],
    "feu": ["brasier", "incendie"],
    "eau": ["noyade", "déluge"], "mer": ["noyade", "abysses"],
    "océan": ["abysses", "noyade"], "lac": ["noyade", "abysses"],
    "rivière": ["noyade", "styx"],
    "terre": ["fosse", "poussière"], "air": ["souffle", "miasme"],
    "pierre": ["stèle", "caveau"], "sable": ["poussière", "sablier"],
    "forêt": ["ronces", "ténèbres"], "arbre": ["gibet", "ronces"],
    "montagne": ["gouffre", "pierraille"], "plage": ["noyade", "sable"],
    "campagne": ["friche", "silence"],
    "fleur": ["flétrissure", "épines"], "fleurs": ["flétrissures", "épines"],
    "jardin": ["flétrissure", "épines"],

    /* Lieux et déplacements */
    "maison": ["crypte", "tombeau", "tanière"], "chez": ["crypte", "tanière"],
    "chambre": ["caveau", "cellule"],
    "école": ["purgatoire", "limbes"], "ville": ["nécropole", "décombres"],
    "rue": ["nécropole", "décombres"], "route": ["exode", "poussière"],
    "bureau": ["labeur", "cage"], "usine": ["labeur", "fournaise"],
    "magasin": ["avarice", "vermine"], "marché": ["avarice", "charognes"],
    "hôpital": ["mouroir", "agonie"], "église": ["ossuaire", "silence"],
    "cimetière": ["ossuaire", "tombes"], "parc": ["flétrissure", "silence"],
    "restaurant": ["abattoir", "festin"], "cuisine": ["abattoir", "fournaise"],
    "prison": ["geôle", "oubliettes"], "voyage": ["exode", "errance"],
    "voiture": ["carcasse", "ferraille"], "train": ["convoi", "ferraille"],
    "avion": ["chute", "carcasse"], "métro": ["catacombes", "vermine"],
    "bus": ["convoi", "vermine"], "vélo": ["carcasse", "ferraille"],
    "bateau": ["naufrage", "noyade"],

    /* Objets du quotidien */
    "lit": ["cercueil", "civière"], "table": ["autel", "billot"],
    "chaise": ["échafaud", "carcasse"], "porte": ["seuil", "gouffre"],
    "fenêtre": ["orbite", "vide"], "miroir": ["reflet", "spectre"],
    "clé": ["verrou", "geôle"],
    "livre": ["grimoire", "épitaphe"], "lettre": ["épitaphe", "testament"],
    "téléphone": ["glas", "murmure"], "portable": ["glas", "murmure"],
    "ordinateur": ["oracle", "rouage"], "écran": ["reflet", "abîme"],
    "internet": ["toile", "abîme"], "message": ["présage", "murmure"],
    "mail": ["présage", "glas"], "code": ["grimoire", "rouage"],
    "bug": ["fléau", "vermine"], "réunion": ["conciliabule", "supplice"],
    "photo": ["spectre", "reflet"], "film": ["spectre", "illusion"],
    "télé": ["reflet", "illusion"], "télévision": ["reflet", "illusion"],
    "vêtements": ["haillons", "linceul"], "habits": ["haillons", "linceul"],
    "chaussures": ["sabots", "haillons"], "robe": ["linceul", "suaire"],
    "argent": ["poussière", "avarice"], "cadeau": ["offrande", "tribut"],

    /* Corps */
    "tête": ["crâne", "trophée"], "visage": ["masque", "crâne"],
    "yeux": ["orbites", "braises"], "œil": ["orbite", "braise"],
    "oeil": ["orbite", "braise"],
    "main": ["griffe", "serre"], "mains": ["griffes", "serres"],
    "doigt": ["phalange", "griffe"], "doigts": ["phalanges", "griffes"],
    "bouche": ["gueule", "gouffre"], "dent": ["croc", "canine"],
    "dents": ["crocs", "canines"],
    "cœur": ["viscère", "organe"], "coeur": ["viscère", "organe"],
    "corps": ["carcasse", "dépouille"], "peau": ["cuir", "parchemin"],
    "os": ["ossements", "moelle"], "cheveux": ["crins", "filasse"],
    "sang": ["hémorragie", "gerbe de sang", "sang caillé"],
    "ventre": ["entrailles", "boyaux", "entrailles fumantes"],
    "jambe": ["fémur", "moignon"], "jambes": ["fémurs", "moignons"],
    "bras": ["moignon", "membre"], "dos": ["échine", "vertèbres"],
    "pied": ["sabot", "griffe"], "pieds": ["sabots", "griffes"],
    "sourire": ["rictus", "grimace"], "rire": ["ricanement", "rictus"],
    "voix": ["râle", "murmure"],

    /* Nourriture et boisson */
    "manger": ["chair", "festin", "crocs", "chair putréfiée"],
    "mange": ["chair", "festin", "crocs", "crocs rougis"],
    "mangé": ["chair", "festin", "crocs"], "nourriture": ["chair", "festin"],
    "faim": ["faim", "famine"], "repas": ["festin", "chair"],
    "boire": ["sang", "fiel"], "bois": ["sang", "fiel"], "soif": ["sang", "fiel"],
    "pain": ["offrande", "miettes"], "viande": ["chair", "charogne"],
    "fromage": ["moisissure", "putréfaction"], "pomme": ["pourriture", "ver"],
    "fruit": ["pourriture", "chute"], "fruits": ["pourritures", "chutes"],
    "légume": ["racine", "pourriture"], "soupe": ["brouet", "bouillon"],
    "pizza": ["offrande", "festin"], "riz": ["asticots", "grains"],
    "pâtes": ["vermisseaux", "asticots"], "salade": ["herbe", "flétrissure"],
    "frites": ["graisse", "cendres"], "burger": ["chair", "charogne"],
    "gâteau": ["offrande", "festin"], "chocolat": ["offrande", "festin"],
    "bonbon": ["offrande", "festin"], "bonbons": ["offrandes", "festin"],
    "sucre": ["offrande", "festin"], "miel": ["poison", "ambre"],
    "beurre": ["graisse", "suif"], "sel": ["cendre", "poussière"],
    "œuf": ["embryon", "coquille"], "oeuf": ["embryon", "coquille"],
    "lait": ["lymphe", "fiel"],
    "café": ["fiel", "abîme"], "thé": ["fiel", "abîme"],
    "vin": ["sang", "fiel"], "bière": ["fiel", "cercueil"],

    /* Êtres vivants */
    "chien": ["cerbère", "crocs"], "chat": ["spectre", "griffes"],
    "chats": ["spectres", "griffes"],
    "oiseau": ["charognard", "corbeau"], "oiseaux": ["charognards", "corbeaux"],
    "cheval": ["charogne", "monture"], "vache": ["carcasse", "abattoir"],
    "mouton": ["troupeau", "abattoir"], "poule": ["plumes", "abattoir"],
    "poisson": ["écailles", "noyade"], "souris": ["vermine", "rongeur"],
    "rat": ["vermine", "peste"], "rats": ["vermine", "peste"],
    "araignée": ["toile", "venin"], "loup": ["crocs", "meute"],
    "serpent": ["venin", "écailles"], "lapin": ["proie", "terrier"],
    "mouche": ["charogne", "asticots"], "abeille": ["essaim", "dard"],
    "insecte": ["vermine", "carapace"], "papillon": ["éphémère", "cendres"],
    "ours": ["fauve", "crocs"], "lion": ["fauve", "crocs"],
    "dragon": ["brasier", "écailles"],

    /* Relations et gens */
    "ami": ["charogne", "ombre", "proie"], "amie": ["charogne", "ombre", "proie"],
    "amis": ["charognes", "ombres", "proies"], "amies": ["charognes", "ombres"],
    "copain": ["charogne", "proie"], "copine": ["charogne", "proie"],
    "famille": ["lignée", "sang"], "parents": ["lignée", "sang"],
    "frère": ["lignée", "sang"], "sœur": ["lignée", "sang"], "soeur": ["lignée", "sang"],
    "enfant": ["progéniture", "larve"], "enfants": ["progénitures", "larves"],
    "bébé": ["progéniture", "larve"], "fils": ["progéniture", "héritier"],
    "fille": ["progéniture", "ombre"], "garçon": ["progéniture", "larve"],
    "homme": ["mortel", "vermine"], "femme": ["ombre", "veuve"],
    "mari": ["lignée", "serment"], "gars": ["mortel", "vermine"],
    "gens": ["vermine", "troupeau"], "personnes": ["vermine", "troupeau"],
    "foule": ["vermine", "troupeau"],
    "monde": ["ruine", "apocalypse", "monde calciné", "champ de ruines"],
    "voisin": ["témoin", "ombre"], "inconnu": ["spectre", "ombre"],
    "chef": ["tyran", "geôlier"], "patron": ["tyran", "geôlier"],
    "prof": ["geôlier", "oracle"], "professeur": ["geôlier", "oracle"],
    "docteur": ["charognard", "saigneur"], "médecin": ["charognard", "saigneur"],
    "roi": ["tyran", "couronne"], "reine": ["tyran", "couronne"],
    "police": ["meute", "geôliers"], "armée": ["horde", "meute"],
    "ennemi": ["proie", "charogne"],
    "guerre": ["carnage", "charnier"], "paix": ["silence", "trêve"],

    /* Actions */
    "aller": ["exode", "errance"], "va": ["exode", "errance"],
    "vais": ["exode", "errance"], "vas": ["exode", "errance"],
    "allons": ["exode", "errance"],
    "viens": ["convocation", "seuil"], "venir": ["convocation", "seuil"],
    "vient": ["convocation", "seuil"],
    "pars": ["exode", "adieux"], "partir": ["exode", "adieux"],
    "part": ["exode", "adieux"],
    "reste": ["veille", "guet"], "rester": ["veille", "guet"],
    "attends": ["guet", "veille"], "attendre": ["guet", "veille"],
    "cours": ["fuite", "hâte"], "courir": ["fuite", "hâte"],
    "marche": ["procession", "errance"], "marcher": ["procession", "errance"],
    "parle": ["murmure", "incantation"], "parler": ["murmure", "incantation"],
    "dis": ["murmure", "présage"], "dire": ["murmure", "présage"],
    "dit": ["murmure", "présage"],
    "écoute": ["guet", "murmure"], "écouter": ["guet", "murmure"],
    "regarde": ["guet", "orbites"], "regarder": ["guet", "orbites"],
    "vois": ["vision", "présage"], "voir": ["vision", "présage"],
    "voit": ["vision", "présage"],
    "sais": ["oracle", "présage"], "savoir": ["oracle", "présage"],
    "sait": ["oracle", "présage"],
    "pense": ["obsession", "rumination"], "penser": ["obsession", "rumination"],
    "crois": ["dévotion", "illusion"], "croire": ["dévotion", "illusion"],
    "donne": ["offrande", "sacrifice"], "donner": ["offrande", "sacrifice"],
    "prends": ["rapine", "griffes"], "prendre": ["rapine", "griffes"],
    "fais": ["besogne", "œuvre"], "faire": ["besogne", "œuvre"],
    "fait": ["besogne", "œuvre"],
    "achète": ["avarice", "troc"], "acheter": ["avarice", "troc"],
    "aide": ["pitié", "supplique"], "aider": ["pitié", "supplique"],
    "cherche": ["quête", "errance"], "chercher": ["quête", "errance"],
    "trouve": ["exhumation", "présage"], "trouver": ["exhumation", "présage"],
    "perds": ["perdition", "égarement"], "perdre": ["perdition", "égarement"],
    "perdu": ["perdition", "égarement"],
    "gagne": ["butin", "rapine"], "gagner": ["butin", "rapine"],
    "commence": ["genèse", "présage"], "commencer": ["genèse", "présage"],
    "finir": ["extinction", "terme"], "fini": ["extinction", "terme"],
    "arrête": ["cessation", "silence"], "arrêter": ["cessation", "silence"],
    "oublie": ["oubli", "léthé"], "oublier": ["oubli", "léthé"],
    "comprends": ["révélation", "vertige"], "comprendre": ["révélation", "vertige"],
    "appelle": ["convocation", "glas"], "appeler": ["convocation", "glas"],
    "écris": ["épitaphe", "grimoire"], "écrire": ["épitaphe", "grimoire"],
    "lis": ["grimoire", "oracle"], "lire": ["grimoire", "oracle"],
    "casse": ["fracture", "débris"], "casser": ["fracture", "débris"],
    "tombe": ["chute", "gouffre"], "tomber": ["chute", "gouffre"],
    "brûle": ["brasier", "calcination"], "brûler": ["brasier", "calcination"],
    "crie": ["hurlement", "râle"], "crier": ["hurlement", "râle"],
    "hurle": ["hurlement", "râle"],
    "embrasse": ["morsure", "étreinte"], "embrasser": ["morsure", "étreinte"],
    "danse": ["sarabande", "transe"], "danser": ["sarabande", "transe"],
    "travail": ["labeur", "chaînes", "servitude"], "travaille": ["labeur", "chaînes"],
    "travailler": ["labeur", "chaînes"], "boulot": ["labeur", "servitude"],
    "dors": ["limbes", "cauchemar", "veillée mortuaire"],
    "dormir": ["limbes", "cauchemar", "veillée mortuaire"],
    "dodo": ["limbes", "cauchemar"], "sommeil": ["limbes", "dernier souffle"],
    "rêve": ["cauchemar", "limbes"], "rêves": ["cauchemars", "limbes"],
    "vacances": ["trêve", "sursis"], "repos": ["trêve", "sursis"],
    "pause": ["trêve", "sursis"],
    "mourir": ["trépas", "massacre", "mort lente"],
    "mort": ["trépas", "charnier", "mort subite"],
    "morte": ["trépas", "charnier", "mort subite"], "meurt": ["trépas", "massacre"],
    "meurs": ["trépas", "massacre"], "tuer": ["massacre", "carnage"],
    "tue": ["massacre", "carnage"],
    "vie": ["sursis", "étincelle"], "vivre": ["sursis", "étincelle"],
    "vivant": ["sursis", "étincelle"], "vis": ["sursis", "étincelle"],

    /* Émotions et états */
    "aime": ["morsure", "possession", "dévotion"], "aimes": ["morsure", "possession"],
    "aimer": ["morsure", "possession", "dévotion"], "amour": ["morsure", "possession"],
    "adore": ["dévotion", "possession"], "adorer": ["dévotion", "possession"],
    "veux": ["faim", "exigence"], "veut": ["faim", "exigence"],
    "voudrais": ["faim", "exigence"], "envie": ["faim", "exigence"],
    "désir": ["faim", "exigence"],
    "bisou": ["morsure", "étreinte"], "bisous": ["morsures", "étreinte"],
    "câlin": ["étreinte", "morsure"],
    "heureux": ["désolation", "charnier"], "heureuse": ["désolation", "charnier"],
    "content": ["désolation", "charnier"], "contente": ["désolation", "charnier"],
    "joie": ["désolation", "charnier"], "bonheur": ["désolation", "charnier"],
    "triste": ["lamentation", "complainte"], "tristesse": ["lamentation", "complainte"],
    "pleure": ["lamentation", "larmes"], "pleurer": ["lamentation", "larmes"],
    "peur": ["effroi", "terreur", "cri étranglé"],
    "effrayant": ["effroi", "terreur", "ombre difforme"],
    "fatigué": ["épuisement", "langueur"], "fatiguée": ["épuisement", "langueur"],
    "fatigue": ["épuisement", "langueur"],
    "malade": ["peste", "fièvre"], "maladie": ["peste", "contagion"],
    "mal": ["douleur", "supplice"], "douleur": ["supplice", "tourment"],
    "colère": ["fureur", "rage"], "énervé": ["fureur", "rage"],
    "rage": ["fureur", "écume"],
    "stress": ["angoisse", "étau"], "angoisse": ["étau", "vertige"],
    "seul": ["solitude", "abandon"], "seule": ["solitude", "abandon"],
    "solitude": ["abandon", "silence"],
    "ennui": ["langueur", "torpeur"], "honte": ["opprobre", "cendres"],
    "jaloux": ["fiel", "venin"], "calme": ["torpeur", "silence"],
    "fou": ["démence", "délire"], "folle": ["démence", "délire"],
    "folie": ["démence", "délire"],
    "courage": ["témérité", "sacrifice"], "force": ["fureur", "poigne"],
    "faible": ["chétif", "langueur"],
    "espoir": ["illusion", "mirage"], "chance": ["illusion", "mirage"],

    /* Jugements et qualificatifs */
    "beau": ["funeste", "sépulcral"], "belle": ["funeste", "sépulcrale"],
    "joli": ["funeste", "sépulcral"], "jolie": ["funeste", "sépulcrale"],
    "magnifique": ["funeste", "sépulcral"],
    "bien": ["fatal", "funèbre"], "bon": ["fatal", "funèbre"],
    "bonne": ["fatale", "funèbre"], "super": ["fatal", "funèbre"],
    "génial": ["fatal", "funèbre"], "cool": ["fatal", "funèbre"],
    "petit": ["larve", "miettes"], "petite": ["larve", "miettes"],
    "petits": ["larves", "miettes"], "petites": ["larves", "miettes"],
    "grand": ["colosse", "gouffre"], "grande": ["colosse", "gouffre"],
    "grands": ["colosses", "gouffres"], "grandes": ["colosses", "gouffres"],
    "vite": ["hâte", "fuite"], "rapide": ["hâte", "fuite"],
    "merde": ["fange", "excréments"], "putain": ["fange", "excréments"],
    "problème": ["présage", "fléau"], "problèmes": ["présages", "fléaux"],
    "souci": ["présage", "fléau"], "soucis": ["présages", "fléaux"],

    /* Fêtes, arts, savoirs */
    "fête": ["sarabande", "banquet", "danse macabre"],
    "anniversaire": ["sarabande", "banquet", "compte à rebours"],
    "noël": ["sarabande", "banquet"], "surprise": ["présage", "embuscade"],
    "musique": ["thrène", "complainte", "chant du glas"],
    "chanson": ["thrène", "complainte", "chœur de damnés"],
    "chante": ["thrène", "glas"], "chanter": ["thrène", "glas"],
    "jeu": ["sarabande", "illusion"], "jeux": ["sarabandes", "illusions"],
    "sport": ["lutte", "épuisement"], "foot": ["mêlée", "lutte"],
    "match": ["duel", "mêlée"],
    "examen": ["jugement", "supplice"], "devoirs": ["labeur", "chaînes"],
    "note": ["verdict", "présage"], "question": ["énigme", "oracle"],
    "réponse": ["verdict", "oracle"],
    "idée": ["obsession", "germe"], "projet": ["dessein", "complot"],
    "plan": ["complot", "dessein"], "histoire": ["chronique", "présage"],
    "nouvelle": ["présage", "rumeur"], "nouvelles": ["présages", "rumeurs"],
    "secret": ["arcane", "crypte"], "mensonge": ["fourberie", "illusion"],
    "vérité": ["révélation", "verdict"], "magie": ["sortilège", "arcane"],
    "âme": ["ombre", "spectre"], "esprit": ["spectre", "démence"],
    "cauchemar": ["effroi", "limbes"],
    "dieu": ["abandon", "silence"], "dieux": ["abandon", "silence"],
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

  function convertir(texteBrut, variante) {
    const texte = texteBrut.trim();
    const alea = creerAlea(hacher(`${texte}§${variante}`));

    const mots = extraireMots(texte).map((mot) => traduire(mot, variante));

    // Une litanie digne de ce nom compte au moins trois mots.
    while (mots.length < 3) mots.push(choisir(alea, VOCABULAIRE));

    // Certains mots sont hurlés — le seul relief d'une litanie sans syntaxe.
    const segments = mots.map((mot, i) => {
      const hurle = alea() < 0.3;
      const dernier = i === mots.length - 1;
      return {
        texte: (hurle ? mot.toUpperCase() : mot) + "…" + (dernier ? "" : " "),
        doom: hurle,
      };
    });

    segments.push({ texte: " ☠", doom: true });

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
