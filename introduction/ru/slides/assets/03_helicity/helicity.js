(() => {
  const restartAnimations = (slide) => {
    document.querySelectorAll(".helicity-animated.is-active").forEach((element) => {
      element.classList.remove("is-active");
    });

    slide?.querySelectorAll(".helicity-animated").forEach((element) => {
      void element.offsetWidth;
      element.classList.add("is-active");
    });
  };

  const initialize = () => {
    if (!window.Reveal) return;
    Reveal.on("ready", (event) => restartAnimations(event.currentSlide));
    Reveal.on("slidechanged", (event) => restartAnimations(event.currentSlide));
    restartAnimations(Reveal.getCurrentSlide());
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
