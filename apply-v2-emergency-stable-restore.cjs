const fs = require("fs");
const path = require("path");

const projectRoot = process.cwd();

if (!fs.existsSync(path.join(projectRoot, "package.json"))) {
  console.error(
    "HATA: Komutu package.json dosyasının bulunduğu proje klasöründe çalıştırın."
  );
  process.exit(1);
}

const timestamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-");

const backupRoot = path.join(
  projectRoot,
  ".aydemir-backups",
  `emergency-stable-${timestamp}`,
);

function ensureParent(filePath) {
  fs.mkdirSync(
    path.dirname(filePath),
    { recursive: true },
  );
}

function backupFile(filePath, relativePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const backupPath = path.join(
    backupRoot,
    relativePath,
  );

  ensureParent(backupPath);
  fs.copyFileSync(
    filePath,
    backupPath,
  );
}

const componentRelative =
  "src/components/admin/ListingsManager.tsx";

const componentTarget = path.join(
  projectRoot,
  componentRelative,
);

backupFile(
  componentTarget,
  componentRelative,
);

fs.copyFileSync(
  path.join(
    __dirname,
    "patch-files",
    componentRelative,
  ),
  componentTarget,
);

console.log(
  `Geri yüklendi: ${componentRelative}`,
);

const cssRelative =
  "src/app/globals.css";

const cssTarget = path.join(
  projectRoot,
  cssRelative,
);

backupFile(
  cssTarget,
  cssRelative,
);

let css = fs.readFileSync(
  cssTarget,
  "utf8",
);

const markers = [
  "AYDEMIR V2 GOLDEN RATIO ADMIN POLISH",
  "AYDEMIR V2 LIQUID GLASS CARD PRIVATE DETAIL",
];

for (const marker of markers) {
  const escaped = marker.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );

  const blockPattern = new RegExp(
    `\\n?\\/\\* ${escaped} \\*\\/[\\s\\S]*?(?=\\n\\/\\* AYDEMIR V2|$)`,
    "g",
  );

  css = css.replace(
    blockPattern,
    "",
  );
}

fs.writeFileSync(
  cssTarget,
  css.trimEnd() + "\n",
  "utf8",
);

console.log(
  "Son iki sorunlu CSS düzenlemesi kaldırıldı.",
);

fs.rmSync(
  path.join(projectRoot, ".next"),
  {
    recursive: true,
    force: true,
  },
);

console.log("");
console.log(
  "SON ÇALIŞAN KARARLI GÖRÜNÜM GERİ YÜKLENDİ."
);
