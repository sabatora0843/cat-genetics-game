const state = {
  question: 0,
  score: 0,
  answered: 0,
  currentGenome: null,
  currentPhenotype: null,
  currentSequences: null
};

const LOCUS_ORDER = ["W", "O", "A", "B", "C", "D", "I", "S", "T", "L"];

/*
 * ゲーム用の架空DNA配列。
 * 実在するSNPや検査配列を示すものではない。
 *
 * 各アレルに固定配列を割り当てることで、
 * プレイヤーが繰り返し遊ぶと「配列 → アレル」を学習できる。
 */
const ALLELE_SEQUENCE = {
  W:  { W: "GCTAACGTTAGC", w: "GCTAACATTAGC" },
  O:  { O: "TACCGGATCAAG", o: "TACCGGGTCAAG", Y: "TTTTGGATCAAG" },
  A:  { A: "AACGTCTGGAAC", a: "AACGTATGGAAC" },
  B:  { B: "CGTATCGGACTA", b: "CGTATCAGACTA" },
  C:  { C: "GGAACCTTAGCG", cs: "GGAATCTTAGCG", cb: "GGAAGCTTAGCG" },
  D:  { D: "ATGCCGTAACCT", d: "ATGCCATAACCT" },
  I:  { I: "CCGTAAGGCTTA", i: "CCGTACGGCTTA" },
  S:  { S: "TTAACCGGATGC", s: "TTAACAGGATGC" },
  T:  { Mc: "AGGCTTACCGTA", mc: "AGGCTAATCGTA" },
  L:  { L: "CTTAGGCCAATG", l: "CTTAGACCAATG" }
};

function randomChoice(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function weightedChoice(items) {
  const total = items.reduce((sum, x) => sum + x.weight, 0);
  let r = Math.random() * total;

  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item.value;
  }

  return items[items.length - 1].value;
}

function randomGenome() {
  const sex = randomChoice(["female", "male"]);

  return {
    sex,
    white: weightedChoice([
      { value: ["w", "w"], weight: 9 },
      { value: ["W", "w"], weight: 1 }
    ]),
    orange: sex === "female"
      ? randomChoice([["O", "O"], ["O", "o"], ["o", "o"]])
      : randomChoice([["O", "Y"], ["o", "Y"]]),
    agouti: randomChoice([["A", "A"], ["A", "a"], ["a", "a"]]),
    brown: randomChoice([["B", "B"], ["B", "b"], ["b", "b"]]),
    colorpoint: weightedChoice([
      { value: ["C", "C"], weight: 6 },
      { value: ["C", "cs"], weight: 2 },
      { value: ["cs", "cs"], weight: 1.5 },
      { value: ["cb", "cs"], weight: 0.5 }
    ]),
    dilute: randomChoice([["D", "D"], ["D", "d"], ["d", "d"]]),
    inhibitor: weightedChoice([
      { value: ["i", "i"], weight: 7 },
      { value: ["I", "i"], weight: 2.5 },
      { value: ["I", "I"], weight: 0.5 }
    ]),
    spotting: weightedChoice([
      { value: ["s", "s"], weight: 6 },
      { value: ["S", "s"], weight: 3 },
      { value: ["S", "S"], weight: 1 }
    ]),
    tabby: randomChoice([["Mc", "Mc"], ["Mc", "mc"], ["mc", "mc"]]),
    longhair: weightedChoice([
      { value: ["L", "L"], weight: 4 },
      { value: ["L", "l"], weight: 4 },
      { value: ["l", "l"], weight: 2 }
    ])
  };
}

function genotypeString(pair) {
  return pair.join("/");
}

function genomeByLocus(g) {
  return {
    W: g.white,
    O: g.orange,
    A: g.agouti,
    B: g.brown,
    C: g.colorpoint,
    D: g.dilute,
    I: g.inhibitor,
    S: g.spotting,
    T: g.tabby,
    L: g.longhair
  };
}

function generateSequences(g) {
  const loci = genomeByLocus(g);
  const result = {};

  for (const locus of LOCUS_ORDER) {
    const [a1, a2] = loci[locus];
    const seq1 = ALLELE_SEQUENCE[locus][a1];
    const seq2 = ALLELE_SEQUENCE[locus][a2];
    result[locus] = `${seq1} / ${seq2}`;
  }

  return result;
}

function hasAllele(pair, allele) {
  return pair.includes(allele);
}

function isHomozygous(pair, allele) {
  return pair[0] === allele && pair[1] === allele;
}

function hasDominantWhite(g) {
  return hasAllele(g.white, "W");
}

