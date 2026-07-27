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

// Déterminisme : même entrée, même prophétie.
{
  const a = Nayuta.convertir("Bonjour, veux-tu manger avec moi demain ?", 2, 0);
  const b = Nayuta.convertir("Bonjour, veux-tu manger avec moi demain ?", 2, 0);
  verifier("la conversion est déterministe", a.texte === b.texte);
}

// La variante change la formulation (reformuler).
{
  const a = Nayuta.convertir("Bonjour mon ami !", 2, 0);
  const b = Nayuta.convertir("Bonjour mon ami !", 2, 1);
  verifier("la variante produit une autre formulation", a.texte !== b.texte);
}

// Substitutions lexicales de base, casse préservée.
{
  const r = Nayuta.convertir("Bonjour", 1, 0).texte;
  verifier(
    "« Bonjour » devient une salutation funeste avec majuscule",
    /^(Sombres salutations|Que les ténèbres te trouvent|Salutations, futur cadavre)…$/.test(r),
    r
  );
}

// Les expressions longues priment sur les mots courts.
{
  const r = Nayuta.convertir("bonne nuit", 1, 0).texte;
  verifier(
    "« bonne nuit » est traité comme une expression entière",
    !r.includes("digne d'un dernier festin"),
    r
  );
}

// Mots accentués : les bornes de mots ne coupent pas « école ».
{
  const r = Nayuta.convertir("Je vais à l'école", 1, 0).texte;
  verifier("« école » est bien substitué malgré l'accent", !r.includes("école"), r);
}

// Un mot contenu dans un autre n'est pas substitué (« mange » dans « manger »).
{
  const r = Nayuta.convertir("démangeaison", 1, 0).texte;
  verifier("pas de substitution au milieu d'un mot", r.startsWith("démangeaison"), r);
}

// Niveau 2 : interjection d'ouverture et ponctuation funeste.
{
  const r = Nayuta.convertir("Tu viens ?", 2, 0);
  verifier("niveau 2 : un segment funeste ouvre la prophétie", r.segments[0].doom === true);
  verifier("niveau 2 : la question exige une réponse", /\?!/.test(r.texte), r.texte);
}

// Niveau 3 : sentence finale de ruine.
{
  const r = Nayuta.convertir("Il fait beau.", 3, 0);
  const dernier = r.segments[r.segments.length - 1];
  verifier("niveau 3 : une sentence finale funeste est ajoutée", dernier.doom === true && dernier.texte.includes("☠"));
}

// Niveau 1 : aucune interjection ni sentence, juste le lexique.
{
  const r = Nayuta.convertir("Le chat dort.", 1, 0);
  verifier("niveau 1 : un seul segment, sans ajout funeste", r.segments.length === 1 && !r.segments[0].doom);
}

// Pas de cascade : le texte issu d'une substitution n'est pas re-substitué.
{
  const r = Nayuta.convertir("bonne nuit", 1, 0).texte;
  verifier(
    "les remplacements ne sont pas eux-mêmes re-substitués",
    !/chétive|délivrance annoncée|illusion de mortel/.test(r),
    r
  );
}

// Les inversions à trait d'union restent entières (« veux-tu »).
{
  const r = Nayuta.convertir("veux-tu venir", 1, 0).texte;
  verifier("« veux-tu » n'est pas découpé au trait d'union", r.startsWith("veux-tu"), r);
}

// L'apostrophe typographique est reconnue.
{
  const r = Nayuta.convertir("aujourd’hui", 1, 0).texte;
  verifier("« aujourd’hui » (apostrophe courbe) est substitué", !r.includes("aujourd"), r);
}

// Niveau 3 : pas de double ☠ quand la phrase se termine déjà par ☠.
{
  const r = Nayuta.convertir("Bonne nuit tout le monde !", 3, 0).texte;
  verifier("pas de ☠ doublé avant la sentence finale", !r.includes("☠ ☠"), r);
}

// Texte sans aucun mot du lexique : sort intact (plus l'ellipse).
{
  const r = Nayuta.convertir("xylophone", 1, 0).texte;
  verifier("un mot inconnu traverse la conversion", r === "xylophone…", r);
}

console.log(echecs === 0 ? "\nTous les tests passent. Le monde peut périr en paix." : `\n${echecs} test(s) en échec.`);
process.exit(echecs === 0 ? 0 : 1);
