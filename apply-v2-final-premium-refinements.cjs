const fs = require("fs");
const path = require("path");

const projectRoot = process.cwd();

if (
  !fs.existsSync(
    path.join(
      projectRoot,
      "package.json",
    ),
  )
) {
  console.error(
    "HATA: Komutu package.json dosyasının bulunduğu proje klasöründe çalıştırın.",
  );
  process.exit(1);
}

const cssTarget = path.join(
  projectRoot,
  "src",
  "app",
  "globals.css",
);

const cssPatch = fs.readFileSync(
  path.join(
    __dirname,
    "final-premium-micro-refinements.css",
  ),
  "utf8",
);

const marker =
  "AYDEMIR V2 FINAL PREMIUM MICRO REFINEMENTS";

let currentCss = fs.readFileSync(
  cssTarget,
  "utf8",
);

const escaped = marker.replace(
  /[.*+?^${}()|[\]\\]/g,
  "\\$&",
);

const existingPattern = new RegExp(
  `\\n?\\/\\* ${escaped} \\*\\/[\\s\\S]*$`,
);

currentCss = currentCss.replace(
  existingPattern,
  "",
);

fs.writeFileSync(
  cssTarget,
  currentCss.trimEnd() +
    `\n\n${cssPatch}\n`,
  "utf8",
);

fs.rmSync(
  path.join(
    projectRoot,
    ".next",
  ),
  {
    recursive: true,
    force: true,
  },
);

console.log("");
console.log(
  "SON PREMIUM İNCE AYARLAR TAMAMLANDI.",
);
console.log(
  "Sayfa yapısı ve Supabase verileri değiştirilmedi.",
);
