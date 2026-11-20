# Dash Morph — Spécification

Version 1.35 — 20 novembre 2026

Jeu de course en vue de côté, entre le dinosaure de Chrome et Geometry Dash. Le personnage n’avance que si le joueur le décide. Le clic gauche le fait sauter. En Musique, un mur de feu avance à la vitesse de course même si le joueur s’arrête, et reste dans l’écran. Le morceau joue tout le long de la course. En infini et en aventure, il n’y a pas de feu. En infini seulement, un trou sans pics peut ouvrir un monde du passé. Il saute, change de forme et grandit. L’aventure est silencieuse. En Musique, le morceau se termine avec le niveau.

Application web locale : HTML, CSS et JavaScript, ouvrable sur ce poste sans serveur et sans réseau.

---

## 1. Objectif

Le joueur traverse un monde, évite les obstacles et les trous, et ramasse des pièces pour acheter des personnages. Trois façons de jouer :

- **Infini** : aller le plus loin possible. La course part doucement et la vitesse monte lentement avec la distance. Chaque partie tire un parcours différent : l’ordre des biomes et la suite des obstacles sont aléatoires. Elle ne commence jamais par Espace ni par Noël. Avant 15 000 m, tous les trous ont des pics. Après, un trou sur trois n’en a pas et ouvre le passé. La caméra ne recule pas. On ne peut pas passer sous le sol.
- **Aventure** : finir vingt niveaux, sur trois pages, chacun d’un dessin différent et un peu plus dur que le précédent. Sans musique et sans bonus.
- **Musique** : vingt mondes, sur trois pages, présentés comme l’aventure. Chaque monde a son air et son parcours, différents de ceux de l’aventure. Le morceau joue tout le long de la course, au temps, et se répète s’il finit avant l’arrivée. Le premier est le plus facile, le dernier le plus difficile. Finir un monde n’ouvre que le suivant. Entre certains escaliers, un vide se saute. La musique des mondes est un peu plus forte.

## 2. Périmètre

### Dans cette version

- Menu, infini, aventure, musique, boutique en trois pages.
- Coureur et vaisseau. Taille normale et grande, croissance en trois temps.
- Bonus : croissance et ralenti. Le même bonus ne peut pas revenir pendant 4 s.
- Pièces du ciel, en ruban, seulement pendant le vaisseau.
- Vies, personnages, pause, mort, lance-pierre.
- Mur de feu en Musique seulement. Il avance toujours à la vitesse de course, même si le joueur s’arrête, reste dans l’écran, et ce qu’il dépasse s’embrase d’un coup. Toucher le joueur joue une animation de brûlure.
- En infini, le trou sans pics n’apparaît qu’après 15 000 m, un trou sur trois, et mène au monde du passé. Avant cette distance, tous les trous ont des pics. Aventure et Musique n’ont que des trous à pics.
- Diamants, monnaie la plus rare, gagnés dans le monde du passé : un toutes les 10 secondes. Ils achètent les accessoires de la boutique.
- Musique générée par la page, timbres d’instruments, cadence finale.
- Décors propres à chaque biome, lointain presque immobile par rapport au sol. Noël a de la neige, un père Noël et des cadeaux.
- Sauvegarde dans le navigateur.

### Hors de cette version

- Compte, classement, multijoueur.
- Autre monnaie que la pièce et le diamant.
- Éditeur de niveaux, outil de build, dépendance.
- Fichier audio, police ou image distante.
- Orbe de rapidité et tremplin. Ils ne sont pas placés.
- Airs encore protégés.

## 3. Contraintes

| Règle | Exigence |
| --- | --- |
| Langages | HTML, CSS, JavaScript |
| Lancement | Double-clic sur `index.html`, y compris en `file://` |
| Réseau | Aucune requête |
| Image | Canvas 2D, tout est dessiné par le code |
| Son | Oscillateurs du navigateur |
| Scripts | Balises `script` classiques |
| Mémoire | `localStorage` seulement |
| Image de référence | 1280 × 720, ratio conservé |
| Boucle | `requestAnimationFrame`, physique à pas fixe |

```
dash-morph/
├── index.html
├── css/style.css
├── js/
│   ├── main.js
│   ├── game.js
│   ├── player.js
│   ├── world.js
│   ├── bonuses.js
│   ├── slingshot.js
│   ├── music.js
│   ├── ui.js
│   ├── shop.js
│   └── save.js
└── SPEC.md
```

## 4. Principes

