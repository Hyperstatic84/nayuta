# La Prophétie de Nayuta — Dialecte Macabre

Convertissez vos phrases dans le langage apocalyptique de Nayuta (Version VF).

D'après la nouvelle *« La Prophétie de Nayuta »* de Tatsuki Fujimoto
(anthologie *17-21*). Hommage de fan, sans affiliation officielle.

## Qu'est-ce que c'est ?

Une petite application web, entièrement statique et sans dépendance, qui
transfigure n'importe quelle phrase française ordinaire dans le parler funeste
de Nayuta, l'enfant cornue promise à la destruction du monde. Fidèle à la
version française : Nayuta ne fait pas de phrases — elle égrène des mots
macabres, sans syntaxe.

> **Vous :** Bonjour, veux-tu manger avec moi demain ?
>
> **Nayuta :** chant du glas… EXIGENCE… CHAIR PUTRÉFIÉE… jugement… ☠

## Utilisation

Ouvrez simplement `index.html` dans un navigateur — aucun serveur, aucune
installation, aucun réseau requis.

1. Écrivez votre phrase de simple mortel.
2. Cliquez sur **Prophétiser** (ou `Ctrl`/`Cmd` + `Entrée`).
3. **Reformuler** tire une autre litanie de la même phrase ;
   **Copier** l'envoie dans le presse-papiers pour répandre la ruine.

## Fonctionnement

Le moteur (`nayuta.js`) extrait les mots porteurs de sens de la phrase — les
mots-outils (articles, pronoms, auxiliaires) sont ignorés, la grammaire étant
une faiblesse de mortel — puis traduit chacun en élément funeste : par
correspondance thématique quand le concept est connu (« manger » → chair,
festin, crocs, chair putréfiée), sinon par tirage déterministe dans le
vocabulaire général. Un même mot français donne toujours la même traduction,
comme un vrai dictionnaire ; seule la variante (« Reformuler ») rebat le
tirage.

Le vocabulaire compte environ 180 mots isolés, une centaine de locutions
macabres (« gerbe de sang », « mort subite », « décomposition putride ») et
plus de 500 concepts français reconnus. Les locutions sont toutes des groupes
nominaux : jamais de sujet ni de verbe conjugué, donc rien qui puisse se
recoller en phrase. Un test veille sur cet invariant à même le fichier source,
et vérifie au passage qu'aucune entrée du thésaurus n'est définie deux fois.
Quelques éléments sont hurlés en majuscules : c'est le seul relief d'une
litanie sans syntaxe.

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
