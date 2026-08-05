#!/usr/bin/env node

// Capture the coupled-pendulum interactive from the rendered lecture itself.
// The still and every video frame therefore use the same DOM, equations and
// rendering code as the browser animation shown to students.

const fs = require("fs");
const path = require("path");
const {pathToFileURL} = require("url");
const puppeteer = require(
  "/opt/homebrew/lib/node_modules/decktape/node_modules/puppeteer"
);

function parseArguments(argv) {
  const options = {};
  for (let index = 2; index < argv.length; index += 2) {
    options[argv[index].replace(/^--/, "")] = argv[index + 1];
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv);
  const html = path.resolve(options.html || "");
  const frames = path.resolve(options.frames || "");
  const poster = path.resolve(options.poster || "");
  const count = Number(options.count || 120);

  if (!fs.existsSync(html) || !frames || !poster) {
    throw new Error(
      "Usage: capture_coupled_pendula.js --html FILE --frames DIR " +
      "--poster FILE [--count 120]"
    );
  }
  fs.mkdirSync(frames, {recursive: true});
  fs.mkdirSync(path.dirname(poster), {recursive: true});

  const browser = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
    args: ["--allow-file-access-from-files", "--disable-web-security"]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({width: 1440, height: 900, deviceScaleFactor: 1.5});
    const url = pathToFileURL(html).href +
      "#/\u0434\u0432\u0430-\u043c\u0430\u044f\u0442\u043d\u0438\u043a\u0430-\u0440\u0430\u0437\u043d\u044b\u0445-\u043c\u0430\u0441\u0441";
    await page.goto(url, {waitUntil: "networkidle0"});
    await page.waitForSelector("[data-coupled-pendula-ready='true']");

    await page.evaluate(() => {
      const root = document.querySelector("[data-coupled-pendula-lab]");
      const set = (selector, value) => {
        const input = root.querySelector(selector);
        input.value = value;
        input.dispatchEvent(new Event("input", {bubbles: true}));
      };
      root.querySelector("[data-toggle]").click();
      set("[data-mass]", Math.log10(2));
      set("[data-coupling]", 0.18);
      set("[data-initial]", 14);
      set("[data-carrier]", 25);
    });

    const root = await page.$("[data-coupled-pendula-lab]");
    await page.evaluate(() => {
      const input = document.querySelector(
        "[data-coupled-pendula-lab] [data-phase]"
      );
      input.value = 0.82;
      input.dispatchEvent(new Event("input", {bubbles: true}));
    });
    await root.screenshot({path: poster, type: "jpeg", quality: 94});

    for (let index = 0; index < count; index += 1) {
      const phase = 2 * index / count;
      await page.evaluate(value => {
        const input = document.querySelector(
          "[data-coupled-pendula-lab] [data-phase]"
        );
        input.value = value;
        input.dispatchEvent(new Event("input", {bubbles: true}));
      }, phase);
      const filename = path.join(
        frames,
        `frame-${String(index).padStart(4, "0")}.png`
      );
      await root.screenshot({path: filename, type: "png"});
    }
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
