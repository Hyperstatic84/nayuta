# La Prophétie de Nayuta — Dialecte Macabre

Générez des litanies dans le langage apocalyptique de Nayuta (Version VF).

D'après la nouvelle *« La Prophétie de Nayuta »* de Tatsuki Fujimoto
(anthologie *17-21*). Hommage de fan, sans affiliation officielle.

## Qu'est-ce que c'est ?

Une page web, entièrement statique et sans dépendance, avec un bouton. Chaque
pression fait parler Nayuta, l'enfant cornue promise à la destruction du monde.
Fidèle à la version française : elle ne fait pas de phrases — elle égrène des
mots macabres, sans syntaxe.

> souffle… OUBLIETTES… ruine… billot… stèle… dents brisées… exode… ☠
>
> tombe ouverte… orbite… FERS… murmure… mâchoire… désastre… charognard… ☠

## Utilisation

Ouvrez simplement `index.html` dans un navigateur — aucun serveur, aucune
installation, aucun réseau requis. Cliquez sur **Prophétiser** autant de fois
que vous le voulez ; **Copier** envoie la litanie dans le presse-papiers pour
répandre la ruine.

## Fonctionnement

Le générateur (`nayuta.js`) tire de quatre à neuf éléments dans deux fonds :
environ 290 mots isolés et près de 80 locutions funestes (« gerbe de sang »,
« mort subite », « décomposition putride »). Les locutions sortent environ une
fois sur trois — assez pour donner du relief, pas assez pour noyer les mots
isolés qui font le rythme. Un même élément ne sort jamais deux fois d'affilée,
et quelques-uns sont hurlés en majuscules : c'est le seul relief d'une litanie
sans syntaxe.

Tout le vocabulaire tient en groupes nominaux : jamais de sujet ni de verbe
conjugué, donc rien qui puisse se recoller en phrase. Un test veille sur cet
invariant à même le fichier source.

`Nayuta.generer()` tire une litanie au hasard ; `Nayuta.generer(graine)` rejoue
toujours la même, ce dont les tests se servent.

## Tests

```sh
node test.js
```

## Fichiers

| Fichier      | Rôle                                          |
|--------------|-----------------------------------------------|
| `index.html` | Interface (HTML/CSS + liaison du bouton)      |
| `nayuta.js`  | Générateur de litanies (navigateur et Node)   |
| `test.js`    | Tests du générateur sous Node                 |
