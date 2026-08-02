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
    "HATA: Bu komut package.json dosyasının bulunduğu proje klasöründe çalıştırılmalı.",
  );
  process.exit(1);
}

const timestamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-");

const backupRoot = path.join(
  root,
  ".aydemir-backups",
  `fast-portfolio-${timestamp}`,
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
  for (const entry of fs.readdirSync(
    directory,
    { withFileTypes: true },
  )) {
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

const cssSource = path.join(
  __dirname,
  "fast-portfolio-patch.css",
);

const cssPatch = fs.readFileSync(
  cssSource,
  "utf8",
);

const cssMarker =
  "AYDEMIR V2 FAST PORTFOLIO + PRIVATE DETAILS PATCH";

const currentCss = fs.readFileSync(
  cssTarget,
  "utf8",
);

if (!currentCss.includes(cssMarker)) {
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
    "Atlandı: CSS güncellemesi zaten uygulanmış.",
  );
}

const schemaTarget = path.join(
  root,
  "supabase",
  "schema.sql",
);

const sqlSource = path.join(
  __dirname,
  "supabase-v2-fast-portfolio.sql",
);

const sqlPatch = fs.readFileSync(
  sqlSource,
  "utf8",
);

const sqlMarker =
  "AYDEMIR V2 FAST PORTFOLIO + PRIVATE DETAILS DATABASE PATCH";

if (fs.existsSync(schemaTarget)) {
  const currentSchema = fs.readFileSync(
    schemaTarget,
    "utf8",
  );

  if (
    !currentSchema.includes(sqlMarker)
  ) {
    fs.appendFileSync(
      schemaTarget,
      `\n\n${sqlPatch}\n`,
      "utf8",
    );

    console.log(
      "Güncellendi: supabase/schema.sql",
    );
  }
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
  "AYDEMİR HIZLI PORTFÖY GÜNCELLEMESİ TAMAMLANDI.",
);
console.log("");
console.log("Yedek klasörü:");
console.log(backupRoot);
console.log("");
console.log(
  "Şimdi Supabase SQL kodunu çalıştırın ve npm.cmd run build yazın.",
);
