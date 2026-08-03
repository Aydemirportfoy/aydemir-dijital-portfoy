const fs = require("fs");
const path = require("path");

const projectRoot = process.cwd();
const sourceRoot = path.join(
  __dirname,
  "patch-files",
);

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

const timestamp =
  new Date()
    .toISOString()
    .replace(/[:.]/g, "-");

const backupRoot = path.join(
  projectRoot,
  ".aydemir-backups",
  `premium-presentation-${timestamp}`,
);

function ensureParent(filePath) {
  fs.mkdirSync(
    path.dirname(filePath),
    {
      recursive: true,
    },
  );
}

function copyFile(relativePath) {
  const source = path.join(
    sourceRoot,
    relativePath,
  );

  const target = path.join(
    projectRoot,
    relativePath,
  );

  if (fs.existsSync(target)) {
    const backup = path.join(
      backupRoot,
      relativePath,
    );

    ensureParent(backup);
    fs.copyFileSync(
      target,
      backup,
    );
  }

  ensureParent(target);
  fs.copyFileSync(
    source,
    target,
  );

  console.log(
    `Güncellendi: ${relativePath}`,
  );
}

function walk(
  directory,
  prefix = "",
) {
  for (
    const entry of fs.readdirSync(
      directory,
      {
        withFileTypes: true,
      },
    )
  ) {
    const absolute =
      path.join(
        directory,
        entry.name,
      );

    const relative =
      path.join(
        prefix,
        entry.name,
      );

    if (entry.isDirectory()) {
      walk(
        absolute,
        relative,
      );
    } else {
      copyFile(relative);
    }
  }
}

walk(sourceRoot);

const cssTarget =
  path.join(
    projectRoot,
    "src",
    "app",
    "globals.css",
  );

const cssPatch =
  fs.readFileSync(
    path.join(
      __dirname,
      "premium-presentation.css",
    ),
    "utf8",
  );

const marker =
  "AYDEMIR V2 PREMIUM PRESENTATION BUILDER + CARDS";

const currentCss =
  fs.readFileSync(
    cssTarget,
    "utf8",
  );

if (
  !currentCss.includes(marker)
) {
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
  "AYDEMİR PREMIUM SUNUM GÜNCELLEMESİ TAMAMLANDI.",
);
