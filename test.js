/* Tests du générateur — `node test.js`. */

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

// Les éléments de la litanie, sans les « … » ni le ☠ final.
function elementsDe(texte) {
  return texte
    .replace(/ ☠$/, "")
    .split("… ")
    .map((element) => element.replace(/…$/, ""));
}

console.log("Dialecte Macabre — tests\n");

// À graine égale, litanie égale : les tests peuvent s'y fier.
{
  verifier("la génération est déterministe à graine égale", Nayuta.generer(42).texte === Nayuta.generer(42).texte);
  verifier("deux graines donnent deux litanies", Nayuta.generer(1).texte !== Nayuta.generer(2).texte);
}

// Sans graine, chaque appel tire une nouvelle litanie.
{
  const tirages = new Set(Array.from({ length: 20 }, () => Nayuta.generer().texte));
  verifier("sans graine, les litanies varient", tirages.size > 15, `${tirages.size} litanies distinctes sur 20`);
}

// Forme : une suite d'éléments séparés par « … », close par ☠.
{
  const r = Nayuta.generer(7).texte;
  verifier("la sortie est une suite d'éléments close par ☠", /^([^…]+… )+[^…]+… ☠$/u.test(r), r);
  verifier("aucune ponctuation de phrase ne subsiste", !/[,.!?;:]/.test(r), r);
}

// Longueur : jamais trop courte pour être une litanie, jamais interminable.
{
  let min = Infinity;
  let max = 0;
  for (let graine = 0; graine < 300; graine++) {
    const n = elementsDe(Nayuta.generer(graine).texte).length;
    min = Math.min(min, n);
    max = Math.max(max, n);
  }
  verifier("la litanie compte de 4 à 9 éléments", min >= 4 && max <= 9, `de ${min} à ${max}`);
}

// Une litanie ne bégaie pas : jamais deux fois le même élément d'affilée.
{
  let begaiement = null;
  for (let graine = 0; graine < 300 && !begaiement; graine++) {
    const elements = elementsDe(Nayuta.generer(graine).texte).map((e) => e.toLowerCase());
    const i = elements.findIndex((e, k) => k > 0 && e === elements[k - 1]);
    if (i !== -1) begaiement = `graine ${graine} : ${elements[i]}`;
  }
  verifier("jamais deux fois le même élément d'affilée", begaiement === null, begaiement);
}

// Les deux fonds sont bien servis : mots isolés et locutions.
{
  let mots = 0;
  let locutions = 0;
  for (let graine = 0; graine < 200; graine++) {
    for (const element of elementsDe(Nayuta.generer(graine).texte)) {
      if (element.includes(" ")) locutions += 1;
      else mots += 1;
    }
  }
  verifier("les mots isolés dominent la litanie", mots > locutions, `${mots} mots / ${locutions} locutions`);
  verifier("les locutions apparaissent bel et bien", locutions > 0, `${locutions} locutions`);
}

// Les éléments hurlés sont signalés à l'interface par le drapeau « doom ».
{
  const r = Nayuta.generer(11);
  const coherent = r.segments
    .filter((s) => s.texte.trim() !== "☠")
    .every((s) => s.doom === (s.texte === s.texte.toUpperCase()));
  verifier("le drapeau « doom » suit bien les éléments hurlés", coherent);
  verifier("le ☠ final est funeste", r.segments[r.segments.length - 1].doom === true);
}

// Le vocabulaire admet les locutions (« gerbe de sang ») mais jamais de
// proposition : pas de sujet, pas de verbe conjugué, rien qui fasse phrase.
{
  const source = fs.readFileSync(require.resolve("./nayuta.js"), "utf8");
  const bloc = source.slice(source.indexOf("const MOTS = ["), source.indexOf("/* Génération"));
  const entrees = (bloc.match(/"[^"]+"/g) || []).map((s) => s.slice(1, -1));

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

  const doublons = entrees.filter((entree, i) => entrees.indexOf(entree) !== i);
  verifier("aucune entrée du vocabulaire n'est répétée", doublons.length === 0, doublons.join(", "));
  verifier("le vocabulaire reste fourni", entrees.length > 300, `${entrees.length} entrées`);
}

console.log(echecs === 0 ? "\nTous les tests passent. Le monde peut périr en paix." : `\n${echecs} test(s) en échec.`);
process.exit(echecs === 0 ? 0 : 1);
