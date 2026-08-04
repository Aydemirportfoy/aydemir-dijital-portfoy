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

let css = fs.readFileSync(
  cssTarget,
  "utf8",
);

const marker =
  "AYDEMIR V2 COMMISSION BADGE POSITION 3D";

const escaped = marker.replace(
  /[.*+?^${}()|[\]\\]/g,
  "\\$&",
);

const existingPattern = new RegExp(
  `\\n?\\/\\* ${escaped} \\*\\/[\\s\\S]*$`,
);

css = css.replace(
  existingPattern,
  "",
);

const patch = fs.readFileSync(
  path.join(
    __dirname,
    "commission-badge-position-3d.css",
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
  "KOMİSYONSUZ ROZETİ FOTOĞRAFIN İÇİNE ALINDI VE 3D LIQUID GLASS HALE GETİRİLDİ.",
);
console.log(
  "Supabase verileri değiştirilmedi.",
);