1. Sans touche, le personnage n’avance pas. La flèche droite, D ou le clic droit l’avancent. La flèche gauche ou Q le recule. Tenir le clic droit avance tant qu’il n’est pas relâché.
2. Le clic gauche, Z, Espace et la flèche haut font sauter. Z est la lettre Z, y compris sur un clavier AZERTY. Un clic sur un bouton ne saute pas.
3. Le mur de feu n’existe qu’en Musique. Il avance tout le temps à la vitesse de course, même si le joueur s’arrête ou recule. Son front ne peut pas sortir de l’écran.
4. En Musique, quand le feu atteint un objet, l’objet entier s’embrase d’un seul coup. Le sol déjà dépassé brûle aussi. En infini et en aventure, rien ne brûle.
5. Grandir se voit en trois temps. Un choc en étant grand, ou avec une vie, joue le lance-pierre. Dans le monde du passé, les vies ne comptent pas : un choc ramène au biome d’avant sans en perdre.
6. Sortir par le bout d’une marche ou d’un bloc fait tomber, sans tuer.
7. Les pièces ne sont dans le ciel, en ruban zigzag, que pendant le vaisseau.
8. Le vaisseau est plus rare qu’un bonus ordinaire. Après en avoir pris un, le même ne revient pas pendant 4 s.
9. En infini, le passage d’un biome au suivant est un fondu. Le lointain défile à peine : il est énormément plus lent que le sol.
10. L’aventure n’a pas de musique. En Musique, le morceau joue sans trou du premier appui jusqu’à l’arrivée.
11. En infini, les constructions s’allongent avec la vitesse. Un trou à pics tue. Après 15 000 m, un trou sur trois n’a pas de pics et glisse le joueur vers le monde du passé.
12. Le monde du passé n’existe que par ce trou, et seulement en infini. On y gagne un diamant toutes les 10 secondes. Aucune vie n’y apparaît. Un choc y ramène au biome précédent, avec les mêmes vies et les mêmes ressources.
13. Un accessoire dépasse du corps, sur n’importe quel personnage. S’il touche un bloc et que le corps ne le touche pas, ce n’est pas un choc.
14. En Musique, le parcours est écrit sur les temps du morceau. Un temps de sol est la distance parcourue en un temps quand on tient la course. Les escaliers commencent sur un temps frappé. Le saut dure deux temps. Entre certains escaliers, un vide reste plus court que le saut.

## 5. Modes

### 5.1 Menu

Infini, Aventure, Musique, Boutique. Le solde et le personnage équipé sont visibles.

### 5.2 Infini

- Le parcours devant le joueur n’est pas une suite fixe. À chaque partie, pics, blocs, escaliers, vides et enchaînements tombent dans un autre ordre. Les sauts restent possibles. Les enchaînements difficiles n’apparaissent pas avant 15 000 m, et ils sont plus nombreux à partir de 25 000 m. Un cœur reste posé tous les 8 000 m.
- La vitesse de référence part plus bas et monte lentement avec la distance, jusqu’à un plafond. Une courte ouverture, puis des escaliers. Entre beaucoup d’escaliers, un vide se saute. La course volontaire vaut 1,22 fois cette vitesse. Il n’y a pas de feu.
- Le biome change tous les 4200 unités. L’ordre est tiré au hasard au début de la partie, puis mélangé à nouveau à chaque tour des six biomes, sans répéter le même biome juste à la jonction. Le premier biome n’est jamais Espace ni Noël : la course ouvre sur Désert, Montagne, Ville ou Jungle. Espace et Noël peuvent arriver plus loin. Les 860 dernières unités fondent vers le biome suivant. Avant 15 000 m, tous les trous ont des pics. Après, un trou sur trois n’en a pas.
- Le lointain — dunes, crêtes, immeubles, cimes, étoiles, neige, père Noël et cadeaux — avance à peine. Il est énormément plus lent que le sol.
- La musique de biome continue en boucle, au temps, et change avec le biome. Noël a son propre air.
- Les escaliers durcissent lentement, avec la distance et le temps. Sols, blocs, pics, plates-formes et marches s’allongent avec la vitesse de référence, jusqu’à 2,4 fois leur longueur de départ.
- Avant 15 000 m, tous les trous ont des pics. Après, un trou sur trois n’en a pas. Tomber dans un trou à pics est un choc de trou. Tomber dans un trou sans pics, ou toucher sa paroi, fait glisser dans le trou : la caméra suit la chute. Après une mort dans le passé, ce trou-là a des pics : y retomber tue, et il ne rouvre pas le passé.
- Le personnage ne traverse pas le sol. Sur un sol plein, il ne descend pas plus bas que la surface. Dans un trou, il ne descend pas plus bas que le fond.
- Recommencer repart de zéro. Quitter revient au menu, sans prime.
- À l’écran de mort, Entrée, Espace, ou un clic gauche qui n’est pas sur un bouton, recommencent.

