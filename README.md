# BOOgle

Un clone du jeu de mots Boggle, développé avec Next.js, React et TypeScript — portage web d'un projet C# original (algorithmes de recherche récursive).


🎮 **[Jouer à la démo](https://boogle-demo.vercel.app/)**

## Règles

Un plateau de lettres est généré aléatoirement. Trouve un maximum de mots en reliant des lettres adjacentes (horizontalement, verticalement ou en diagonale) avant la fin du chrono. Chaque lettre ne peut être utilisée qu'une fois par mot.

## Fonctionnalités

- Plateau de 4×4 à 6×6, durée de partie configurable
- Dictionnaire de plusieurs dizaines de milliers de mots français (généré via le paquet [`an-array-of-french-words`](https://www.npmjs.com/package/an-array-of-french-words), filtré et scoré à la volée par `scripts/generate-words.js`)
- Score calculé selon la valeur des lettres (façon Scrabble) + un bonus de longueur
- Le chemin du mot validé s'illumine sur le plateau, preuve visuelle que l'algorithme de recherche a bien fonctionné
- Nuage de mots généré en fin de partie à partir des mots trouvés

## Stack technique

- **Next.js** (App Router)
- **React**
- **TypeScript**
- **Tailwind CSS**

## Lancer le projet en local

```bash
git clone https://github.com/PierreBoudraa/boogle-demo.git
cd boogle-demo
npm install
node scripts/generate-words.js   # génère data/mots.json
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000) dans ton navigateur.

## Ce que ce projet démontre

- Portage d'algorithmes récursifs du C# vers TypeScript : recherche dichotomique dans un dictionnaire trié, et recherche de mot sur une grille par backtracking en 8 directions
- Génération procédurale de plateau et calcul de score
- Rendu Canvas (nuage de mots)