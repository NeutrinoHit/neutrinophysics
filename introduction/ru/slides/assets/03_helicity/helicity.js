(() => {
  const setSpinTaggingButton = (root, icon, label) => {
    const button = root.querySelector(".tag-play-button");
    if (!button) return;
    button.querySelector(".tag-play-icon").textContent = icon;
    button.querySelector(".tag-play-label").textContent = label;
  };

  const resetSpinTagging = (root) => {
    root.classList.remove("is-playing");
    setSpinTaggingButton(root, "▶", "Запустить");
  };

  const playSpinTagging = (root) => {
    root.classList.remove("is-playing");
    void root.offsetWidth;
    root.classList.add("is-playing");
    setSpinTaggingButton(root, "↻", "Сначала");
  };

  const initializeSpinTagging = () => {
    document.querySelectorAll(".spin-tagging").forEach((root) => {
      if (root.dataset.playControlReady === "true") return;
      root.dataset.playControlReady = "true";

      root.querySelector(".tag-play-button")?.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        playSpinTagging(root);
      });

      root.addEventListener("animationend", (event) => {
        if (event.animationName === "tag-slow-excited-scene") {
          setSpinTaggingButton(root, "↻", "Повторить");
        }
      });

      resetSpinTagging(root);
    });
  };

  const setManualAnimationState = (root, state) => {
    const play = root.querySelector('[data-animation-action="play"]');
    const pause = root.querySelector('[data-animation-action="pause"]');
    if (!play || !pause) return;

    const running = state === "running";
    const paused = state === "paused";
    const complete = state === "complete";
    play.disabled = running;
    pause.disabled = !running;
    play.innerHTML = paused
      ? '<span aria-hidden="true">▶</span> Продолжить'
      : complete
        ? '<span aria-hidden="true">↻</span> Повторить'
        : '<span aria-hidden="true">▶</span> Запустить';
  };

  const resetManualAnimation = (root) => {
    root.classList.remove("is-active", "is-paused");
    root.dataset.animationStarted = "false";
    setManualAnimationState(root, "idle");
  };

  const playManualAnimation = (root) => {
    if (root.dataset.animationStarted !== "true") {
      root.classList.remove("is-active", "is-paused");
      void root.offsetWidth;
      root.classList.add("is-active");
      root.dataset.animationStarted = "true";
    } else {
      root.classList.remove("is-paused");
    }
    setManualAnimationState(root, "running");
  };

  const pauseManualAnimation = (root) => {
    if (!root.classList.contains("is-active")) return;
    root.classList.add("is-paused");
    setManualAnimationState(root, "paused");
  };

  const initializeManualAnimations = () => {
    document.querySelectorAll("[data-manual-animation]").forEach((root) => {
      if (root.dataset.manualControlReady === "true") return;
      root.dataset.manualControlReady = "true";

      root.querySelector('[data-animation-action="play"]')?.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        playManualAnimation(root);
      });

      root.querySelector('[data-animation-action="pause"]')?.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        pauseManualAnimation(root);
      });

      root.addEventListener("animationend", (event) => {
        const endAnimation = root.dataset.animationEnd || "analyzer-count-minus";
        if (event.animationName !== endAnimation) return;
        root.dataset.animationStarted = "complete";
        setManualAnimationState(root, "complete");
      });

      resetManualAnimation(root);
    });
  };

  const experimentScenes = Object.freeze([
    { className: "scene-assembly", title: "Сборка детектора", endAnimation: "experiment-assembly-finish" },
    { className: "scene-one", title: "Резонансный фотон", endAnimation: "experiment-scene-one-finish" },
    { className: "scene-two", title: "Нерезонансный фотон", endAnimation: "experiment-scene-two-finish" },
    { className: "scene-field-plus", title: "Измерение при +B", endAnimation: "experiment-scene-field-plus-finish" },
    { className: "scene-field-minus", title: "Измерение при −B", endAnimation: "experiment-scene-field-minus-finish" }
  ]);

  const setExperimentSceneButton = (root, icon, label, disabled = false) => {
    const button = root.querySelector("[data-experiment-scene-next]");
    if (!button) return;
    button.disabled = disabled;
    button.querySelector("[data-experiment-scene-icon]").textContent = icon;
    button.querySelector("[data-experiment-scene-button-label]").textContent = label;
  };

  const updateExperimentSceneDots = (root, step, running) => {
    root.querySelectorAll(".experiment-scene-dot").forEach((dot, index) => {
      const sceneNumber = index + 1;
      dot.classList.toggle("is-complete", sceneNumber < step || (!running && sceneNumber === step));
      dot.classList.toggle("is-current", running ? sceneNumber === step : sceneNumber === Math.min(step + 1, experimentScenes.length));
    });
  };

  const resetExperimentScenes = (root) => {
    experimentScenes.forEach((scene) => root.classList.remove(scene.className));
    root.classList.remove("is-scene-running");
    root.dataset.experimentScene = "0";
    root.dataset.experimentSceneRunning = "false";
    root.querySelector("[data-experiment-scene-label]").textContent = `Сцена 1/${experimentScenes.length} · Сборка детектора`;
    setExperimentSceneButton(root, "▶", "Запустить");
    updateExperimentSceneDots(root, 0, false);
  };

  const startNextExperimentScene = (root) => {
    if (root.dataset.experimentSceneRunning === "true") return;

    const previousStep = Number(root.dataset.experimentScene || "0");
    if (previousStep >= experimentScenes.length) {
      resetExperimentScenes(root);
      void root.offsetWidth;
    }

    const step = Number(root.dataset.experimentScene || "0") + 1;
    const scene = experimentScenes[step - 1];
    root.dataset.experimentScene = String(step);
    root.dataset.experimentSceneRunning = "true";
    root.classList.add("is-scene-running");
    root.querySelector("[data-experiment-scene-label]").textContent = `Сцена ${step}/${experimentScenes.length} · ${scene.title}`;
    setExperimentSceneButton(root, "●", "Выполняется…", true);
    updateExperimentSceneDots(root, step, true);
    void root.offsetWidth;
    root.classList.add(scene.className);
  };

  const completeExperimentScene = (root, step) => {
    if (Number(root.dataset.experimentScene || "0") !== step) return;
    root.dataset.experimentSceneRunning = "false";
    root.classList.remove("is-scene-running");
    updateExperimentSceneDots(root, step, false);

    if (step < experimentScenes.length) {
      const nextScene = experimentScenes[step];
      if (step === 3) {
        root.querySelector("[data-experiment-scene-label]").textContent = "Далее: измерение поляризации";
        setExperimentSceneButton(root, "▶", "Измерить поляризацию");
      } else {
        root.querySelector("[data-experiment-scene-label]").textContent = `Далее: сцена ${step + 1}/${experimentScenes.length} · ${nextScene.title}`;
        setExperimentSceneButton(root, "▶", "Следующая сцена");
      }
    } else {
      root.querySelector("[data-experiment-scene-label]").textContent = "Резонанс и измерение показаны";
      setExperimentSceneButton(root, "↻", "Сначала");
    }
  };

  const initializeExperimentScenes = () => {
    document.querySelectorAll("[data-experiment-scenes]").forEach((root) => {
      if (root.dataset.experimentScenesReady === "true") return;
      root.dataset.experimentScenesReady = "true";

      root.querySelector("[data-experiment-scene-next]")?.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        startNextExperimentScene(root);
      });

      root.addEventListener("animationend", (event) => {
        const step = Number(root.dataset.experimentScene || "0");
        if (!step || event.animationName !== experimentScenes[step - 1].endAnimation) return;
        completeExperimentScene(root, step);
      });

      resetExperimentScenes(root);
    });
  };

  // The interactive uses the same working formulas and numerical values as the
  // slide. Energies are in MeV; detuning and the displayed line width are in eV.
  const resonanceParameters = Object.freeze({
    qValueMeV: 0.96,
    levelEnergyMeV: 0.96,
    massMeV: 1.42e5,
    lineHalfWidthEv: 0.10,
    scaleHalfRangeEv: 14
  });

  const resonanceKinematics = (() => {
    const { qValueMeV: q, levelEnergyMeV: deltaE, massMeV: mass } = resonanceParameters;
    // Natural units: Q = E_nu + E_nu^2/(2M), written to avoid cancellation.
    const neutrinoEnergyMeV = 2 * q / (1 + Math.sqrt(1 + 2 * q / mass));
    const beta = neutrinoEnergyMeV / mass;
    // Exact two-body emission energy for M + DeltaE -> M + gamma.
    const emissionEnergyMeV = deltaE * (2 * mass + deltaE) / (2 * (mass + deltaE));
    // Exact threshold energy for gamma + B(rest) -> B* in the same level model.
    const absorptionEnergyMeV = deltaE + deltaE ** 2 / (2 * mass);
    return { neutrinoEnergyMeV, beta, emissionEnergyMeV, absorptionEnergyMeV };
  })();

  const cancelResonanceFlight = (root) => {
    window.clearTimeout(root._resonanceLaunchTimer);
    root._resonanceLaunchTimer = null;
    root._resonancePhotonAnimation?.cancel();
    root._resonanceFlashAnimation?.cancel();
    root._resonancePhotonAnimation = null;
    root._resonanceFlashAnimation = null;
    root.classList.remove("has-absorbed", "source-decayed", "absorber-excited");

    const photon = root.querySelector("[data-resonance-photon]");
    if (photon) {
      photon.style.opacity = "0";
      photon.style.transform = "none";
    }

    const button = root.querySelector("[data-resonance-fire]");
    if (button) {
      button.disabled = false;
      button.innerHTML = '<span aria-hidden="true">▶</span> Испустить фотон';
    }
  };

  const resonanceState = (detuningEv) => {
    if (Math.abs(detuningEv) <= resonanceParameters.lineHalfWidthEv) return "resonant";
    return detuningEv < 0 ? "low" : "high";
  };

  const setDynamicMath = (element, markup) => {
    if (!element) return;

    const mathJax = window.MathJax;
    try {
      mathJax?.typesetClear?.([element]);
    } catch (_) {}

    element.innerHTML = markup;

    try {
      if (mathJax?.typesetPromise) {
        mathJax.typesetPromise([element]).catch(() => {});
      } else {
        mathJax?.typeset?.([element]);
      }
    } catch (_) {}
  };

  const updateResonanceExplorer = (root) => {
    const slider = root.querySelector("[data-resonance-slider]");
    if (!slider) return;

    cancelResonanceFlight(root);

    const angle = Number(slider.value);
    const angleRadians = angle * Math.PI / 180;
    const photonEnergyMeV = resonanceKinematics.emissionEnergyMeV
      * (1 + resonanceKinematics.beta * Math.cos(angleRadians));
    const detuningEv = (photonEnergyMeV - resonanceKinematics.absorptionEnergyMeV) * 1e6;
    const state = resonanceState(detuningEv);
    const scaleHalfRange = resonanceParameters.scaleHalfRangeEv;
    const energyPosition = Math.max(0, Math.min(100,
      50 + 50 * detuningEv / scaleHalfRange
    ));
    const windowWidth = 100 * resonanceParameters.lineHalfWidthEv / scaleHalfRange;

    root.classList.remove("is-low", "is-resonant", "is-high");
    root.classList.add(`is-${state}`);
    root.style.setProperty("--res-energy-position", `${energyPosition}%`);
    root.style.setProperty("--res-window-width", `${windowWidth}%`);
    root.style.setProperty("--res-angle", `${angle}deg`);
    root.dataset.resonanceDetuningEv = detuningEv.toString();

    const angleOutput = root.querySelector("[data-resonance-angle]");
    const energyOutput = root.querySelector("[data-resonance-energy-text]");
    const outcome = root.querySelector("[data-resonance-outcome]");

    setDynamicMath(
      angleOutput,
      angle === 0
        ? String.raw`\(\theta=0^\circ\) — фотон летит вдоль отдачи`
        : angle === 180
          ? String.raw`\(\theta=180^\circ\) — фотон летит против отдачи`
          : String.raw`\(\theta=${angle}^\circ\)`
    );

    const signedDetuning = `${detuningEv >= 0 ? "+" : "-"}${Math.abs(detuningEv).toFixed(3).replace(".", "{,}")}`;
    setDynamicMath(
      energyOutput,
      String.raw`\(E_\gamma-E_\gamma^{\rm abs}=${signedDetuning}\,\mathrm{эВ}\)`
    );

    if (state === "resonant") {
      setDynamicMath(outcome, String.raw`Резонанс: \(\lvert E_\gamma-E_\gamma^{\rm abs}\rvert\le 0{,}10\,\mathrm{эВ}\).`);
    } else if (state === "high") {
      setDynamicMath(outcome, "Выше резонанса: фотон проходит сквозь поглотитель.");
    } else {
      setDynamicMath(outcome, "Ниже резонанса: фотон проходит сквозь поглотитель.");
    }
  };

  const fireResonancePhoton = (root) => {
    const stage = root.querySelector("[data-resonance-stage]");
    const photon = root.querySelector("[data-resonance-photon]");
    const absorber = root.querySelector("[data-resonance-absorber]");
    const button = root.querySelector("[data-resonance-fire]");
    const outcome = root.querySelector("[data-resonance-outcome]");
    if (!stage || !photon || !absorber || !button) return;

    cancelResonanceFlight(root);

    const resonant = root.classList.contains("is-resonant");
    // offsetLeft/offsetWidth are measured in the slide's own coordinate system.
    // getBoundingClientRect() is already scaled by Reveal and therefore yields a
    // translation that is too short when used as a CSS transform on the slide.
    const photonCenter = photon.offsetLeft + photon.offsetWidth / 2;
    const absorberCenter = absorber.offsetLeft + absorber.offsetWidth / 2;
    const hitDistance = absorberCenter - photonCenter;
    const exitDistance = -(photon.offsetLeft + photon.offsetWidth + 90);

    button.disabled = true;
    button.textContent = "Подготовка…";
    setDynamicMath(outcome, "Исходные состояния восстановлены.");

    root._resonanceLaunchTimer = window.setTimeout(() => {
      root._resonanceLaunchTimer = null;
      root.classList.add("source-decayed");
      button.textContent = "Опыт идёт…";
      setDynamicMath(outcome, String.raw`Источник испустил фотон: \(B^*\) превратилось в \(B\). Фотон летит к покоящемуся поглотителю.`);

      const distance = resonant ? hitDistance : exitDistance;
      root._resonancePhotonAnimation = photon.animate(
        [
          { transform: "translateX(0)", opacity: 0, offset: 0 },
          { transform: "translateX(0)", opacity: 1, offset: 0.08 },
          { transform: `translateX(${distance}px)`, opacity: 1, offset: resonant ? 0.86 : 0.93 },
          { transform: `translateX(${distance}px)`, opacity: 0, offset: 1 }
        ],
        { duration: 2300, easing: "linear", fill: "forwards" }
      );

      root._resonancePhotonAnimation.finished.then(() => {
        if (resonant) {
          root.classList.add("has-absorbed", "absorber-excited");
          const flash = root.querySelector(".resonance-absorption-flash");
          root._resonanceFlashAnimation = flash?.animate(
            [
              { opacity: 0, boxShadow: "0 0 0 0 rgba(117, 221, 184, 0.8)" },
              { opacity: 1, boxShadow: "0 0 0 15px rgba(117, 221, 184, 0.55)", offset: 0.25 },
              { opacity: 0, boxShadow: "0 0 0 85px rgba(117, 221, 184, 0)" }
            ],
            { duration: 900, easing: "ease-out", fill: "forwards" }
          );
          setDynamicMath(outcome, String.raw`Резонанс: \(B+\gamma\to B^*\).`);
        } else {
          setDynamicMath(outcome, "Вне резонанса: фотон проходит сквозь поглотитель и уходит за экран.");
        }

        button.disabled = false;
        button.innerHTML = '<span aria-hidden="true">↻</span> Повторить опыт';
      }).catch(() => {});
    }, 420);
  };

  const resetResonanceExplorer = (root) => {
    const slider = root.querySelector("[data-resonance-slider]");
    if (slider) slider.value = "90";
    updateResonanceExplorer(root);
  };

  const initializeResonanceExplorers = () => {
    document.querySelectorAll("[data-resonance-explorer]").forEach((root) => {
      if (root.dataset.resonanceReady === "true") return;
      root.dataset.resonanceReady = "true";

      const slider = root.querySelector("[data-resonance-slider]");
      slider?.addEventListener("input", (event) => {
        event.stopPropagation();
        updateResonanceExplorer(root);
      });
      slider?.addEventListener("keydown", (event) => event.stopPropagation());

      root.querySelector("[data-resonance-fire]")?.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        fireResonancePhoton(root);
      });

      resetResonanceExplorer(root);
    });
  };

  const restartAnimations = (slide) => {
    document.querySelectorAll(".helicity-animated.is-active").forEach((element) => {
      element.classList.remove("is-active");
    });

    slide?.querySelectorAll(".helicity-animated:not([data-manual-animation])").forEach((element) => {
      void element.offsetWidth;
      element.classList.add("is-active");
    });

    document.querySelectorAll(".spin-tagging").forEach(resetSpinTagging);
    document.querySelectorAll("[data-manual-animation]").forEach(resetManualAnimation);
    document.querySelectorAll("[data-experiment-scenes]").forEach(resetExperimentScenes);
    document.querySelectorAll("[data-resonance-explorer]").forEach(resetResonanceExplorer);
  };

  const initialize = () => {
    initializeSpinTagging();
    initializeManualAnimations();
    initializeExperimentScenes();
    initializeResonanceExplorers();
    if (window.Reveal) {
      Reveal.on("ready", (event) => restartAnimations(event.currentSlide));
      Reveal.on("slidechanged", (event) => restartAnimations(event.currentSlide));
      restartAnimations(Reveal.getCurrentSlide());
    } else {
      restartAnimations(document);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