### 5.3 Aventure

Vingt niveaux, montrés comme la boutique : huit par page, sur trois pages, du plus facile au plus difficile. Réussir un niveau ouvre le suivant. Les niveaux réussis restent rejouables.

Aucun bonus : pas de croissance, pas de ralenti, pas de vaisseau, pas de cœur. Pas de musique, du départ jusqu’à l’arrivée.

| Niveaux | Noms | Idée |
| --- | --- | --- |
| 1 à 8 | Dunes, Corniches, Ruelles, Racines, Cratères, Guirlandes, Mirage, Seracs | Sols ouverts, ponts, arches, escaliers courts, puis des pics plus serrés |
| 9 à 16 | Toits, Canopée, Anneaux, Cheminée, Oasis, Crête, Néons, Lianes | Arches basses, longs escaliers, suites de trous, pics sans escalier, plates-formes |
| 17 à 20 | Satellite, Traîneau, Tempête, Apogée | Le mélange le plus chargé. Apogée est le plus difficile, et chaque trou reste sautable |

Chaque niveau a son propre enchaînement. Dans un niveau, les obstacles ne se répètent pas à l’identique : un pic, un bloc, un trou, une arche ou une marche n’a pas la même taille que le suivant. Les vides entre les pièges sont plus courts. Plusieurs fois par niveau, un enchaînement de plates-formes passe au-dessus d’un trou à pics, du même genre que la fin du niveau 5 : ça monte, ça descend ou ça mélange, avec des plates-formes rouges à pics qu’il ne faut pas prendre. Les niveaux suivants en ont de plus longs. Chaque saut reste possible. Le biome peint le ciel et le sol : Désert, Montagne, Ville, Jungle, Espace ou Noël, selon le niveau, pas selon son numéro seul.

La vitesse de référence part de la base du niveau et monte un peu jusqu’à l’arrivée. À la mort, elle revient à cette base. La première réussite verse `50 × numéro`, une seule fois.

### 5.4 Musique

Vingt mondes, montrés comme l’aventure : huit par page, sur trois pages, du plus facile au plus difficile. Ce ne sont pas les niveaux d’aventure : chaque monde a son nom, son biome et son parcours. Réussir un monde ouvre seulement le suivant. Les mondes réussis restent rejouables. Ils ne s’achètent pas.

Le monde et le mur de feu attendent le premier appui (droite, D, clic droit, clic gauche ou Z). Ensuite le joueur avance lui-même. Le feu, lui, avance toujours à la vitesse de course : s’arrêter ne l’arrête pas, reculer non plus. Son front reste dans l’écran. Un joueur immobile se fait donc rattraper.

Le morceau joue au temps, du premier appui jusqu’à la fin de la course. S’il se termine avant l’arrivée, il reprend, pour qu’il y ait de la musique tout le long. L’arrivée coupe le son. Ces règles de musique, de feu et de saut ne valent que pour Musique. Le volume de cette musique, et de celle des biomes en infini, est un peu plus fort.

Le saut dure deux temps du morceau et passe la marche devant lui, ainsi que le vide placé entre certains escaliers. Ce vide reste sous les deux tiers environ de la distance du saut. Les planches d’un enchaînement sont écartées de la longueur de ce saut : il faut le saut entier pour passer de l’une à l’autre. Une planche plus haute reste à la portée de ce même saut. Le tempo est rapide. En tenant la course, un monde dure entre 40 et 55 secondes. Néon est le plus facile. Zénith est le plus difficile.

Pas de vaisseau. Les vingt parcours ne se ressemblent pas, et dans un même parcours les obstacles ne sont pas des copies : escaliers, blocs, pics et trous changent de taille et se relaient. Un saut passe encore chaque trou.

Tenir Droite aligne le joueur sur le tempo : un temps de décor mesure la distance franchie pendant un temps de musique. Presque chaque phrase de deux mesures est un escalier, et il commence sur le temps frappé, avec l’accord. Les marches n’ont pas toutes la même largeur ni la même hauteur. Selon la phrase : ça monte, ça monte puis ça redescend, un écart coupe l’escalier, un trou précède les marches, ou des pics suivent la dernière marche. Les derniers mondes ont plus de marches, de plus hautes, et des vides plus larges. Une marche reste sous le saut du morceau.

| Mondes | Airs | Idée |
| --- | --- | --- |
| 1 à 5 | Néon, Backbeat, Circuit, Asphalte, Surcharge | Les plus ouverts. Escaliers courts, pics et blocs, vides rares. |
| 6 à 12 | Relais, Foudre, Gravier, Voltage, Sirène, Moteur, Écho | Marches plus hautes, vides plus souvent. |
| 13 à 20 | Bitume, Laser, Riff, Turbo, Orage, Arcade, Chrome, Zénith | Le mélange le plus chargé. Zénith est le plus difficile, et chaque trou reste sautable. |

