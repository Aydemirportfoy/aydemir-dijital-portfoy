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

const removeMarkers = [
  "AYDEMIR V2 DETAIL ALIGNMENT AND INFO READABILITY",
  "AYDEMIR V2 SAFE DETAIL ALIGNMENT FIX",
  "AYDEMIR V2 BALANCED DETAIL PROPORTION",
  "AYDEMIR V2 COMPACT LIQUID GLASS DETAIL ALIGNMENT",
];

for (
  const marker
  of removeMarkers
) {
  const escaped =
    marker.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );

  const pattern =
    new RegExp(
      `\\n?\\/\\* ${escaped} \\*\\/[\\s\\S]*?(?=\\n\\/\\* AYDEMIR V2|$)`,
      "g",
    );

  css =
    css.replace(
      pattern,
      "",
    );
}

const patch =
  fs.readFileSync(
    path.join(
      __dirname,
      "compact-liquid-glass-detail-alignment.css",
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
  "DETAY SAYFASI KOMPAKT, HİZALI VE LIQUID GLASS HALE GETİRİLDİ.",
);
console.log(
  "Supabase verileri değiştirilmedi.",
);
