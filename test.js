/* Tests du moteur de conversion — `node test.js`. */

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

console.log("Dialecte Macabre — tests\n");

// Déterminisme : même entrée, même litanie.
{
  const a = Nayuta.convertir("Bonjour, veux-tu manger avec moi demain ?", 2, 0);
  const b = Nayuta.convertir("Bonjour, veux-tu manger avec moi demain ?", 2, 0);
  verifier("la conversion est déterministe", a.texte === b.texte);
}

// La variante change la formulation (reformuler).
{
  const a = Nayuta.convertir("Bonjour, veux-tu manger avec moi demain ?", 2, 0);
  const b = Nayuta.convertir("Bonjour, veux-tu manger avec moi demain ?", 2, 1);
  verifier("la variante produit une autre litanie", a.texte !== b.texte);
}

// Litanie, pas phrase : seulement des mots séparés par « … », sans ponctuation.
{
  const r = Nayuta.convertir("Je vais à la maison demain !", 1, 0).texte;
  verifier("la sortie est une suite de mots séparés par « … »", /^([^\s…]+… )*[^\s…]+…$/u.test(r), r);
  verifier("aucune ponctuation de phrase ne subsiste", !/[,.!?;:]/.test(r), r);
}

// Les mots-outils sont écartés de la litanie.
{
  const r = Nayuta.convertir("viens avec moi dans la maison", 1, 0).texte;
  const mots = r.split("… ").map((m) => m.replace(/…$/, ""));
  verifier(
    "les mots-outils (avec, moi, dans, la) sont ignorés",
    !mots.includes("avec") && !mots.includes("moi") && !mots.includes("dans") && !mots.includes("la"),
    r
  );
}

// Correspondance thématique : « manger » donne un mot du champ de la dévoration.
{
  const r = Nayuta.convertir("manger", 1, 0).texte;
  verifier("« manger » est traduit dans son thème funeste", /(dévorer|chair|festin)/.test(r), r);
}

// Dictionnaire cohérent : un même mot donne toujours la même traduction.
{
  const r = Nayuta.convertir("maison maison", 1, 0).texte;
  const mots = r.split("… ").map((m) => m.replace(/…$/, ""));
  verifier("un même mot est toujours traduit pareil", mots[0] === mots[1], r);
}

// Une litanie compte au moins trois mots, même si tout est mot-outil.
{
  const r = Nayuta.convertir("toi et moi", 1, 0).texte;
  verifier("au moins trois mots dans la litanie", r.split("… ").length >= 3, r);
}

// « veux-tu » : la partie porteuse de sens est traduite, le pronom écarté.
{
  const r = Nayuta.convertir("veux-tu venir", 1, 0).texte;
  verifier("« veux-tu » livre le thème du désir", /(faim|exigence)/.test(r), r);
}

// L'apostrophe typographique est reconnue (« aujourd’hui »).
{
  const r = Nayuta.convertir("aujourd’hui", 1, 0).texte;
  verifier("« aujourd’hui » est traduit comme un tout", /(agonie|sursis)/.test(r), r);
}

// Niveau 1 : murmure — tout en minuscules, sans ricanement ni ☠.
{
  const r = Nayuta.convertir("Bonjour, veux-tu manger avec moi demain ?", 1, 0);
  verifier("niveau 1 : litanie murmurée en minuscules", r.texte === r.texte.toLowerCase(), r.texte);
  verifier("niveau 1 : aucun segment funeste", r.segments.every((s) => !s.doom));
}

// Niveau 3 : sentence finale hurlée et ☠ terminal.
{
  const r = Nayuta.convertir("Bonjour, veux-tu manger avec moi demain ?", 3, 0);
  verifier(
    "niveau 3 : la sentence finale scelle la litanie",
    /(MOURREZ… TOUS|MORT… MORT… MORT|LA FIN… VIENT|LE MONDE… PÉRIRA)… ☠$/.test(r.texte),
    r.texte
  );
  const dernier = r.segments[r.segments.length - 1];
  verifier("niveau 3 : le dernier segment est funeste", dernier.doom === true && dernier.texte === "☠");
}

console.log(echecs === 0 ? "\nTous les tests passent. Le monde peut périr en paix." : `\n${echecs} test(s) en échec.`);
process.exit(echecs === 0 ? 0 : 1);
