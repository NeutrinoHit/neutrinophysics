// Seeking in slide videos on servers without HTTP range requests.
//
// A browser can jump inside an MP4 only if the server answers byte-range requests (206 Partial Content).
// GitHub Pages does; the local `quarto preview` server does not (it always sends the whole file with 200),
// so the video reports an empty seekable range and every jump returns to 0 s.
// When a video is about to be used (pointer over it, focus, play) and is not seekable, the file is read
// once into memory and the video continues from the same time and play state. Seekable videos are left alone.
// A start time in the source (`movie.mp4#t=10.3`, a media fragment) is applied after the swap if the video
// has not been moved yet; with range requests the browser applies it itself.
(function () {
  "use strict";

  function seekable(v) {
    return v.seekable.length > 0 && v.seekable.end(v.seekable.length - 1) > 0;
  }

  function fragmentStart(v) {
    const m = /#t=([0-9.]+)/.exec(v.getAttribute("src") || "");
    return m ? parseFloat(m[1]) : 0;
  }

  function loadWhole(v) {
    if (v.dataset.seekFix || !v.currentSrc || v.currentSrc.startsWith("blob:")) return;
    if (v.readyState < 1) {
      v.addEventListener("loadedmetadata", () => loadWhole(v), { once: true });
      if (v.preload === "none") v.preload = "metadata";
      return;
    }
    if (seekable(v)) return;
    v.dataset.seekFix = "loading";
    fetch(v.currentSrc)
      .then((r) => (r.ok ? r.blob() : Promise.reject(r.status)))
      .then((blob) => {
        const t = Math.max(v.currentTime, fragmentStart(v));        // before the swap the video could not be moved
        const playing = !v.paused && !v.ended;
        v.addEventListener("loadedmetadata", () => {
          v.currentTime = t;
          if (playing) v.play().catch(() => {});
        }, { once: true });
        v.src = URL.createObjectURL(blob);
        v.dataset.seekFix = "done";
      })
      .catch(() => { v.dataset.seekFix = "failed"; });
  }

  function arm(v) {
    if (v.dataset.seekArmed) return;
    v.dataset.seekArmed = "1";
    for (const ev of ["pointerenter", "focus", "play", "touchstart"]) {
      v.addEventListener(ev, () => loadWhole(v), { passive: true });
    }
  }

  function armAll() {
    document.querySelectorAll(".reveal video").forEach(arm);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", armAll);
  else armAll();
})();
