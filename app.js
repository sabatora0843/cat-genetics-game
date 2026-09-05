const state = {
  question: 0,
  score: 0,
  answered: 0,
  currentGenome: null,
  currentPhenotype: null
};

const LOCUS_ORDER = ["W", "O", "A", "B", "C", "D", "I", "S", "T", "L"];

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

    // 内部では実際の2アレルを保持。
    // 表示時は phenotype-equivalent shorthand（W-, ww 等）に変換する。
    W: weightedChoice([
      { value: ["w", "w"], weight: 9 },
      { value: ["W", "w"], weight: 1 }
    ]),

    O: sex === "female"
      ? randomChoice([["O", "O"], ["O", "o"], ["o", "o"]])
      : randomChoice([["O", "Y"], ["o", "Y"]]),

    A: randomChoice([["A", "A"], ["A", "a"], ["a", "a"]]),

    B: randomChoice([["B", "B"], ["B", "b"], ["b", "b"]]),

    C: weightedChoice([
      { value: ["C", "C"], weight: 6 },
      { value: ["C", "cs"], weight: 2 },
      { value: ["cs", "cs"], weight: 1.5 },
      { value: ["cb", "cs"], weight: 0.5 }
    ]),

    D: randomChoice([["D", "D"], ["D", "d"], ["d", "d"]]),

    I: weightedChoice([
      { value: ["i", "i"], weight: 7 },
      { value: ["I", "i"], weight: 2.5 },
      { value: ["I", "I"], weight: 0.5 }
    ]),

    S: weightedChoice([
      { value: ["s", "s"], weight: 6 },
      { value: ["S", "s"], weight: 3 },
      { value: ["S", "S"], weight: 1 }
    ]),

    T: randomChoice([["Mc", "Mc"], ["Mc", "mc"], ["mc", "mc"]]),

    L: weightedChoice([
      { value: ["L", "L"], weight: 4 },
      { value: ["L", "l"], weight: 4 },
      { value: ["l", "l"], weight: 2 }
    ])
  };
}

function has(pair, allele) {
  return pair.includes(allele);
}

function homo(pair, allele) {
  return pair[0] === allele && pair[1] === allele;
}

function dominantShorthand(pair, dominant, recessive) {
  return has(pair, dominant) ? `${dominant}-` : `${recessive}${recessive}`;
}

function shorthandForLocus(locus, g) {
  const pair = g[locus];

  switch (locus) {
    case "W":
      return dominantShorthand(pair, "W", "w");

    case "O":
      // OはX染色体上だが、ゲーム表示では性別を別途示す。
      if (g.sex === "male") {
        return has(pair, "O") ? "O-" : "oo";
      }
      if (homo(pair, "O")) return "OO";
      if (homo(pair, "o")) return "oo";
      return "Oo";

    case "A":
      return dominantShorthand(pair, "A", "a");

    case "B":
      return dominantShorthand(pair, "B", "b");

    case "C": {
      // C は多対立遺伝子のため、意味を失わない範囲で表記。
      if (has(pair, "C")) return "C-";
      if (homo(pair, "cs")) return "cscs";
      return "cbcs";
    }

    case "D":
      return dominantShorthand(pair, "D", "d");

    case "I":
      return dominantShorthand(pair, "I", "i");

    case "S":
      return dominantShorthand(pair, "S", "s");

    case "T":
      return has(pair, "Mc") ? "Mc-" : "mcmc";

    case "L":
      return dominantShorthand(pair, "L", "l");

    default:
      return pair.join("");
  }
}

function genotypeSummary(g) {
  return LOCUS_ORDER.map(locus => shorthandForLocus(locus, g)).join(" ");
}

function hasDominantWhite(g) {
  return has(g.W, "W");
}

function isDilute(g) {
  return homo(g.D, "d");
}

function hasInhibitor(g) {
  return has(g.I, "I");
}

function hasSpotting(g) {
  return has(g.S, "S");
}

function isLonghair(g) {
  return homo(g.L, "l");
}

function isAgouti(g) {
  return has(g.A, "A");
}

function isChocolate(g) {
  return homo(g.B, "b");
}

function isTortoiseshell(g) {
  return g.sex === "female" && has(g.O, "O") && has(g.O, "o");
}

function isOrange(g) {
  return has(g.O, "O");
}

function colorpointType(g) {
  if (has(g.C, "C")) return null;
  if (homo(g.C, "cs")) return "ポイント";
  return "ミンク";
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
  return homo(g.T, "mc")
    ? "クラシックタビー"
    : "マッカレルタビー";
}

function hairSuffix(g) {
  return isLonghair(g) ? "・ロングヘア" : "";
}

function applyPoint(base, g, explanation) {
  const type = colorpointType(g);
  if (!type) return base;

  if (type === "ポイント") {
    explanation.push("C座が cscs のためポイントカラーとして扱います。");
  } else {
    explanation.push("C座が cbcs のためミンク系として扱います。");
  }

  return `${base}・${type}`;
}

