#!/usr/bin/env node

import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const args = process.argv.slice(2);
const pageUrl = args[0];
const outputPath = args[1];
const duration = Number(args[2] || "5");
const fps = Number(args[3] || "8");

if (!pageUrl || !outputPath) {
  console.error(
    "usage: record_embedded_animation.mjs URL OUTPUT.mp4 [duration] [fps]"
  );
  process.exit(2);
}

const frameCount = Math.max(2, Math.round(duration * fps));
const chromePath =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = 9333 + Math.floor(Math.random() * 500);
const tempDir = fs.mkdtempSync(
  path.join(os.tmpdir(), "neutrino-epub-anim-")
);
const profileDir = path.join(tempDir, "profile");
const sleep = milliseconds =>
  new Promise(resolve => setTimeout(resolve, milliseconds));

async function waitForDebugger() {
  const endpoint = "http://127.0.0.1:" + port + "/json/version";
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) return;
    } catch {
      // Chrome has not opened the debugging port yet.
    }
    await sleep(100);
  }
  throw new Error("Chrome DevTools endpoint did not start");
}

class CdpConnection {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.nextId = 1;
    this.pending = new Map();
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", event => {
      const message = JSON.parse(event.data);
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
    });
  }

  send(method, params = {}) {
    const id = this.nextId;
    this.nextId += 1;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error("CDP timeout: " + method));
      }, 15000);
      this.pending.set(id, {
        resolve: value => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: error => {
          clearTimeout(timer);
          reject(error);
        }
      });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.socket.close();
  }
}

const chrome = spawn(
  chromePath,
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    "--remote-debugging-port=" + port,
    "--user-data-dir=" + profileDir,
    "--window-size=1600,900",
    "about:blank"
  ],
  { stdio: "ignore" }
);

try {
  await waitForDebugger();
  const targetResponse = await fetch(
    "http://127.0.0.1:" + port + "/json/new?" +
      encodeURIComponent(pageUrl),
    { method: "PUT" }
  );
  const target = await targetResponse.json();
  const cdp = new CdpConnection(target.webSocketDebuggerUrl);
  await cdp.open();
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1600,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  await sleep(5000);
  // OJS slides can keep network activity alive indefinitely. The visible
  // slide is ready by this point; stopping the loader makes frame capture
  // deterministic without changing the running JavaScript.
  if (pageUrl.startsWith("file:")) {
    await cdp.send("Page.stopLoading");
  }
  await cdp.send("Runtime.evaluate", {
    expression:
      "(() => {" +
      "const selectors=['.reveal .controls','.reveal .progress'," +
      "'.reveal .slide-number','.slide-menu-button','.reveal .footer'];" +
      "selectors.forEach(s=>document.querySelectorAll(s).forEach(e=>" +
      "{e.style.display='none';}));" +
      "document.querySelectorAll('section.present [data-play]').forEach(b=>" +
      "{if(!b.classList.contains('is-active'))b.click();});" +
      "})()"
  });

  for (let frame = 0; frame < frameCount; frame += 1) {
    const progress = frame / (frameCount - 1);
    await cdp.send("Runtime.evaluate", {
      expression:
        "(() => {" +
        "const progress=" + progress + ";" +
        "const ranges=[...document.querySelectorAll(" +
        "'section.present input[type=range]')];" +
        "ranges.forEach((input,index)=>{" +
        "const min=Number(input.min||0),max=Number(input.max||100);" +
        "const shifted=(progress+0.19*index)%1;" +
        "const wave=1-Math.abs(2*shifted-1);" +
        "input.value=String(min+wave*(max-min));" +
        "input.dispatchEvent(new Event('input',{bubbles:true}));" +
        "input.dispatchEvent(new Event('change',{bubbles:true}));" +
        "});})()"
    });
    await sleep(Math.round(1000 / fps));
    const screenshot = await cdp.send("Page.captureScreenshot", {
      format: "jpeg",
      quality: 88,
      fromSurface: true,
      captureBeyondViewport: false
    });
    const frameName =
      "frame-" + String(frame).padStart(4, "0") + ".jpg";
    fs.writeFileSync(
      path.join(tempDir, frameName),
      Buffer.from(screenshot.data, "base64")
    );
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const encode = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-loglevel",
      "error",
      "-framerate",
      String(fps),
      "-i",
      path.join(tempDir, "frame-%04d.jpg"),
      "-vf",
      "scale=1280:720:force_original_aspect_ratio=decrease," +
        "pad=1280:720:(ow-iw)/2:(oh-ih)/2:black",
      "-an",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "25",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      outputPath
    ],
    { encoding: "utf8" }
  );
  if (encode.status !== 0) {
    throw new Error(encode.stderr || "ffmpeg failed");
  }
  cdp.close();
  console.log(outputPath + ": " + frameCount + " frames");
} finally {
  chrome.kill("SIGTERM");
  await sleep(300);
  fs.rmSync(tempDir, {
    recursive: true,
    force: true,
    maxRetries: 8,
    retryDelay: 100
  });
}