Les airs alternent l’électro et le rock, joués vite, synthétisés dans la page. L’électro enchaîne kick, basse et lead en dent de scie. Le rock pose la caisse claire sur les temps 2 et 4. Chaque escalier part avec un accord plus fort. Finir enregistre le temps. Un meilleur temps remplace le record. Mourir n’enregistre rien et n’ouvre pas le monde suivant.

Toucher le mur de feu joue d’abord l’animation de brûlure, environ une demi-seconde, le personnage en flammes. Ensuite le choc se résout comme les autres flammes : lance-pierre si l’on est grand ou s’il reste une vie, écran de mort sinon.

### 5.5 Monde du passé

Il n’apparaît qu’en infini, et seulement en tombant dans un trou sans pics ou en touchant la paroi de ce trou. L’aventure et Musique n’y mènent jamais.

1. Le joueur glisse vers le milieu du trou. La caméra descend avec lui.
2. L’écran devient noir depuis les bords, jusqu’au centre.
3. Il se rouvre sur le monde du passé. Un poulet y mange de l’herbe. Le personnage n’est pas encore là.
4. Deux secondes plus tard, le personnage crie et tombe sur le poulet.
5. Il est assis sur le poulet. Z, ou le clic gauche, donne un second saut pendant qu’il est en l’air. Des hommes préhistoriques, un os à la main, le suivent pour le toucher. Ils courent un peu moins vite que le joueur : en tenant la course, on les distance. S’il s’arrête, ils continuent jusqu’au contact : ce contact est un choc. Ils montent sur les obstacles sans mourir, et si le joueur recule, ils reviennent vers lui. La course est très dure dès le début : pics, blocs, escaliers serrés, sauts, et enchaînements de plates-formes. Des étagères barrent le chemin. Parfois des pics sont posés dessous : passer en dessous tue, sauter dessus est le passage. Les trous de ce monde ont tous des pics : ils ne rouvrent pas un autre passé. Les constructions s’allongent avec la vitesse.

Dès qu’il est sur le poulet, il gagne un diamant toutes les 10 secondes, y compris pendant un lance-pierre.

Les vies ne fonctionnent pas ici, et aucune n’apparaît. Un choc, même en étant grand ou avec des vies, ne joue pas le lance-pierre et n’enlève pas de vie. L’écran redevient noir, puis le joueur réapparaît dans le biome d’avant, sur le sol juste avant le trou, avec le même nombre de vies et les diamants déjà gagnés. Ce trou a maintenant des pics. Y retomber est un choc de trou, et il n’ouvre plus le passé.

### 5.6 Vitesse

- Infini : `min(plafond, base × (1 + distance × coefficient))`, puis × 1,22 si l’on avance. Pas de feu.
- Aventure : base du niveau × `(1 + progression × 0,22)`, puis × 1,22 si l’on avance. Pas de feu.
- Musique : vitesse fixe de la piste, nulle tant que le morceau n’a pas commencé, puis × 1,22 si l’on avance. Le feu avance toujours à cette vitesse de course, même à l’arrêt, et son front reste dans l’écran.
- La pause fige le monde, le feu de Musique et la musique.

## 6. Personnage

### 6.1 Formes

| Forme | Déclencheur | Physique |
| --- | --- | --- |
| Coureur | Cercle bleu | Gravité, un saut à l’appui |
| Vaisseau | Cercle violet | Maintien du clic gauche, de Z, d’Espace ou de la flèche haut = montée. Relâchement = descente |

Le cercle violet manque pendant les 15 premières secondes, et manque en Musique. Une fois pris, le vaisseau dure 8 s. Les cercles violets sont plus espacés qu’avant, et un second ne peut pas apparaître dans les 4 s qui suivent une prise.

Le vaisseau survole un trou tant qu’il n’y entre pas. Le coureur tombe dès que le sol s’ouvre.

### 6.2 Taille

Normale, ×1. Grande, ×1,6. La croissance dure 0,9 s : ×1, puis ×1,2, puis ×1,4, puis ×1,6.

Le bonus de croissance n’est proposé qu’en taille normale. Le prendre bloque un autre bonus de croissance pendant 4 s, et retire ceux déjà posés sur le chemin des 4 prochaines secondes.

Un choc en grande taille joue le lance-pierre et rend la taille normale, sans dépenser de vie. Pendant un ralenti, le même choc est une mort réelle.

### 6.3 Plafond du vaisseau

Le haut de l’écran est un plafond pour le vaisseau seulement. Ce n’est pas un lance-pierre.