function isDilute(g) {
  return isHomozygous(g.dilute, "d");
}

function hasInhibitor(g) {
  return hasAllele(g.inhibitor, "I");
}

function hasSpotting(g) {
  return hasAllele(g.spotting, "S");
}

function isLonghair(g) {
  return isHomozygous(g.longhair, "l");
}

function isAgouti(g) {
  return hasAllele(g.agouti, "A");
}

function isChocolate(g) {
  return isHomozygous(g.brown, "b");
}

function isTortoiseshell(g) {
  return g.sex === "female"
    && g.orange.includes("O")
    && g.orange.includes("o");
}

function isOrange(g) {
  return hasAllele(g.orange, "O");
}

function colorpointType(g) {
  const value = genotypeString(g.colorpoint);
  if (value === "cs/cs") return "ポイント";
  if (value === "cb/cs" || value === "cs/cb") return "ミンク";
  return null;
}

function eumelaninColor(g) {
  let color = isChocolate(g) ? "チョコレート" : "ブラック";

  if (isDilute(g)) {
    color = color === "チョコレート" ? "ライラック" : "ブルー";
  }

  return color;
}

function orangeColor(g) {
  return isDilute(g) ? "クリーム" : "レッド";
}

function tabbyPattern(g) {
  return isHomozygous(g.tabby, "mc")
    ? "クラシックタビー"
    : "マッカレルタビー";
}

function hairSuffix(g) {
  return isLonghair(g) ? "・ロングヘア" : "";
}

function applyPoint(base, g, explanation) {
  const type = colorpointType(g);
  if (!type) return base;

  explanation.push(
    type === "ポイント"
      ? "C座が cs/cs のためポイントカラーとして扱います。"
      : "C座が cb/cs のためミンク系の色制限として扱います。"
  );

  return `${base}・${type}`;
}

function applySilver(base, g, explanation, agoutiVisible) {
  if (!hasInhibitor(g)) return base;

  if (agoutiVisible) {
    explanation.push("I があるため、タビー系ではシルバーとして扱います。");
    return `${base}・シルバー`;
  }

  explanation.push("I があるため、ソリッド系ではスモークとして扱います。");
  return `${base}・スモーク`;
}

