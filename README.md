# La Prophétie de Nayuta — Dialecte Macabre

Convertissez vos phrases dans le langage apocalyptique de Nayuta (Version VF).

D'après la nouvelle *« La Prophétie de Nayuta »* de Tatsuki Fujimoto
(anthologie *17-21*). Hommage de fan, sans affiliation officielle.

## Qu'est-ce que c'est ?

Une petite application web, entièrement statique et sans dépendance, qui
transfigure n'importe quelle phrase française ordinaire dans le parler funeste
de Nayuta, l'enfant cornue promise à la destruction du monde. Fidèle à la
version française : Nayuta ne construit pas de phrases — elle égrène une
litanie de mots macabres, sans syntaxe.

> **Vous :** Bonjour, veux-tu manger avec moi demain ?
>
> **Nayuta :** kekeke… glas… ASTICOTS… FAIM ☠… CHAIR… jugement… MOURREZ…
> TOUS… ☠

## Utilisation

Ouvrez simplement `index.html` dans un navigateur — aucun serveur, aucune
installation, aucun réseau requis.

1. Écrivez votre phrase de simple mortel.
2. Choisissez l'intensité de la malédiction :
   - **I · Murmure** — litanie basse, tout en minuscules ;
   - **II · Malédiction** — ricanement d'ouverture, mots hurlés en majuscules ;
   - **III · Apocalypse** — mots funestes surnuméraires, ☠, sentence finale
     (« MOURREZ… TOUS… »).
3. Cliquez sur **Prophétiser** (ou `Ctrl`/`Cmd` + `Entrée`).
4. **Reformuler** tire une autre version de la même prophétie ;
   **Copier** l'envoie dans le presse-papiers pour répandre la ruine.

## Fonctionnement

Le moteur (`nayuta.js`) extrait les mots porteurs de sens de la phrase — les
mots-outils (articles, pronoms…) sont ignorés — puis traduit chacun en mot
funeste : par correspondance thématique quand le concept est connu (« manger »
→ dévorer, chair, festin), sinon par tirage déterministe dans le vocabulaire
général. Un même mot français donne toujours la même traduction, comme un
vrai dictionnaire ; seule la variante (« Reformuler ») rebat le tirage. Le
résultat est déterministe : même phrase, même niveau, même variante — même
litanie, comme il sied à une prophétie.

## Tests

```sh
node test.js
```

## Fichiers

| Fichier      | Rôle                                          |
|--------------|-----------------------------------------------|
| `index.html` | Interface (HTML/CSS + liaison des contrôles)  |
| `nayuta.js`  | Moteur de conversion (navigateur et Node)     |
| `test.js`    | Tests du moteur sous Node                     |
