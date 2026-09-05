const state = {
  question: 0,
  score: 0,
  answered: 0,
  currentGenome: null,
  currentPhenotype: null
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
    orange: sex === "female"
      ? randomChoice(["OO", "Oo", "oo"])
      : randomChoice(["OY", "oY"]),
    brown: randomChoice(["BB", "Bb", "bb"]),
    dilute: randomChoice(["DD", "Dd", "dd"]),
    agouti: randomChoice(["AA", "Aa", "aa"]),
    white: weightedChoice([
      { value: "NN", weight: 8 },
      { value: "NW", weight: 1.5 },
      { value: "WW", weight: 0.5 }
    ]),
    spotting: weightedChoice([
      { value: "ss", weight: 5 },
      { value: "Ss", weight: 3 },
      { value: "SS", weight: 1 }
    ]),
    tabby: randomChoice(["McMc", "Mcmc", "mcmc"])
  };
}

function isDilute(g) {
  return g.dilute === "dd";
}

function hasOrange(g) {
  return ["OO", "Oo", "OY"].includes(g.orange);
}

function isTortoiseshell(g) {
  return g.sex === "female" && g.orange === "Oo";
}

function eumelaninColor(g) {
  let color = g.brown === "bb" ? "チョコレート" : "ブラック";

  if (isDilute(g)) {
    color = color === "チョコレート" ? "ライラック" : "ブルー";
  }

  return color;
}

function orangeColor(g) {
  return isDilute(g) ? "クリーム" : "レッド";
}

function tabbyPattern(g) {
  return g.tabby === "mcmc" ? "クラシックタビー" : "マッカレルタビー";
}

function predict(g) {
  const explanation = [];

  if (g.white.includes("W")) {
    explanation.push("W（優性白）があるため、他の毛色遺伝子の表現を覆います。");
    return { name: "ホワイト", explanation };
  }

  if (isDilute(g)) {
    explanation.push("d/d のため色が希釈されます。");
  } else {
    explanation.push("D が少なくとも1つあるため非希釈色です。");
  }

  if (isTortoiseshell(g)) {
    const dark = eumelaninColor(g);
    const red = orangeColor(g);
    let base;

    if (g.agouti !== "aa") {
      base = `${dark}タビー＆${red}（トービー）`;
      explanation.push("雌の O/o により、黒系と赤系がモザイク状に現れます。");
      explanation.push("A_ のため黒系部分にタビー模様が現れます。");
    } else {
      base = `${dark}＆${red}（トーティ）`;
      explanation.push("雌の O/o により、黒系と赤系がモザイク状に現れます。");
      explanation.push("a/a のため黒系部分は基本的にソリッドです。");
    }

    if (g.spotting !== "ss") {
      base += "＆ホワイト";
      explanation.push("S があるため白斑が加わります。");

      if (!isDilute(g)) {
        return {
          name: `三毛（キャリコ） [${base}]`,
          explanation
        };
      }

      return {
        name: `ダイリュート・キャリコ [${base}]`,
        explanation
      };
    }

    return { name: base, explanation };
  }

  let base;

  if (hasOrange(g)) {
    const color = orangeColor(g);
    const pattern = tabbyPattern(g);
    base = `${color}・${pattern}`;
    explanation.push("O が表現されるため赤系色になります。");
    explanation.push("赤系ではタビー模様が表現されるものとして扱います。");
  } else {
    const color = eumelaninColor(g);

    if (g.agouti === "aa") {
      base = color;
      explanation.push("o のため黒色系色素が基調になります。");
      explanation.push("a/a のため非アグーチ（ソリッド）です。");
    } else {
      const pattern = tabbyPattern(g);
      base = `${color}・${pattern}`;
      explanation.push("o のため黒色系色素が基調になります。");
      explanation.push("A_ のためタビー模様が現れます。");
    }
  }

  if (g.spotting !== "ss") {
    base += "＆ホワイト";
    explanation.push("S があるため白斑が加わります。");
  }

  return { name: base, explanation };
}

function makeChoices(correct, count = 4) {
  const pool = new Set([correct]);

  for (let i = 0; i < 400 && pool.size < 16; i++) {
    pool.add(predict(randomGenome()).name);
  }

  const wrong = [...pool].filter(x => x !== correct);
  shuffle(wrong);

  const choices = [correct, ...wrong.slice(0, count - 1)];
  shuffle(choices);
  return choices;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function renderGenome(g) {
  const rows = [
    ["性別", g.sex === "female" ? "♀ メス" : "♂ オス"],
    ["O座", `${g.orange} — オレンジ`],
    ["B座", `${g.brown} — 黒 / チョコレート`],
    ["D座", `${g.dilute} — 希釈`],
    ["A座", `${g.agouti} — アグーチ`],
    ["W座", `${g.white} — 優性白`],
    ["S座", `${g.spotting} — 白斑`],
    ["Mc座", `${g.tabby} — タビー模様`]
  ];

  const genome = document.getElementById("genome");
  genome.innerHTML = rows.map(([label, value]) => `
    <div class="gene">
      <span class="label">${label}</span>
      <span class="value">${value}</span>
    </div>
  `).join("");
}

function renderQuestion() {
  state.question += 1;
  state.currentGenome = randomGenome();
  state.currentPhenotype = predict(state.currentGenome);

  document.getElementById("questionNumber").textContent = `第 ${state.question} 問`;
  updateScore();

  renderGenome(state.currentGenome);

  const choices = makeChoices(state.currentPhenotype.name);
  const choicesEl = document.getElementById("choices");

  choicesEl.innerHTML = choices.map(choice => `
    <button class="choice" type="button" data-choice="${encodeURIComponent(choice)}">
      ${choice}
    </button>
  `).join("");

  document.getElementById("result").classList.add("hidden");

  document.querySelectorAll(".choice").forEach(button => {
    button.addEventListener("click", () => {
      const selected = decodeURIComponent(button.dataset.choice);
      answerQuestion(selected);
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

  const result = document.getElementById("result");
  result.classList.remove("hidden");

  document.getElementById("resultTitle").textContent = ok ? "○ 正解" : "× 不正解";
  document.getElementById("correctAnswer").textContent = ok
    ? `毛色: ${correct}`
    : `正解: ${correct}`;

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