1. Ralenti actif : chute mortelle.
2. Taille grande : projection au centre, rétrécissement en trois paliers, aucune vie.
3. Taille normale et au moins une vie : même projection, une vie.
4. Taille normale et zéro vie : chute, puis l’écran de mort après 2 s.

## 7. Monde

| Objet | Rôle |
| --- | --- |
| Sol, plate-forme, marche | Surfaces. Les marches d’un escalier sont collées et de hauteurs différentes. Une planche ne se traverse pas par le côté : le choc fait retomber, comme un passage par-dessous |
| Bloc, pic | Obstacles. Le dessus d’un bloc se quitte en tombant |
| Trou à pics | Ouverture à pics, parois solides. Une fois les pieds sous le bord, on tombe jusqu’aux pics du fond. En infini : tous les trous avant 15 000 m, puis deux sur trois. Aventure : les trous ouverts ont des pics. En Musique, sous les étagères des mondes 5 à 7 le sol est bouché. Des mondes 8 à 10, ce vide est ouvert et une chute y tue, sans pics rouges entre les étagères. À partir du monde 11, le trou a des pics et des plates-formes rouges |
| Trou sans pics | Infini seulement, après 15 000 m, un trou sur trois. Pas de pics. Chute ou contact avec la paroi : glissade, puis le monde du passé |
| Cercle bleu / violet | Coureur / vaisseau |
| Croissance, ralenti | Bonus. Le même type attend 4 s après une prise |
| Pièce du ciel | +1, ruban continu en zigzag, visible seulement en vaisseau |
| Cœur | +1 vie. En infini, un seul tous les 8 000 m, sur une étagère. Aucun dans le passé, ni en aventure |
| Mur de feu | Musique seulement. Toute la hauteur. Invisible tant que le morceau n’a pas commencé. Ensuite il avance toujours à la vitesse de course, même à l’arrêt, sans sortir de l’écran |

La rapidité et les tremplins ne sont pas placés.

### 7.1 Feu

L’infini et l’aventure n’ont pas de mur de feu. Rien ne s’y embrase.

En Musique, le mur occupe toute la hauteur. Il n’apparaît qu’au premier appui. À partir de là, il avance tout seul à la vitesse de course, que le joueur coure, s’arrête ou recule. Son front est ramené dans l’écran s’il devait en sortir, à gauche comme à droite.

Toucher ce front est un choc de flamme. Le personnage brûle d’abord, environ une demi-seconde, puis le choc se résout. Un objet dont le feu atteint le bord s’embrase en entier, d’un coup. Le sol déjà dépassé brûle aussi.

### 7.2 Décors

Ils ne jouent pas. Ils sont nombreux, de tailles différentes, et deux décors voisins ne sont pas le même. Le lointain d’un même biome change le long de la course : dunes, crêtes, immeubles et arbres n’ont pas un seul modèle. Ce lointain avance à peine par rapport au joueur. Certains objets sont plus loin, plus petits.

| Biome | Ciel | Au sol |
| --- | --- | --- |
| Désert | Soleil, dunes de formes différentes | Cactus, scarabée, tente, pot, crâne, buisson, palmier, chariot, vautour |
| Montagne | Pics variés, neige qui tombe | Pingouin, igloo, sapin, luge, bonhomme de neige, renard, cabane, cristal |
| Ville | Immeubles de hauteurs et de toits différents | Chat, dirigeable, lampadaire, bouche d’incendie, panneau, pigeon, banc, enseigne |
| Jungle | Cimes variées | Perroquet, singe, fleur, grenouille, totem, buisson, champignon, liane, toucan |
| Espace | Étoiles, lune, parfois un anneau | Martiens verts en combinaison, certains font coucou. Satellite, comète, cratère, drapeau, robot, capsule, rover |
| Noël | Neige qui tombe, collines, père Noël en traîneau, cadeaux au loin | Cadeau, sapin, couronne, sucre d’orge, cloche, bonhomme de neige, chaussette, lanterne |
| Passé | Fougères, parfois un volcan | Fougère, rocher, os, totem, œuf, crâne, hutte, feu, lance |

### 7.3 Structures

Escaliers collés. Montée d’une marche : 34 à 64. Largeur : au moins 140. Dans un même escalier, les marches n’ont pas toutes la même taille. Un palier est collé à la dernière. Rentrer dans la face, sans sauter, est un choc.

En infini, 2 marches basses au début, jusqu’à 6 avec le temps. Souvent l’escalier redescend ensuite. Entre deux escaliers, un vide demande un saut : court au début, plus large ensuite, toujours sous le saut possible à cette vitesse. En aventure, le dessin change à chaque niveau, comme au chapitre 5.3. Ces largeurs et ces hauteurs sont celles de l’infini et de l’aventure.

