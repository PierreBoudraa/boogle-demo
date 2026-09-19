"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import MOTS_VALIDES from "../data/mots.json";

// ============================================================
// DONNÉES : distribution des lettres et valeurs de points,
// portées depuis Dé.cs et Joueur.cs (LetterValues)
// ============================================================
const POOL_LETTRES =
  "EEEEEEEEEEEEEEEAAAAAAAAAIIIIIIIISSSSSSSSNNNNNNNTTTTTTTRRRRRRROOOOOOLLLLLLUUUUUUDDDDCCCCPPPMMMGGBBFHJVZQYXKW";

const VALEURS_LETTRES: Record<string, number> = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4,
  G: 2, H: 4, I: 1, J: 8, K: 10, L: 1,
  M: 2, N: 1, O: 1, P: 3, Q: 8, R: 1,
  S: 1, T: 1, U: 1, V: 4, W: 10, X: 10,
  Y: 10, Z: 10,
};

// Dictionnaire chargé depuis data/mots.json (généré par
// scripts/generate-words.js à partir du paquet npm
// an-array-of-french-words) — même principe que Dictionnaire.cs
// mais embarqué côté client, déjà trié pour la recherche dichotomique

// ============================================================
// ALGORITHMES : portés depuis Dictionnaire.cs et Plateau.cs
// ============================================================

// Recherche dichotomique récursive, portée depuis RechDichoRécursif
function rechDichoRecursif(
  mot: string,
  mots: string[],
  debut = 0,
  fin: number = mots.length - 1
): boolean {
  if (debut > fin) return false;
  const milieu = Math.floor((debut + fin) / 2);
  const comparaison = mot < mots[milieu] ? -1 : mot > mots[milieu] ? 1 : 0;
  if (comparaison === 0) return true;
  if (comparaison < 0) return rechDichoRecursif(mot, mots, debut, milieu - 1);
  return rechDichoRecursif(mot, mots, milieu + 1, fin);
}

type Position = { ligne: number; col: number };

// Recherche récursive du mot sur le plateau (8 directions, backtracking),
// portée depuis Plateau.ChercheMot / Test_Plateau
function trouverCheminMot(plateau: string[][], mot: string): Position[] | null {
  const taille = plateau.length;
  const dLigne = [-1, -1, -1, 0, 0, 1, 1, 1];
  const dCol = [-1, 0, 1, -1, 1, -1, 0, 1];

  function chercheMot(
    index: number,
    ligne: number,
    col: number,
    visited: boolean[][],
    chemin: Position[]
  ): boolean {
    if (index === mot.length) return true;
    if (
      ligne < 0 ||
      col < 0 ||
      ligne >= taille ||
      col >= taille ||
      visited[ligne][col] ||
      plateau[ligne][col] !== mot[index]
    ) {
      return false;
    }

    visited[ligne][col] = true;
    chemin.push({ ligne, col });

    for (let k = 0; k < 8; k++) {
      if (chercheMot(index + 1, ligne + dLigne[k], col + dCol[k], visited, chemin)) {
        return true;
      }
    }

    visited[ligne][col] = false;
    chemin.pop();
    return false;
  }

  for (let i = 0; i < taille; i++) {
    for (let j = 0; j < taille; j++) {
      if (plateau[i][j] === mot[0]) {
        const visited: boolean[][] = Array.from({ length: taille }, () =>
          new Array(taille).fill(false)
        );
        const chemin: Position[] = [];
        if (chercheMot(0, i, j, visited, chemin)) return chemin;
      }
    }
  }
  return null;
}

// Calcul des points, porté depuis Joueur.CalculerPoints
function calculerPoints(mot: string): number {
  let base = 0;
  for (const lettre of mot) base += VALEURS_LETTRES[lettre] ?? 0;

  let bonus: number;
  switch (mot.length) {
    case 2: bonus = 1; break;
    case 3: bonus = 2; break;
    case 4: bonus = 3; break;
    case 5: bonus = 5; break;
    case 6: bonus = 7; break;
    case 7: bonus = 9; break;
    case 8: bonus = 12; break;
    default: bonus = 15; break;
  }
  return base + bonus;
}

function genererPlateau(taille: number): string[][] {
  const plateau: string[][] = [];
  for (let i = 0; i < taille; i++) {
    const ligne: string[] = [];
    for (let j = 0; j < taille; j++) {
      ligne.push(POOL_LETTRES[Math.floor(Math.random() * POOL_LETTRES.length)]);
    }
    plateau.push(ligne);
  }
  return plateau;
}

