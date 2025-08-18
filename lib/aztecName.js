// lib/aztecName.js
export function generateAztecHandle() {
  const adjectives = [
    "jade","obsidian","shadow","sacred","hidden","masked","coded","noir",
    "temple","golden","lunar","solar","ancient","mystic","stealth","phantom","cosmic"
  ];
  const nouns = [
    "warrior","jaguar","serpent","eagle","glyph","codex","priest",
    "pyramid","sun","moon","oracle","shield","proof","whisper","mask"
  ];

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj}-${noun}`; // e.g., jade-priest
}