(() => {
  const restartSlideAnimations = (slide) => {
    document.querySelectorAll(".parity-demo.is-active, .wu-apparatus.is-active, .alien-hand-demo.is-active, .demag-animation.is-active").forEach((element) => {
      element.classList.remove("is-active");
    });

    slide?.querySelectorAll(".parity-demo, .wu-apparatus, .alien-hand-demo, .demag-animation").forEach((element) => {
      void element.offsetWidth;
      element.classList.add("is-active");
    });
  };

  const initialize = () => {
    if (!window.Reveal) return;
    Reveal.on("ready", (event) => restartSlideAnimations(event.currentSlide));
    Reveal.on("slidechanged", (event) => restartSlideAnimations(event.currentSlide));
    restartSlideAnimations(Reveal.getCurrentSlide());
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
