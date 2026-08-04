const fs = require("fs");
const path = require("path");

const projectRoot = process.cwd();

if (!fs.existsSync(path.join(projectRoot, "package.json"))) {
  console.error(
    "HATA: Komutu package.json dosyasının bulunduğu proje klasöründe çalıştırın."
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
    "presentation-more-menu-stack-fix.css",
  ),
  "utf8",
);

const marker =
  "AYDEMIR V2 PRESENTATION MORE MENU STACK FIX";

const currentCss = fs.readFileSync(
  cssTarget,
  "utf8",
);

if (!currentCss.includes(marker)) {
  fs.appendFileSync(
    cssTarget,
    `\n\n${cssPatch}\n`,
    "utf8",
  );

  console.log(
    "Güncellendi: src/app/globals.css",
  );
} else {
  console.log(
    "Bu güncelleme daha önce uygulanmış.",
  );
}

fs.rmSync(
  path.join(projectRoot, ".next"),
  {
    recursive: true,
    force: true,
  },
);

console.log("");
console.log(
  "DİĞER MENÜSÜNÜN ALTTKİ KARTIN ÜZERİNDE GÖRÜNMESİ DÜZELTİLDİ."
);
