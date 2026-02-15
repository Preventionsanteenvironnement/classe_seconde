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
  initLinksManager(config);

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

  function slugify(value) {
    return (value || "matiere")
      .toString()
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function initLinksManager(conf) {
    const mount = document.getElementById("quick-links");
    if (!mount) return;

    const key = `classe_seconde_links_${slugify(conf.storageKey || conf.title)}`;
    const slots = conf.linkSlots || [
      { id: "cours", label: "📘 Cours" },
      { id: "exo1", label: "📝 Exercice 1" },
      { id: "exo2", label: "📝 Exercice 2" },
      { id: "corrige", label: "✅ Corrige" },
    ];

    const fallback = slots.map((s) => ({ ...s, href: "" }));
    let saved = fallback;

    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          saved = slots.map((s) => {
            const found = parsed.find((x) => x && x.id === s.id);
            return { ...s, href: found && found.href ? String(found.href) : "" };
          });
        }
      }
    } catch (_) {
      saved = fallback;
    }

    mount.innerHTML = `
      <section class="links-manager">
        <h2>Liens HTML rapides</h2>
        <p>Colle tes liens de fichiers HTML ici, puis clique "Enregistrer".</p>
        <div class="link-grid">
          ${saved
            .map(
              (item) => `
            <div class="link-item">
              <label for="link-${item.id}">${item.label}</label>
              <input id="link-${item.id}" type="text" value="${item.href.replace(/"/g, "&quot;")}" placeholder="ex: devoirs/mon_exercice.html" />
            </div>
          `
            )
            .join("")}
        </div>
        <div class="link-actions">
          <button id="btn-save-links" type="button">Enregistrer les liens</button>
          <button id="btn-reset-links" type="button">Reinitialiser</button>
        </div>
        <div id="links-list" class="links-list"></div>
        <div id="links-status" class="links-status"></div>
      </section>
    `;

    function readCurrentValues() {
      return slots.map((slot) => {
        const el = document.getElementById(`link-${slot.id}`);
        return { ...slot, href: (el && el.value ? el.value : "").trim() };
      });
    }

    function saveValues(values) {
      localStorage.setItem(key, JSON.stringify(values));
    }

    function renderLinks(values) {
      const list = document.getElementById("links-list");
      const status = document.getElementById("links-status");
      const usable = values.filter((v) => v.href);

      if (!usable.length) {
        list.innerHTML = "";
        status.textContent = "Aucun lien enregistre pour le moment.";
        return;
      }

      list.innerHTML = usable
        .map((v) => `<a href="${v.href}">${v.label}</a>`)
        .join("");
      status.textContent = `${usable.length} lien(s) pret(s).`;
    }

    renderLinks(saved);

    const saveBtn = document.getElementById("btn-save-links");
    const resetBtn = document.getElementById("btn-reset-links");

    saveBtn.addEventListener("click", () => {
      const values = readCurrentValues();
      saveValues(values);
      renderLinks(values);
      const status = document.getElementById("links-status");
      status.textContent = "Liens enregistres.";
    });

    resetBtn.addEventListener("click", () => {
      localStorage.removeItem(key);
      slots.forEach((slot) => {
        const el = document.getElementById(`link-${slot.id}`);
        if (el) el.value = "";
      });
      renderLinks(fallback);
      const status = document.getElementById("links-status");
      status.textContent = "Liens reinitialises.";
    });
  }
})();