function predict(g) {
  const explanation = [];

  if (hasDominantWhite(g)) {
    explanation.push("W があるため優性白となり、他の毛色遺伝子の表現を覆います。");
    if (isLonghair(g)) explanation.push("l/l のため長毛です。");

    return {
      name: `ホワイト${hairSuffix(g)}`,
      explanation
    };
  }

  explanation.push(
    isDilute(g)
      ? "d/d のため色が希釈されます。"
      : "D が少なくとも1つあるため非希釈色です。"
  );

  let base = "";
  let agoutiVisible = false;

  if (isTortoiseshell(g)) {
    const dark = eumelaninColor(g);
    const red = orangeColor(g);

    explanation.push("メスの O/o により、黒系と赤系がモザイク状に現れます。");

    if (isAgouti(g)) {
      base = `${dark}タビー＆${red}（トービー）`;
      agoutiVisible = true;
      explanation.push("A_ のため黒系部分にタビー模様が現れます。");
    } else {
      base = `${dark}＆${red}（トーティ）`;
      explanation.push("a/a のため黒系部分は基本的にソリッドです。");
    }

    base = applySilver(base, g, explanation, agoutiVisible);
    base = applyPoint(base, g, explanation);

    if (hasSpotting(g)) {
      explanation.push("S があるため白斑が加わります。");

      const commonName = isDilute(g)
        ? "ダイリュート・キャリコ"
        : "三毛（キャリコ）";

      if (isLonghair(g)) explanation.push("l/l のため長毛です。");

      return {
        name: `${commonName} [${base}＆ホワイト]${hairSuffix(g)}`,
        explanation
      };
    }

    if (isLonghair(g)) explanation.push("l/l のため長毛です。");

    return {
      name: `${base}${hairSuffix(g)}`,
      explanation
    };
  }

  if (isOrange(g)) {
    const color = orangeColor(g);
    base = `${color}・${tabbyPattern(g)}`;
    agoutiVisible = true;

    explanation.push("O が表現されるため赤系色になります。");
    explanation.push("赤系ではタビー模様が表現されるものとして扱います。");
  } else {
    const color = eumelaninColor(g);

    if (isAgouti(g)) {
      base = `${color}・${tabbyPattern(g)}`;
      agoutiVisible = true;

      explanation.push("o のため黒色系色素が基調になります。");
      explanation.push("A_ のためタビー模様が現れます。");
    } else {
      base = color;

      explanation.push("o のため黒色系色素が基調になります。");
      explanation.push("a/a のため非アグーチ（ソリッド）です。");
    }
  }

  base = applySilver(base, g, explanation, agoutiVisible);
  base = applyPoint(base, g, explanation);

  if (hasSpotting(g)) {
    base += "＆ホワイト";
    explanation.push("S があるため白斑が加わります。");
  }

  if (isLonghair(g)) {
    explanation.push("l/l のため長毛です。");
  }

  return {
    name: `${base}${hairSuffix(g)}`,
    explanation
  };
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function makeChoices(correct, count = 4) {
  const pool = new Set([correct]);

  for (let i = 0; i < 1500 && pool.size < 40; i++) {
    pool.add(predict(randomGenome()).name);
  }

  const wrong = [...pool].filter(x => x !== correct);
  shuffle(wrong);

  const choices = [correct, ...wrong.slice(0, count - 1)];
  shuffle(choices);
  return choices;
}

function renderSequences(sequences) {
  document.getElementById("sequences").innerHTML =
    LOCUS_ORDER.map(locus => `
      <div class="sequence-row">
        <span class="sequence-symbol">${locus}</span>
        <span class="sequence-value">${sequences[locus]}</span>
      </div>
    `).join("");
}

function renderGenome(g) {
  const rows = [
    ["W", genotypeString(g.white), "優性白"],
    ["O", genotypeString(g.orange), "オレンジ"],
    ["A", genotypeString(g.agouti), "アグーチ"],
    ["B", genotypeString(g.brown), "黒 / チョコレート"],
    ["C", genotypeString(g.colorpoint), "カラーポイント"],
    ["D", genotypeString(g.dilute), "希釈"],
    ["I", genotypeString(g.inhibitor), "シルバー / スモーク"],
    ["S", genotypeString(g.spotting), "白斑"],
    ["T", genotypeString(g.tabby), "タビー模様"],
    ["L", genotypeString(g.longhair), "長毛"]
  ];

  document.getElementById("genome").innerHTML =
    rows.map(([symbol, value, label]) => `
      <div class="gene">
        <span class="gene-symbol">${symbol}</span>
        <span class="gene-value">${value}</span>
        <span class="gene-label">${label}</span>
      </div>
    `).join("");
}

function renderQuestion() {
  state.question += 1;
  state.currentGenome = randomGenome();
  state.currentPhenotype = predict(state.currentGenome);
  state.currentSequences = generateSequences(state.currentGenome);

  document.getElementById("questionNumber").textContent =
    `第 ${state.question} 問`;

  document.getElementById("sexHint").textContent =
    `性別: ${state.currentGenome.sex === "female" ? "♀ メス" : "♂ オス"}`;

  updateScore();
  renderSequences(state.currentSequences);

  const choices = makeChoices(state.currentPhenotype.name);
  const choicesEl = document.getElementById("choices");

  choicesEl.innerHTML = choices.map(choice => `
    <button class="choice" type="button" data-choice="${encodeURIComponent(choice)}">
      ${choice}
    </button>
  `).join("");

  document.getElementById("result").classList.add("hidden");
  document.getElementById("genome").innerHTML = "";
  document.getElementById("explanation").innerHTML = "";

  document.querySelectorAll(".choice").forEach(button => {
    button.addEventListener("click", () => {
      answerQuestion(decodeURIComponent(button.dataset.choice));
    });
  });
}

function answerQuestion(selected) {
  const correct = state.currentPhenotype.name;

  state.answered += 1;
  const ok = selected === correct;

  if (ok) state.score += 1;
  updateScore();

  document.querySelectorAll(".choice").forEach(button => {
    button.disabled = true;
    const value = decodeURIComponent(button.dataset.choice);

    if (value === correct) {
      button.classList.add("correct");
    } else if (value === selected) {
      button.classList.add("wrong");
    }
  });

  document.getElementById("result").classList.remove("hidden");
  document.getElementById("resultTitle").textContent =
    ok ? "○ 正解" : "× 不正解";

  document.getElementById("correctAnswer").textContent =
    ok ? `毛色: ${correct}` : `正解: ${correct}`;

  renderGenome(state.currentGenome);

  document.getElementById("explanation").innerHTML =
    state.currentPhenotype.explanation
      .map(reason => `<li>${reason}</li>`)
      .join("");
}

function updateScore() {
  document.getElementById("score").textContent =
    `SCORE ${state.score} / ${state.answered}`;
}

document.getElementById("nextButton").addEventListener("click", renderQuestion);

renderQuestion();
