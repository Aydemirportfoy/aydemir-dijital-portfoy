const fs = require("fs");
const path = require("path");

const projectRoot =
  process.cwd();

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

const cssTarget =
  path.join(
    projectRoot,
    "src",
    "app",
    "globals.css",
  );

let css =
  fs.readFileSync(
    cssTarget,
    "utf8",
  );

/* DEV DAİREYE SEBEP OLAN SON BLOĞU KALDIR */
const badMarker =
  "AYDEMIR V2 DETAIL ALIGNMENT AND INFO READABILITY";

const escapedBad =
  badMarker.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );

const badPattern =
  new RegExp(
    `\\n?\\/\\* ${escapedBad} \\*\\/[\\s\\S]*?(?=\\n\\/\\* AYDEMIR V2|$)`,
    "g",
  );

css =
  css.replace(
    badPattern,
    "",
  );

/* BU DÜZELTME DAHA ÖNCE VARSA YENİLE */
const marker =
  "AYDEMIR V2 SAFE DETAIL ALIGNMENT FIX";

const escaped =
  marker.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );

const existingPattern =
  new RegExp(
    `\\n?\\/\\* ${escaped} \\*\\/[\\s\\S]*$`,
  );

css =
  css.replace(
    existingPattern,
    "",
  );

const patch =
  fs.readFileSync(
    path.join(
      __dirname,
      "safe-detail-alignment-fix.css",
    ),
    "utf8",
  );

fs.writeFileSync(
  cssTarget,
  css.trimEnd() +
    `\n\n${patch}\n`,
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
  "DEV KOMİSYONSUZ DAİRESİ KALDIRILDI.",
);
console.log(
  "ODA, METREKARE, KAT VE MUTFAK YAZILARI GERÇEK SINIFLARI ÜZERİNDEN BÜYÜTÜLDÜ.",
);
console.log(
  "GALERİ VE SAĞ PANEL GÜVENLİ ŞEKİLDE HİZALANDI.",
);