Des enchaînements de plates-formes demandent de sauter de l’une à l’autre : la suite monte, descend, reste à plat, ou mélange les trois. Certaines plates-formes, plus basses et rouges, portent des pics : y poser le pied tue. La plate-forme sûre est le seul chemin, et chaque saut reste possible. L’aventure en place plusieurs par niveau, au-dessus d’un trou à pics. En infini, ces enchaînements n’apparaissent pas avant 15 000 m. Les premiers y sont courts. À partir de 25 000 m, ils sont plus nombreux et plus longs. Dans le passé, ils sont là dès le début, avec le reste de la difficulté. En Musique, ils commencent au monde 5, et l’écart entre deux planches est la longueur du saut. On ne traverse pas une planche par le côté : on retombe, comme en passant dessous. Aux mondes 5 à 7, il n’y a pas de pics rouges entre les étagères, et le trou est bouché : rater un saut pose au sol, sans tuer. Aux mondes 8 à 10, toujours sans pics rouges entre les étagères, le vide sous elles est ouvert : y tomber tue. À partir du monde 11, le trou a des pics et des plates-formes rouges entre les étagères.

En Musique, les escaliers suivent le tempo, chapitre 5.4. Ils commencent sur le temps frappé. Une marche reste sous le saut du morceau. Entre certains escaliers, un vide se franchit d’un saut. Il est rare et court sur Néon, fréquent et plus large sur Zénith, sans jamais dépasser le saut.

### 7.4 Constructions et vitesse

En infini et dans le monde du passé, la longueur des sols, des blocs, des pics, des plates-formes et des marches suit la vitesse de référence. À la vitesse de base, elles ont leur taille de départ. Elles peuvent aller jusqu’à 2,4 fois plus long. L’aventure et Musique gardent le dessin prévu.

## 8. Ralenti

5 s, échelle de temps × 0,55. Le prendre bloque un autre ralenti pendant 4 s. Pendant le ralenti, un pic, un bloc, une flamme ou un trou est une mort réelle.

## 9. Mort et lance-pierre

Dans cet ordre :

0. Plafond du vaisseau : chapitre 6.3. Jamais de lance-pierre.
1. Ralenti actif : écran de mort.
2. Pic, bloc, flamme ou trou, taille grande : lance-pierre, aucune vie, retour à la taille normale.
3. Même choc, taille normale, au moins une vie : une vie, lance-pierre.
4. Même choc, taille normale, zéro vie : écran de mort.
5. Monde du passé : aucun de ces cas. Le choc ramène au biome précédent sans retirer de vie.

La cinématique est la même dans les cas 2 et 3 : montée, dézoom, ralentissement, visée en reculant, trajectoire en pointillés, lancer à l’opposé du recul, effet du biome au bord de l’écran. À l’impact, un nuage de fumée se lève sous le personnage et se dissipe. Un atterrissage sûr reprend la course, en taille normale, distance conservée. Un atterrissage dangereux ouvre l’écran de mort, sans second lance-pierre.

L’écran de mort propose Recommencer et Quitter. Entrée, Espace, ou un clic gauche qui n’est pas sur un bouton, recommencent aussi.

## 10. Pièces, diamants, vies, boutique

Compteurs en haut à droite : vies, pièces, diamants, pause.

Le diamant est la monnaie la plus rare. Il ne se ramasse pas dans le niveau. Il se gagne dans le monde du passé : 1 toutes les 10 secondes de course sur le poulet. Il reste acquis même après le retour au biome.

- Pièce du ciel : 1. Ruban continu, une pièce tous les 22 pixels, qui monte et descend entre le haut du ciel et l’altitude de vol. Il n’existe que pendant le vaisseau.
- Prime de distance : 1 pièce pour 100 unités, versée à l’écran de mort.
- Prime de première réussite : 50 × le niveau.
- Quitter ou recommencer avant la mort ne verse rien.
- Le cœur ajoute 1 vie. Les vies repartent à 0 à chaque tentative.
- En infini, un cœur ne peut apparaître que tous les 8 000 m. Il est posé sur une étagère basse, facile à prendre. On ne traverse pas cette étagère : la heurter fait tomber, sans mourir. Le monde du passé n’en fait jamais apparaître, et y mourir ne retire aucune vie.

La boutique a trois pages. Les deux premières montrent les skins, du moins cher au plus cher : Classique 0, Dino 120, Cube 300, Astronaute 600, Chat 950, Robot 1400, Oiseau 2100, Spectre 2900, puis Renard 3700, Lapin 4600, Ninja 5600, Chevalier 6800, Sorcier 8100, Pirate 9500, Panda 11000, Alien 12900. L’achat ne change pas les statistiques.

