#!/usr/bin/env node

// Capture print posters for the interactive blocks of the book from the
// rendered applet pages themselves, so the PDF shows the same DOM, equations
// and colours as the browser applet.
//
// The applets use Observable JS, which refuses file:// URLs, so the rendered
// site has to be served over HTTP first, for example
//
//   python -m http.server 8791 --bind 127.0.0.1 --directory _site
//   node introduction/ru/book/scripts/capture_applet_posters.js \
//     --base http://127.0.0.1:8791/introduction/ru/applets/ \
//     --out introduction/ru/book/assets/chapters [--only fermi-function]

const fs = require("fs");
const path = require("path");
const puppeteer = require(
  "/opt/homebrew/lib/node_modules/decktape/node_modules/puppeteer"
);

// width: CSS width of the applet stage; selector: element to capture;
// wait: seconds of animation before the still; prepare: initial state;
// until: optional predicate polled in the page before the still;
// fontSize: stage font size (applets.css uses 34px on narrower screens) for
// applets whose side panels overflow at the full 42px.
const POSTERS = [
  {
    applet: "fermi-function",
    poster: "04_direct_neutrino_mass/fermi_function.jpg",
    width: 1135,
    selector: ".applet-stage",
    wait: 2
  },
  {
    applet: "cyclotron-motion",
    poster: "04_direct_neutrino_mass/cyclotron_motion.jpg",
    width: 1135,
    selector: ".applet-stage",
    wait: 2.4,
    prepare: () => {
      const root = document.querySelector("[data-cyclotron-portrait]");
      const set = (selector, value) => {
        const input = root.querySelector(selector);
        input.value = value;
        input.dispatchEvent(new Event("input", {bubbles: true}));
      };
      set("[data-portrait-energy-input]", 1.4);
      set("[data-portrait-field-input]", 1.0);
    }
  },
  {
    applet: "planar-rotor",
    poster: "04_direct_neutrino_mass/planar_rotor.jpg",
    width: 1000,
    selector: ".applet-stage",
    wait: 0,
    // Stop the rotor at an angle where φ, R and v are all readable.
    until: () => {
      const root = document.querySelector(".planar-rotor-demo");
      const match = root.textContent.match(/φ = (\d+\.\d+)/);
      const angle = match ? Number(match[1]) : -1;
      return angle > 2.25 && angle < 2.45;
    }
  },
  {
    applet: "adiabatic-trough",
    poster: "06_mac_e_spectrometer/adiabatic_trough.jpg",
    width: 1600,
    fontSize: 34,
    selector: ".applet-stage",
    wait: 6.4,
    prepare: () => {
      document.querySelector("[data-trough-restart]").click();
    }
  },
  {
    applet: "radiation-belts",
    poster: "06_mac_e_spectrometer/radiation_belts.jpg",
    width: 1400,
    fontSize: 34,
    selector: ".applet-stage",
    wait: 1.6,
    prepare: () => {
      document.querySelector(".loss-cone-lab [data-role='play']").click();
    }
  }
];

// Let the applet stage take its own width instead of the narrow text column.
const STAGE_CSS = (width, fontSize) => `
  #quarto-content { display: block !important; }
  main.content { max-width: none !important; width: auto !important;
    margin: 0 !important; padding: 0 !important; }
  .applet-stage { width: ${width}px !important; max-width: none !important;
    height: auto !important; overflow: visible !important;
    margin: 0 !important; }
  ${fontSize ? `.applet-stage { font-size: ${fontSize}px !important; }` : ""}
`;

function parseArguments(argv) {
  const options = {};
  for (let index = 2; index < argv.length; index += 2) {
    options[argv[index].replace(/^--/, "")] = argv[index + 1];
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv);
  const base = options.base || "";
  const out = path.resolve(options.out || "");
  const only = options.only ? options.only.split(",") : null;
  if (!base || !options.out) {
    throw new Error(
      "Usage: capture_applet_posters.js --base URL --out DIR [--only a,b]"
    );
  }

  const browser = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true
  });

  try {
    for (const item of POSTERS) {
      if (only && !only.includes(item.applet)) continue;
      const page = await browser.newPage();
      await page.setViewport({
        width: item.width + 40, height: 1100, deviceScaleFactor: 2
      });
      await page.goto(`${base}${item.applet}.html?embed=1`, {
        waitUntil: "networkidle2", timeout: 60000
      });
      await page.addStyleTag({content: STAGE_CSS(item.width, item.fontSize)});
      await page.evaluate(() => document.fonts.ready);
      await new Promise(resolve => setTimeout(resolve, 1500));
      if (item.prepare) await page.evaluate(item.prepare);
      await new Promise(resolve => setTimeout(resolve, item.wait * 1000));
      if (item.until) {
        await page.waitForFunction(item.until, {polling: 16, timeout: 30000});
      }

      const element = await page.$(item.selector);
      const file = path.join(out, item.poster);
      fs.mkdirSync(path.dirname(file), {recursive: true});
      await element.screenshot({path: file, type: "jpeg", quality: 92});
      console.log(file);
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
