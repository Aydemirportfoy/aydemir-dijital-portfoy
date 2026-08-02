const fs = require("fs");
const path = require("path");

const root = process.cwd();
const sourceRoot = path.join(
  __dirname,
  "patch-files",
);

const requiredFile = path.join(
  root,
  "package.json",
);

if (!fs.existsSync(requiredFile)) {
  console.error("");
  console.error(
    "HATA: Komut package.json dosyasının bulunduğu klasörde çalıştırılmalı.",
  );
  console.error(
    "Şu anda açık olan klasör doğru proje ana klasörü değil.",
  );
  process.exit(1);
}

const timestamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-");

const backupRoot = path.join(
  root,
  ".aydemir-backups",
  `media-autosave-${timestamp}`,
);

function ensureDir(filePath) {
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

    ensureDir(backup);
    fs.copyFileSync(target, backup);
  }

  ensureDir(target);
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

const cssPatch = fs.readFileSync(
  path.join(
    __dirname,
    "globals-patch.css",
  ),
  "utf8",
);

const cssMarker =
  "AYDEMIR V2 MEDIA + AUTOSAVE PATCH";

let currentCss = fs.readFileSync(
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
    "Atlandı: CSS güncellemesi zaten var.",
  );
}

const schemaTarget = path.join(
  root,
  "supabase",
  "schema.sql",
);

const sqlPatch = fs.readFileSync(
  path.join(
    __dirname,
    "supabase-v2-media.sql",
  ),
  "utf8",
);

const sqlMarker =
  "AYDEMIR V2 MEDIA + AUTOSAVE DATABASE PATCH";

if (fs.existsSync(schemaTarget)) {
  const currentSchema = fs.readFileSync(
    schemaTarget,
    "utf8",
  );

  if (!currentSchema.includes(sqlMarker)) {
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
  "AYDEMİR V2 GÜNCELLEMESİ TAMAMLANDI.",
);
console.log(
  "Yedek klasörü:",
);
console.log(backupRoot);
console.log("");
console.log(
  "Şimdi Supabase SQL dosyasını çalıştırın, ardından npm.cmd run build yazın.",
);