La dernière page montre les accessoires, en diamants : écharpe 6, bonnet 8, lunettes 10, cape 12, couronne 14, nœud 16, ailes 18, masque 20. Chacun se voit sur la carte, porté par le personnage équipé, et se porte sur tous les skins. Ils dépassent du corps. Le rectangle de collision reste celui du corps. Si l’accessoire seul touche un bloc, ce n’est pas un choc. Un second appui sur l’accessoire équipé le retire.

## 11. Interface

- Avant que la caméra ne suive, le personnage part à gauche et court vers le milieu. Ensuite il reste vers 38 % de la largeur, pour voir devant.
- En infini, la caméra ne recule pas. Si le joueur recule, elle reste en place. Elle ne repart en avant que lorsqu’il est revenu au centre et qu’il avance.
- Le personnage ne peut pas sortir de l’image. Au bord, il est arrêté. Ce blocage ne le tue pas.
- Infini : distance et biome. Aventure : numéro et biome. Musique : temps et nom de l’air. Passé : secondes et « Monde du passé ».
- Le texte d’aide dit d’avancer avec Droite, D ou le clic droit, et de sauter avec le clic gauche ou Z.
- Pause : Échap ou le bouton. Reprendre, Recommencer, Quitter.

## 12. Contrôles

| Action | Souris | Clavier | Toucher |
| --- | --- | --- | --- |
| Avancer | Clic droit. Un clic court avance un peu, le maintien avance jusqu’au relâchement | Flèche droite ou D | — |
| Reculer | — | Flèche gauche ou Q | — |
| Sauter, monter, lancer Musique | Clic gauche. Maintien pour le vaisseau | Z, Espace ou flèche haut | Appui. Maintien pour le vaisseau |
| Descendre plus vite en l’air, en Musique | — | Flèche bas ou S | — |
| Pause | Bouton | Échap | Bouton |
| Visée du lance-pierre | Glisser en arrière | — | Glisser en arrière |
| Lancer | Relâcher | — | Relâcher |
| Recommencer après la mort | Clic gauche hors d’un bouton | Entrée ou Espace | — |

Sans flèche droite, D ni clic droit, le personnage stagne. En Musique, le feu continue d’avancer. En infini et en aventure, il n’y a pas de feu.

## 13. Sauvegarde

Préfixe `dashmorph.` : `coins`, `diamonds`, `owned`, `equipped`, `ownedAccessories`, `accessory`, `unlockedLevel`, `cleared`, `unlockedTrack`, `clearedTracks`, `tracks`, `times`.

`unlockedLevel` et `unlockedTrack` n’avancent que d’un cran : réussir le monde en cours ouvre le suivant, pas ceux d’après. L’aventure et Musique ont chacun leur compteur.

Écriture à l’achat, à l’équipement, au crédit de pièces et à la réussite. Une partie en cours n’est pas reprise après un rechargement.

## 14. Paramètres

| Paramètre | Valeur |
| --- | --- |
| Vitesse de base, infini | 210 / s, puis montée lente |
| Coefficient de distance | 0,000055 |
| Vitesse maximale, infini | 720 / s |
| Bases aventure | 260, puis un cran de plus à chaque niveau, jusqu’à 440 au niveau 20 |
| Coefficient d’aventure | 0,22 |
| Course volontaire | × 1,22 la vitesse de référence |
| Allongement des constructions | Infini et monde du passé, selon la vitesse, plafond × 2,4 |
| Trous sans pics | Infini seulement, après 15 000 m, 1 sur 3 |
| Diamant | 1 toutes les 10 s sur le poulet |
| Hommes préhistoriques | Un peu moins vite que la course du joueur (× 0,88). Ils rattrapent un joueur arrêté |
| Skins | 0, 120, 300, 600, 950, 1400, 2100, 2900, 3700, 4600, 5600, 6800, 8100, 9500, 11000, 12900 |
| Accessoires | 6, 8, 10, 12, 14, 16, 18 et 20 diamants |
| Feu | Musique seulement. Vitesse de course en continu, même à l’arrêt. Front gardé dans l’écran |
| Saut en Musique | Deux temps du morceau. Il passe la marche et le vide devant lui. Les planches sont écartées de cette longueur |
| Blocage d’un bonus déjà pris | 4 s, et les copies sur les 4 prochaines secondes de chemin |
| Écart des fusées, infini | 4600 |
| Vaisseau | absent 15 s, puis 8 s |
| Croissance | ×1 → ×1,2 → ×1,4 → ×1,6 en 0,9 s |
| Ralenti | 5 s, × 0,55 |
| Fondu de biome | 860 unités, tous les 4200 |
| Ordre des biomes, infini | Hasard à chaque partie, remélangé à chaque tour. Le départ n’est jamais Espace ni Noël |
| Pièce du ciel | 1, tous les 22 |
| Prime de distance | 1 / 100 |
| Prime de première réussite | 50 × niveau d’aventure. Musique n’en verse pas |
| Trou à pics | Profondeur 100, parois solides, choc au fond. Le trou sans pics, lui, ouvre le passé dès la lèvre |
| Mondes musicaux | 20, déverrouillés un par un, sans achat |
| Volume des mondes | un peu plus fort qu’avant |

