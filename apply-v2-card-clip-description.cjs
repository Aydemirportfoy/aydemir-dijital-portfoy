const fs = require("fs");
const path = require("path");

const root = process.cwd();
const sourceRoot = path.join(
  __dirname,
  "patch-files",
);

if (
  !fs.existsSync(
    path.join(root, "package.json"),
  )
) {
  console.error("");
  console.error(
    "HATA: Komutu package.json dosyasının bulunduğu proje klasöründe çalıştırın.",
  );
  process.exit(1);
}

const timestamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-");

const backupRoot = path.join(
  root,
  ".aydemir-backups",
  `compact-description-${timestamp}`,
);

function ensureParent(filePath) {
  fs.mkdirSync(
    path.dirname(filePath),
    { recursive: true },
  );
}

function copyWithBackup(relativePath) {
  const source = path.join(
    sourceRoot,
    relativePath,
  );

  const target = path.join(
    root,
    relativePath,
  );

  if (fs.existsSync(target)) {
    const backup = path.join(
      backupRoot,
      relativePath,
    );

    ensureParent(backup);
    fs.copyFileSync(target, backup);
  }

  ensureParent(target);
  fs.copyFileSync(source, target);

  console.log(
    `Güncellendi: ${relativePath}`,
  );
}

function walk(directory, prefix = "") {
  for (
    const entry of fs.readdirSync(
      directory,
      { withFileTypes: true },
    )
  ) {
    const absolute = path.join(
      directory,
      entry.name,
    );

    const relative = path.join(
      prefix,
      entry.name,
    );

    if (entry.isDirectory()) {
      walk(absolute, relative);
    } else {
      copyWithBackup(relative);
    }
  }
}

walk(sourceRoot);

const cssTarget = path.join(
  root,
  "src",
  "app",
  "globals.css",
);

const cssPatch = fs.readFileSync(
  path.join(
    __dirname,
    "compact-clip-card-patch.css",
  ),
  "utf8",
);

const marker =
  "AYDEMIR V2 COMPACT DESCRIPTION + CARD CLIP PATCH";

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
    "CSS güncellemesi zaten uygulanmış.",
  );
}

fs.rmSync(
  path.join(root, ".next"),
  {
    recursive: true,
    force: true,
  },
);

console.log("");
console.log(
  "AYDEMİR KART KLİBİ VE KOMPAKT AÇIKLAMA GÜNCELLEMESİ TAMAMLANDI.",
);
console.log("");
console.log(
  "Yedek klasörü:",
);
console.log(backupRoot);
