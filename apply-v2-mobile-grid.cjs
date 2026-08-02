const fs = require("fs");
const path = require("path");

const projectRoot = process.cwd();

if (
  !fs.existsSync(
    path.join(projectRoot, "package.json"),
  )
) {
  console.error(
    "HATA: Komutu package.json dosyasının bulunduğu klasörde çalıştırın.",
  );
  process.exit(1);
}

const timestamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-");

const backupRoot = path.join(
  projectRoot,
  ".aydemir-backups",
  `mobile-grid-${timestamp}`,
);

const sourceFile = path.join(
  __dirname,
  "patch-files",
  "src",
  "components",
  "PortfolioGrid.tsx",
);

const targetFile = path.join(
  projectRoot,
  "src",
  "components",
  "PortfolioGrid.tsx",
);

fs.mkdirSync(
  path.dirname(
    path.join(
      backupRoot,
      "src",
      "components",
      "PortfolioGrid.tsx",
    ),
  ),
  { recursive: true },
);

if (fs.existsSync(targetFile)) {
  fs.copyFileSync(
    targetFile,
    path.join(
      backupRoot,
      "src",
      "components",
      "PortfolioGrid.tsx",
    ),
  );
}

fs.copyFileSync(
  sourceFile,
  targetFile,
);

console.log(
  "Güncellendi: src/components/PortfolioGrid.tsx",
);

const cssTarget = path.join(
  projectRoot,
  "src",
  "app",
  "globals.css",
);

const cssPatch = fs.readFileSync(
  path.join(
    __dirname,
    "mobile-2-4-compact-clip.css",
  ),
  "utf8",
);

const marker =
  "AYDEMIR V2 MOBILE 2/4 + COMPACT CLIP BADGE";

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
  "AYDEMİR MOBİL 2/4 VE KOMPAKT KLİP GÜNCELLEMESİ TAMAMLANDI.",
);