## 15. Critères d’acceptation

1. `index.html` se lance en local, sans réseau.
2. Sans touche, le personnage ne gagne pas de distance. Droite, D ou le clic droit l’avancent. Gauche ou Q le reculent. Le clic gauche, Z, Espace ou la flèche haut le font sauter.
3. L’infini et l’aventure n’ont pas de feu. En Musique, le mur avance toujours à la vitesse de course, même à l’arrêt, ne sort pas de l’écran, et un objet qu’il touche s’embrase en entier.
4. Le même bonus, une fois pris, ne réapparaît pas pendant 4 s.
5. Les cercles violets sont plus rares qu’un bonus de croissance ou de ralenti.
6. En infini, le ciel, le sol et le décor fondent d’un biome à l’autre. Le lointain défile à peine, énormément plus lentement que le sol. Une course n’ouvre jamais sur Espace ni sur Noël.
7. L’espace montre une lune et des martiens verts qui sautent ; certains font coucou. Noël montre de la neige, un père Noël et des cadeaux. Les autres biomes ont leur propre décor.
8. Les pièces du ciel forment un zigzag continu, et seulement pendant le vaisseau.
9. L’aventure se joue sans musique et sans bonus. En Musique, le morceau couvre toute la course.
10. Un pic, un bloc, une flamme ou un trou joue le lance-pierre si l’on est grand ou s’il reste une vie. Le plafond du vaisseau ne le joue pas. Le passé ne retire pas de vie.
11. Les vingt niveaux d’aventure n’ont pas le même dessin. Ils tiennent sur trois pages, et le suivant est plus dur. Réussir un niveau n’ouvre que le suivant.
12. Les vingt mondes de Musique sont ceux du chapitre 5.4. Ils tiennent sur trois pages, comme l’aventure, avec d’autres parcours. Le morceau joue tout le long de la course et reprend s’il finit avant l’arrivée. Réussir un monde n’ouvre que le suivant.
13. En infini, avant 15 000 m, tous les trous ont des pics. Après, un trou sur trois n’en a pas. Y tomber, ou toucher sa paroi, suit la caméra dans le trou, ferme l’écran depuis les bords, puis ouvre le monde du passé. Après 2 s, le personnage crie et tombe sur le poulet. Aventure et Musique n’ouvrent jamais ce monde. Les trous à pics ont des parois solides : on y tombe jusqu’aux pics, et ce contact est une mort si l’on n’est ni grand ni protégé par une vie.
14. Le passé est très dur dès le début : pics, escaliers serrés, enchaînements de plates-formes, et des étagères dont certaines ont des pics en dessous. Un diamant tombe toutes les 10 s. Aucune vie n’y apparaît. Un choc y ramène au biome précédent sans retirer de vie, avec les diamants déjà gagnés, sur le sol juste avant le trou. Ce trou a alors des pics : y retomber tue et ne rouvre pas le passé. Les accessoires s’achètent avec, et ne tuent pas s’ils sont seuls à toucher un bloc.
15. Le feu, en Musique, brûle le personnage avant de résoudre le choc. En infini, les constructions sont plus longues quand la vitesse monte.
16. En Musique, le saut dure deux temps et passe la marche devant lui, ainsi que le vide entre certains escaliers. Les planches d’un enchaînement sont écartées de la longueur de ce saut.
17. Néon est le monde musical le plus facile, Zénith le plus difficile. En tenant la course, chaque monde dure entre 40 et 55 secondes. Dans un monde musical comme dans un niveau d’aventure, les obstacles d’un même parcours n’ont pas tous la même forme. La musique y est un peu plus forte.
18. Sur le poulet, le personnage est assis et Z ou le clic gauche en l’air donne un second saut. Les hommes préhistoriques montent sur les obstacles et courent un peu moins vite que le joueur. Ils continuent d’avancer vers lui même s’il s’arrête, jusqu’à le toucher. Ce contact est un choc.
19. La boutique montre d’abord les skins du moins cher au plus cher, sur deux pages, puis les accessoires. Les prix sont ceux du chapitre 10.
