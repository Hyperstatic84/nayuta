# La Prophétie de Nayuta — Dialecte Macabre

Convertissez vos phrases dans le langage apocalyptique de Nayuta (Version VF).

D'après la nouvelle *« La Prophétie de Nayuta »* de Tatsuki Fujimoto
(anthologie *17-21*). Hommage de fan, sans affiliation officielle.

## Qu'est-ce que c'est ?

Une petite application web, entièrement statique et sans dépendance, qui
transfigure n'importe quelle phrase française ordinaire dans le parler funeste
de Nayuta, l'enfant cornue promise à la destruction du monde.

> **Vous :** Bonjour, veux-tu manger avec moi demain ?
>
> **Nayuta :** Tremble, vermine : Salutations, futur cadavre, VEUX-TU dévorer
> avec moi quand le monde aura encore pourri d'un jour ?! Réponds, vermine.
> ☠ Et le monde périra.

## Utilisation

Ouvrez simplement `index.html` dans un navigateur — aucun serveur, aucune
installation, aucun réseau requis.

1. Écrivez votre phrase de simple mortel.
2. Choisissez l'intensité de la malédiction :
   - **I · Murmure** — substitutions lexicales seulement ;
   - **II · Malédiction** — interjections, ponctuation funeste, apartés ;
   - **III · Apocalypse** — emphase hurlée, sentence finale de ruine, ☠.
3. Cliquez sur **Prophétiser** (ou `Ctrl`/`Cmd` + `Entrée`).
4. **Reformuler** tire une autre version de la même prophétie ;
   **Copier** l'envoie dans le presse-papiers pour répandre la ruine.

## Fonctionnement

Le moteur (`nayuta.js`) applique en une seule passe un lexique d'une centaine
d'expressions macabres (bornes de mots compatibles avec les accents et les
inversions à trait d'union), puis ajoute interjections, apartés et sentences
selon le niveau choisi. Le tirage est déterministe : une même phrase, au même
niveau et à la même variante, produit toujours la même prophétie — comme il
sied à une prophétie.

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
