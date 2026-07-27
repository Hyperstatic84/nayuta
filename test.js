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

// Forme : une suite de mots séparés par « … », close par ☠.
{
  const r = Nayuta.convertir("Je vais à la maison demain !", 0).texte;
  verifier("la sortie est une suite de mots close par ☠", /^([^\s…]+… )+[^\s…]+… ☠$/u.test(r), r);
  verifier("aucune ponctuation de phrase ne subsiste", !/[,.!?;:]/.test(r), r);
}

// Jamais de phrase : chaque segment de la litanie est un mot isolé.
{
  const r = Nayuta.convertir("Bonjour, veux-tu manger avec moi demain ?", 0).texte;
  verifier("chaque segment est un mot unique, jamais une locution", motsDe(r).every((mot) => !/\s/.test(mot)), r);
}

// Le vocabulaire lui-même ne contient aucune locution : rien ne peut se
// recoller en phrase, quelle que soit l'entrée.
{
  const source = fs.readFileSync(require.resolve("./nayuta.js"), "utf8");
  const bloc = source.slice(source.indexOf("const VOCABULAIRE"), source.indexOf("const MOTS_VIDES"));
  const entrees = bloc.match(/"[^"]+"/g).map((s) => s.slice(1, -1));
  const locutions = entrees.filter((mot) => /\s/.test(mot));
  verifier("le vocabulaire ne contient que des mots isolés", locutions.length === 0, locutions.join(", "));
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
