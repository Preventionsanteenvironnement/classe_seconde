(function () {
  const root = document.getElementById("app");
  const config = window.MATIERE_CONFIG;

  if (!root || !config || !Array.isArray(config.exercises)) {
    return;
  }

  const title = document.getElementById("matiere-title");
  const level = document.getElementById("level-badge");
  const intro = document.getElementById("matiere-intro");

  title.textContent = config.title;
  level.textContent = config.level || "Seconde Générale";
  intro.textContent = config.intro || "Exercices interactifs.";

  root.innerHTML = config.exercises
    .map((ex, i) => {
      const idx = i + 1;
      if (ex.type === "qcm") {
        const choices = ex.choices
          .map(
            (c, j) =>
              `<label class="option"><input type="radio" name="q${idx}" value="${j}" /> <span>${c}</span></label>`
          )
          .join("");
        return `<article class="exercise" data-index="${i}" data-type="qcm"><h2>Exercice ${idx}</h2><p>${ex.question}</p><div class="options">${choices}</div><p class="feedback" id="fb-${idx}"></p></article>`;
      }

      return `<article class="exercise" data-index="${i}" data-type="text"><h2>Exercice ${idx}</h2><p>${ex.question}</p><input type="text" id="txt-${idx}" placeholder="Ta réponse ici" /><p class="feedback" id="fb-${idx}"></p></article>`;
    })
    .join("");

  const btnCheck = document.getElementById("btn-check");
  const btnReset = document.getElementById("btn-reset");
  const score = document.getElementById("score");

  function normalize(str) {
    return (str || "")
      .toString()
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function check() {
    let total = config.exercises.length;
    let okCount = 0;

    config.exercises.forEach((ex, i) => {
      const idx = i + 1;
      const fb = document.getElementById(`fb-${idx}`);
      let good = false;

      if (ex.type === "qcm") {
        const selected = document.querySelector(`input[name="q${idx}"]:checked`);
        good = selected && Number(selected.value) === Number(ex.answer);
      } else {
        const value = normalize(document.getElementById(`txt-${idx}`).value);
        good = (ex.accepted || []).some((a) => value.includes(normalize(a)));
      }

      if (good) {
        okCount += 1;
        fb.textContent = "Correct";
        fb.className = "feedback ok";
      } else {
        fb.textContent = `A revoir - ${ex.hint || "relis la consigne"}`;
        fb.className = "feedback bad";
      }
    });

    score.textContent = `Score: ${okCount} / ${total}`;
  }

  function resetAll() {
    config.exercises.forEach((ex, i) => {
      const idx = i + 1;
      const fb = document.getElementById(`fb-${idx}`);
      fb.textContent = "";
      fb.className = "feedback";

      if (ex.type === "qcm") {
        document.querySelectorAll(`input[name="q${idx}"]`).forEach((el) => {
          el.checked = false;
        });
      } else {
        document.getElementById(`txt-${idx}`).value = "";
      }
    });

    score.textContent = "";
  }

  btnCheck.addEventListener("click", check);
  btnReset.addEventListener("click", resetAll);
})();
