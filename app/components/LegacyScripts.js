"use client";

import { useEffect } from "react";

const legacyScriptSources = [
  "/js/jquery.min.js",
  "/vendor/bootstrap/js/bootstrap.bundle.min.js",
  "/vendor/OwlCarousel/owl.carousel.js",
  "/vendor/bootstrap-select/dist/js/bootstrap-select.min.js",
  "/vendor/mixitup/dist/mixitup.min.js",
  "/js/custom.js",
];

function findExistingScript(src) {
  const absoluteSrc = new URL(src, window.location.href).href;
  return Array.from(document.scripts).find(
    (script) => script.getAttribute("src") === src || script.src === absoluteSrc
  );
}

function loadLegacyScript(src) {
  return new Promise((resolve, reject) => {
    const existingScript = findExistingScript(src);

    if (existingScript) {
      if (existingScript.dataset.eventunaScriptState !== "loading") {
        resolve();
        return;
      }

      existingScript.addEventListener("load", resolve, { once: true });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.dataset.eventunaScriptState = "loading";
    script.addEventListener(
      "load",
      () => {
        script.dataset.eventunaScriptState = "loaded";
        resolve();
      },
      { once: true }
    );
    script.addEventListener(
      "error",
      () => {
        script.dataset.eventunaScriptState = "failed";
        reject(new Error(`Failed to load ${src}`));
      },
      { once: true }
    );
    document.body.appendChild(script);
  });
}

export default function LegacyScripts() {
  useEffect(() => {
    let active = true;

    async function loadScriptsInOrder() {
      for (const src of legacyScriptSources) {
        if (!active) return;
        await loadLegacyScript(src);
      }
    }

    loadScriptsInOrder().catch((error) => {
      console.error("Unable to load vendor scripts:", error);
    });

    return () => {
      active = false;
    };
  }, []);

  return null;
}
