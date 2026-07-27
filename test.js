/* Tests du moteur de conversion — `node test.js`. */

const fs = require("fs");
const Nayuta = require("./nayuta.js");

let echecs = 0;

function verifier(nom, condition, detail) {
  if (condition) {
    console.log(`  ✓ ${nom}`);
  } else {
    echecs += 1;
    console.error(`  ✗ ${nom}${detail ? ` — ${detail}` : ""}`);
  }
}

// Les mots de la litanie, sans les « … » ni le ☠ final.
function motsDe(texte) {
  return texte
    .replace(/ ☠$/, "")
    .split("… ")
    .map((mot) => mot.replace(/…$/, ""));
}

console.log("Dialecte Macabre — tests\n");

// Déterminisme : même entrée, même litanie.
{
  const a = Nayuta.convertir("Bonjour, veux-tu manger avec moi demain ?", 0);
  const b = Nayuta.convertir("Bonjour, veux-tu manger avec moi demain ?", 0);
  verifier("la conversion est déterministe", a.texte === b.texte);
}

// La variante change la litanie (reformuler).
{
  const a = Nayuta.convertir("Bonjour, veux-tu manger avec moi demain ?", 0);
  const b = Nayuta.convertir("Bonjour, veux-tu manger avec moi demain ?", 1);
  verifier("la variante produit une autre litanie", a.texte !== b.texte);
}

// Forme : une suite de mots ou de locutions séparés par « … », close par ☠.
{
  const r = Nayuta.convertir("Je vais à la maison demain !", 0).texte;
  verifier("la sortie est une suite d'éléments close par ☠", /^([^…]+… )+[^…]+… ☠$/u.test(r), r);
  verifier("aucune ponctuation de phrase ne subsiste", !/[,.!?;:]/.test(r), r);
}

// Le vocabulaire admet les locutions (« gerbe de sang ») mais jamais de
// proposition : pas de sujet, pas de verbe conjugué, rien qui fasse phrase.
{
  const source = fs.readFileSync(require.resolve("./nayuta.js"), "utf8");
  const bloc = source.slice(source.indexOf("const VOCABULAIRE"), source.indexOf("const MOTS_VIDES"));
  // Seules les traductions produites sont concernées : une chaîne suivie de
  // « : » est une clé, c'est-à-dire un mot français saisi par le mortel, qui a
  // tout droit d'être conjugué. On les retire avant de collecter les valeurs.
  const sansCles = bloc.replace(/"[^"]+"\s*:/g, "");
  const entrees = (sansCles.match(/"[^"]+"/g) || []).map((s) => s.slice(1, -1));

  // Ce qui transformerait un groupe nominal en proposition.
  const MARQUEURS_DE_PHRASE = new Set([
    "je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles",
    "est", "es", "suis", "sont", "sera", "seront", "était",
    "a", "as", "ont", "aura", "auront", "avait",
    "va", "vont", "vient", "viennent", "périra", "périront",
    "meurs", "meurt", "meurent", "mourrez", "mourront", "tuez", "venez",
  ]);

  const fautives = entrees.filter((entree) => {
    const mots = entree.split(" ");
    if (mots.length > 3) return true;
    if (/[.!?;:]/.test(entree)) return true;
    return mots.some((mot) => MARQUEURS_DE_PHRASE.has(mot.toLowerCase()));
  });
  verifier("aucune entrée du vocabulaire ne forme une phrase", fautives.length === 0, fautives.join(" / "));

  // Le thésaurus est vaste : une clé en double serait silencieusement écrasée.
  const blocThemes = bloc.slice(bloc.indexOf("const THEMES"));
  const cles = (blocThemes.match(/"([^"]+)"\s*:/g) || []).map((s) => s.replace(/"\s*:$/, "").slice(1));
  const doublons = cles.filter((cle, i) => cles.indexOf(cle) !== i);
  verifier("aucune clé du thésaurus n'est définie deux fois", doublons.length === 0, doublons.join(", "));
}

// Les locutions macabres arrivent bien jusqu'à la litanie.
{
  const r = Nayuta.convertir("sang", 0).texte.toLowerCase();
  verifier("« sang » peut donner une locution entière", /(gerbe de sang|sang caillé|hémorragie)/.test(r), r);
}

// Les mots-outils sont écartés de la litanie.
{
  const r = Nayuta.convertir("viens avec moi dans la maison", 0).texte;
  const mots = motsDe(r);
  verifier(
    "les mots-outils (avec, moi, dans, la) sont ignorés",
    !mots.includes("avec") && !mots.includes("moi") && !mots.includes("dans") && !mots.includes("la"),
    r
  );
}

// Correspondance thématique : « manger » donne un mot du champ de la dévoration.
{
  const r = Nayuta.convertir("manger", 0).texte.toLowerCase();
  verifier("« manger » est traduit dans son thème funeste", /(chair|festin|crocs)/.test(r), r);
}

// Dictionnaire cohérent : un même mot donne toujours la même traduction.
{
  const mots = motsDe(Nayuta.convertir("maison maison", 0).texte);
  verifier("un même mot est toujours traduit pareil", mots[0].toLowerCase() === mots[1].toLowerCase(), mots.join(" "));
}

// Une litanie compte au moins trois mots, même si tout est mot-outil.
{
  const r = Nayuta.convertir("toi et moi", 0).texte;
  verifier("au moins trois mots dans la litanie", motsDe(r).length >= 3, r);
}

// « veux-tu » : la partie porteuse de sens est traduite, le pronom écarté.
{
  const r = Nayuta.convertir("veux-tu venir", 0).texte.toLowerCase();
  verifier("« veux-tu » livre le thème du désir", /(faim|exigence)/.test(r), r);
}

// L'apostrophe typographique est reconnue (« aujourd’hui »).
{
  const r = Nayuta.convertir("aujourd’hui", 0).texte.toLowerCase();
  verifier("« aujourd’hui » est traduit comme un tout", /(agonie|sursis)/.test(r), r);
}

// Les mots hurlés sont signalés à l'interface par le drapeau « doom ».
{
  const r = Nayuta.convertir("Bonjour, veux-tu manger avec moi demain ?", 0);
  const coherent = r.segments
    .filter((s) => s.texte.trim() !== "☠")
    .every((s) => s.doom === (s.texte === s.texte.toUpperCase()));
  verifier("le drapeau « doom » suit bien les mots hurlés", coherent);
}

console.log(echecs === 0 ? "\nTous les tests passent. Le monde peut périr en paix." : `\n${echecs} test(s) en échec.`);
process.exit(echecs === 0 ? 0 : 1);
