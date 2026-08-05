const fs = require("fs");
const path = require("path");

const projectRoot = process.cwd();

if (
  !fs.existsSync(
    path.join(projectRoot, "package.json"),
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
  projectRoot,
  ".aydemir-backups",
  `hizli-ilan-2-${timestamp}`,
);

const replacementFiles = [
  "src/lib/projectTemplates.ts",
  "src/components/admin/QuickListingImporter.tsx",
  "src/components/admin/ListingsManager.tsx",
];

const cssTargetRelative =
  "src/app/globals.css";

const cssMarker =
  "AYDEMIR V3 QUICK LISTING 2 PROJECT TEMPLATE DUPLICATE";

function copyWithDirectories(
  source,
  target,
) {
  fs.mkdirSync(
    path.dirname(target),
    {
      recursive: true,
    },
  );

  fs.copyFileSync(
    source,
    target,
  );
}

function backupFile(
  relativePath,
) {
  const target =
    path.join(
      projectRoot,
      relativePath,
    );

  if (
    !fs.existsSync(target)
  ) {
    return false;
  }

  copyWithDirectories(
    target,
    path.join(
      backupRoot,
      relativePath,
    ),
  );

  return true;
}

const existedBefore = {};

for (
  const relativePath
  of replacementFiles
) {
  existedBefore[relativePath] =
    backupFile(relativePath);

  copyWithDirectories(
    path.join(
      __dirname,
      relativePath,
    ),
    path.join(
      projectRoot,
      relativePath,
    ),
  );
}

existedBefore[cssTargetRelative] =
  backupFile(
    cssTargetRelative,
  );

const cssTarget =
  path.join(
    projectRoot,
    cssTargetRelative,
  );

let css =
  fs.readFileSync(
    cssTarget,
    "utf8",
  );

const escapedMarker =
  cssMarker.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );

const existingBlock =
  new RegExp(
    `\\n?\\/\\* ${escapedMarker} \\*\\/[\\s\\S]*?(?=\\n\\/\\* AYDEMIR|$)`,
    "g",
  );

css =
  css.replace(
    existingBlock,
    "",
  );

const cssPatch =
  fs.readFileSync(
    path.join(
      __dirname,
      "hizli-ilan-2-proje-sablon-cogaltma.css",
    ),
    "utf8",
  );

fs.writeFileSync(
  cssTarget,
  `${css.trimEnd()}\n\n${cssPatch.trim()}\n`,
  "utf8",
);

fs.mkdirSync(
  backupRoot,
  {
    recursive: true,
  },
);

fs.writeFileSync(
  path.join(
    backupRoot,
    "manifest.json",
  ),
  JSON.stringify(
    {
      createdAt:
        new Date().toISOString(),
      replacementFiles,
      cssTargetRelative,
      existedBefore,
    },
    null,
    2,
  ),
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
  "HIZLI İLAN 2.0 BAŞARIYLA KURULDU.",
);
console.log("");
console.log(
  "✓ Proje şablonları eklendi",
);
console.log(
  "✓ İlan kartlarına Çoğalt butonu eklendi",
);
console.log(
  "✓ Taslak koruması devam ediyor",
);
console.log(
  "✓ Fotoğraflar sonraki ekranda toplu eklenebilir",
);
console.log(
  "✓ Mevcut ilanlar ve Supabase verileri değiştirilmedi",
);
console.log("");
console.log(
  "Hızlı ilan:",
);
console.log(
  "http://localhost:3000/yonetim/hizli-ilan",
);
console.log("");