function applySilver(base, g, explanation, agoutiVisible) {
  if (!hasInhibitor(g)) return base;

  if (agoutiVisible) {
    explanation.push("I- のためタビー系ではシルバーとして扱います。");
    return `${base}・シルバー`;
  }

  explanation.push("I- のためソリッド系ではスモークとして扱います。");
  return `${base}・スモーク`;
}

function predict(g) {
  const explanation = [];

  if (hasDominantWhite(g)) {
    explanation.push("W- のため優性白となり、他の毛色遺伝子の表現を覆います。");

    if (isLonghair(g)) {
      explanation.push("ll のため長毛です。");
    }

    return {
      name: `ホワイト${hairSuffix(g)}`,
      explanation
    };
  }

  explanation.push(
    isDilute(g)
      ? "dd のため色が希釈されます。"
      : "D- のため非希釈色です。"
  );

  let base = "";
  let agoutiVisible = false;

  if (isTortoiseshell(g)) {
    const dark = eumelaninColor(g);
    const red = orangeColor(g);

    explanation.push("メスで Oo のため、黒系と赤系がモザイク状に現れます。");

    if (isAgouti(g)) {
      base = `${dark}タビー＆${red}（トービー）`;
      agoutiVisible = true;
      explanation.push("A- のため黒系部分にタビー模様が現れます。");
    } else {
      base = `${dark}＆${red}（トーティ）`;
      explanation.push("aa のため黒系部分は基本的にソリッドです。");
    }

    base = applySilver(base, g, explanation, agoutiVisible);
    base = applyPoint(base, g, explanation);

    if (hasSpotting(g)) {
      explanation.push("S- のため白斑が加わります。");

      const commonName = isDilute(g)
        ? "ダイリュート・キャリコ"
        : "三毛（キャリコ）";

      if (isLonghair(g)) {
        explanation.push("ll のため長毛です。");
      }

      return {
        name: `${commonName} [${base}＆ホワイト]${hairSuffix(g)}`,
        explanation
      };
    }

    if (isLonghair(g)) {
      explanation.push("ll のため長毛です。");
    }

    return {
      name: `${base}${hairSuffix(g)}`,
      explanation
    };
  }

  if (isOrange(g)) {
    base = `${orangeColor(g)}・${tabbyPattern(g)}`;
    agoutiVisible = true;

    explanation.push("O が表現されるため赤系色になります。");
    explanation.push("赤系ではタビー模様が表現されるものとして扱います。");
  } else {
    const color = eumelaninColor(g);

    if (isAgouti(g)) {
      base = `${color}・${tabbyPattern(g)}`;
      agoutiVisible = true;

      explanation.push("oo のため黒色系色素が基調になります。");
      explanation.push("A- のためタビー模様が現れます。");
    } else {
      base = color;

      explanation.push("oo のため黒色系色素が基調になります。");
      explanation.push("aa のため非アグーチ（ソリッド）です。");
    }
  }

  base = applySilver(base, g, explanation, agoutiVisible);
  base = applyPoint(base, g, explanation);

  if (hasSpotting(g)) {
    base += "＆ホワイト";
    explanation.push("S- のため白斑が加わります。");
  }

  if (isLonghair(g)) {
    explanation.push("ll のため長毛です。");
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

function renderGenome(g) {
  const labels = {
    W: "優性白",
    O: "オレンジ",
    A: "アグーチ",
    B: "黒 / チョコレート",
    C: "カラーポイント",
    D: "希釈",
    I: "シルバー / スモーク",
    S: "白斑",
    T: "タビー模様",
    L: "長毛"
  };

  document.getElementById("genotypeSummary").textContent = genotypeSummary(g);

  document.getElementById("genome").innerHTML =
    LOCUS_ORDER.map(locus => `
      <div class="gene">
        <span class="gene-symbol">${locus}</span>
        <span class="gene-value">${shorthandForLocus(locus, g)}</span>
        <span class="gene-label">${labels[locus]}</span>
      </div>
    `).join("");
}

function renderQuestion() {
  state.question += 1;
  state.currentGenome = randomGenome();
  state.currentPhenotype = predict(state.currentGenome);

  document.getElementById("questionNumber").textContent =
    `第 ${state.question} 問`;

  document.getElementById("sexHint").textContent =
    `性別: ${state.currentGenome.sex === "female" ? "♀ メス" : "♂ オス"}`;

  updateScore();
  renderGenome(state.currentGenome);

  const choices = makeChoices(state.currentPhenotype.name);

  document.getElementById("choices").innerHTML =
    choices.map(choice => `
      <button class="choice" type="button" data-choice="${encodeURIComponent(choice)}">
        ${choice}
      </button>
    `).join("");

  document.getElementById("result").classList.add("hidden");
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

  if (ok) {
    state.score += 1;
  }

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