type MotTrouve = { mot: string; points: number; chemin: Position[] };
type Phase = "config" | "jeu" | "fin";

export default function Home() {
  const [taille, setTaille] = useState(4);
  const [dureeSecondes, setDureeSecondes] = useState(90);
  const [phase, setPhase] = useState<Phase>("config");
  const [plateau, setPlateau] = useState<string[][]>([]);
  const [tempsRestant, setTempsRestant] = useState(0);
  const [motActuel, setMotActuel] = useState("");
  const [motsTrouves, setMotsTrouves] = useState<MotTrouve[]>([]);
  const [message, setMessage] = useState<{ texte: string; type: "ok" | "erreur" } | null>(null);
  const [surbrillance, setSurbrillance] = useState<Position[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const score = motsTrouves.reduce((s, m) => s + m.points, 0);

  // Chrono
  useEffect(() => {
    if (phase !== "jeu") return;
    if (tempsRestant <= 0) {
      setPhase("fin");
      return;
    }
    const t = setTimeout(() => setTempsRestant((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, tempsRestant]);

  // Nuage de mots, porté depuis NuageDeMots.GenererNuageDeMots
  useEffect(() => {
    if (phase !== "fin") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#fbf6ea";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const mots = [...motsTrouves].sort((a, b) => a.mot.length - b.mot.length);
    mots.forEach(({ mot }) => {
      const taillePolice = 14 + Math.random() * 26;
      ctx.font = `bold ${taillePolice}px Georgia, serif`;
      const teinte = Math.floor(Math.random() * 360);
      ctx.fillStyle = `hsl(${teinte}, 55%, 40%)`;
      const x = Math.random() * Math.max(1, canvas.width - mot.length * taillePolice * 0.6);
      const y = taillePolice + Math.random() * Math.max(1, canvas.height - taillePolice * 2);
      ctx.fillText(mot, x, y);
    });
  }, [phase, motsTrouves]);

  const demarrer = useCallback(() => {
    setPlateau(genererPlateau(taille));
    setMotsTrouves([]);
    setMotActuel("");
    setMessage(null);
    setSurbrillance([]);
    setTempsRestant(dureeSecondes);
    setPhase("jeu");
  }, [taille, dureeSecondes]);

  const valider = () => {
    const mot = motActuel.trim().toUpperCase();
    setMotActuel("");
    if (mot.length < 2) return;

    if (motsTrouves.some((m) => m.mot === mot)) {
      setMessage({ texte: `"${mot}" a déjà été trouvé.`, type: "erreur" });
      return;
    }

    const chemin = trouverCheminMot(plateau, mot);
    if (!chemin) {
      setMessage({ texte: `"${mot}" ne peut pas être formé sur ce plateau.`, type: "erreur" });
      return;
    }

    if (!rechDichoRecursif(mot, MOTS_VALIDES)) {
      setMessage({ texte: `"${mot}" n'est pas dans le dictionnaire de la démo.`, type: "erreur" });
      return;
    }

    const points = calculerPoints(mot);
    setMotsTrouves((prev) => [...prev, { mot, points, chemin }]);
    setMessage({ texte: `"${mot}" validé — +${points} points`, type: "ok" });
    setSurbrillance(chemin);
    setTimeout(() => setSurbrillance([]), 1200);
  };

  const estEnSurbrillance = (i: number, j: number) =>
    surbrillance.some((p) => p.ligne === i && p.col === j);

  return (
    <main className="min-h-screen bg-[#f6f1e7] text-[#2b2620]">
      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Hero : titre en tuiles */}
        <header className="mb-10 text-center">
          <div className="flex justify-center gap-2 mb-4">
            {"BOOGLE".split("").map((l, i) => (
              <span
                key={i}
                className="w-11 h-11 flex items-center justify-center rounded-md bg-[#fbe9c0] border-2 border-[#8a5a34] font-mono text-xl font-bold shadow-[2px_2px_0_#8a5a34]"
              >
                {l}
              </span>
            ))}
          </div>
          <p className="text-sm text-[#6b5f4f]">
            Portage web du jeu de mots C# original — recherche dichotomique et
            recherche récursive sur grille, portées telles quelles.
          </p>
        </header>

        {phase === "config" && (
          <div className="bg-white/60 rounded-xl border border-[#d8cba9] p-6 flex flex-col gap-4 items-center">
            <div className="flex gap-6">
              <label className="flex flex-col text-sm gap-1">
                Taille du plateau
                <select
                  value={taille}
                  onChange={(e) => setTaille(Number(e.target.value))}
                  className="border border-[#d8cba9] rounded-lg px-3 py-2 bg-white"
                >
                  <option value={4}>4 × 4</option>
                  <option value={5}>5 × 5</option>
                  <option value={6}>6 × 6</option>
                </select>
              </label>
              <label className="flex flex-col text-sm gap-1">
                Durée de la partie
                <select
                  value={dureeSecondes}
                  onChange={(e) => setDureeSecondes(Number(e.target.value))}
                  className="border border-[#d8cba9] rounded-lg px-3 py-2 bg-white"
                >
                  <option value={60}>1 minute</option>
                  <option value={90}>1 min 30</option>
                  <option value={120}>2 minutes</option>
                </select>
              </label>
            </div>
            <button
              onClick={demarrer}
              className="px-6 py-2.5 bg-[#8a5a34] text-white rounded-lg font-medium hover:bg-[#734a2a] transition-colors"
            >
              Lancer la partie
            </button>
          </div>
        )}

        {phase !== "config" && (
          <div className="bg-white/60 rounded-xl border border-[#d8cba9] p-6">
            <div className="flex justify-between items-center mb-5 text-sm">
              <span className="font-mono">
                ⏱ {Math.floor(tempsRestant / 60)}:{String(tempsRestant % 60).padStart(2, "0")}
              </span>
              <span className="font-mono">Score : {score}</span>
            </div>

            <div
              className="grid gap-2 justify-center mb-5"
              style={{ gridTemplateColumns: `repeat(${taille}, minmax(0, 3rem))` }}
            >
              {plateau.map((ligne, i) =>
                ligne.map((lettre, j) => (
                  <div
                    key={`${i}-${j}`}
                    className={`w-12 h-12 flex items-center justify-center rounded-md border-2 font-mono text-lg font-bold shadow-[2px_2px_0_#8a5a34] transition-colors ${
                      estEnSurbrillance(i, j)
                        ? "bg-[#59a48f] border-[#3d7364] text-white"
                        : "bg-[#fbe9c0] border-[#8a5a34]"
                    }`}
                  >
                    {lettre}
                  </div>
                ))
              )}
            </div>

            {phase === "jeu" && (
              <>
                <div className="flex gap-2 mb-3">
                  <input
                    ref={inputRef}
                    value={motActuel}
                    onChange={(e) => setMotActuel(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && valider()}
                    placeholder="Entrez un mot"
                    className="flex-1 border border-[#d8cba9] rounded-lg px-3 py-2 bg-white font-mono uppercase"
                    autoFocus
                  />
                  <button
                    onClick={valider}
                    className="px-4 py-2 bg-[#8a5a34] text-white rounded-lg text-sm font-medium hover:bg-[#734a2a] transition-colors"
                  >
                    Valider
                  </button>
                </div>
                {message && (
                  <p
                    className={`text-sm mb-3 ${
                      message.type === "ok" ? "text-[#3d7364]" : "text-[#c1443b]"
                    }`}
                  >
                    {message.texte}
                  </p>
                )}
              </>
            )}

            <div className="flex flex-wrap gap-2">
              {motsTrouves.map((m) => (
                <span
                  key={m.mot}
                  className="text-xs bg-[#fbe9c0] border border-[#8a5a34] rounded-full px-2.5 py-1 font-mono"
                >
                  {m.mot} · {m.points}
                </span>
              ))}
            </div>

            {phase === "fin" && (
              <div className="mt-6">
                <p className="text-sm mb-3">
                  Partie terminée — score final <strong>{score}</strong>, {motsTrouves.length}{" "}
                  mots trouvés.
                </p>
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={300}
                  className="w-full border border-[#d8cba9] rounded-lg bg-[#fbf6ea]"
                />
                <button
                  onClick={() => setPhase("config")}
                  className="mt-4 px-4 py-2 bg-[#8a5a34] text-white rounded-lg text-sm font-medium hover:bg-[#734a2a] transition-colors"
                >
                  Nouvelle partie
                </button>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-[#8a7f6b] text-center mt-6">
          Dictionnaire réduit à quelques centaines de mots courants pour cette démo — le
          jeu original utilise un fichier de mots complet.
        </p>
      </div>
    </main>
  );
}