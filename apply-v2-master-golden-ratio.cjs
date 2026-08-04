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
  `master-design-system-${timestamp}`,
);

function backup(relativePath) {
  const target = path.join(
    projectRoot,
    relativePath,
  );

  if (!fs.existsSync(target)) {
    return;
  }

  const destination = path.join(
    backupRoot,
    relativePath,
  );

  fs.mkdirSync(
    path.dirname(destination),
    { recursive: true },
  );

  fs.copyFileSync(
    target,
    destination,
  );
}

function replaceAll(
  text,
  replacements,
) {
  let next = text;

  for (const [from, to] of replacements) {
    next = next.split(from).join(to);
  }

  return next;
}

function patchAdminDensity() {
  const relativePath =
    "src/components/admin/ListingsManager.tsx";

  const target = path.join(
    projectRoot,
    relativePath,
  );

  if (!fs.existsSync(target)) {
    console.log(
      "Atlandı: ListingsManager.tsx bulunamadı."
    );
    return;
  }

  backup(relativePath);

  let source = fs.readFileSync(
    target,
    "utf8",
  );

  source = replaceAll(
    source,
    [
      [
        "type Density = 4 | 6 | 8;",
        "type Density = 3 | 4 | 6;",
      ],
      [
        'saved === "4" ||\n      saved === "6" ||\n      saved === "8"',
        'saved === "3" ||\n      saved === "4" ||\n      saved === "6"',
      ],
      [
        "[4, 6, 8] as Density[]",
        "[3, 4, 6] as Density[]",
      ],
    ],
  );

  const featureFunction =
    /function importantFeatures\([\s\S]*?return sorted\.slice\(0, limit\);\n}/;

  const functionMatch =
    source.match(featureFunction);

  if (functionMatch) {
    const updated =
      functionMatch[0].replace(
        /const limit =[\s\S]*?;\n\n  return sorted\.slice/,
        `const limit =
    density === 3
      ? 4
      : density === 4
        ? 3
        : 2;

  return sorted.slice`,
      );

    source = source.replace(
      functionMatch[0],
      updated,
    );
  }

  fs.writeFileSync(
    target,
    source,
    "utf8",
  );

  console.log(
    "Yönetim görünümü 3 / 4 / 6 olarak güncellendi."
  );
}

function patchPublicDensity() {
  const relativePath =
    "src/components/PortfolioGrid.tsx";

  const target = path.join(
    projectRoot,
    relativePath,
  );

  if (!fs.existsSync(target)) {
    console.log(
      "Atlandı: PortfolioGrid.tsx bulunamadı."
    );
    return;
  }

  backup(relativePath);

  let source = fs.readFileSync(
    target,
    "utf8",
  );

  source = replaceAll(
    source,
    [
      [
        "type Density = 4 | 6 | 8;",
        "type Density = 3 | 4 | 6;",
      ],
      [
        "useState<Density>(6)",
        "useState<Density>(4)",
      ],
      [
        'saved === "4" ||\n      saved === "6" ||\n      saved === "8"',
        'saved === "3" ||\n      saved === "4" ||\n      saved === "6"',
      ],
      [
        "[4, 6, 8] as Density[]",
        "[3, 4, 6] as Density[]",
      ],
    ],
  );

  fs.writeFileSync(
    target,
    source,
    "utf8",
  );

  console.log(
    "Halka açık görünüm 3 / 4 / 6 olarak güncellendi."
  );
}

function cleanAndAppendCss() {
  const relativePath =
    "src/app/globals.css";

  const target = path.join(
    projectRoot,
    relativePath,
  );

  backup(relativePath);

  let source = fs.readFileSync(
    target,
    "utf8",
  );

  const designMarkers = [
    "AYDEMIR V2 PREMIUM DETAIL + PUBLIC 4/6/8",
    "AYDEMIR V2 ADMIN LISTING CARDS CLEAN PREMIUM",
    "AYDEMIR V2 ADMIN LISTING VIEW BUTTON REMOVED",
    "AYDEMIR V2 CLICKABLE COMPACT PREMIUM LISTING CARD",
    "AYDEMIR V2 LISTING CARD TITLE PRICE MORE REFINEMENT",
    "AYDEMIR V2 GOLDEN RATIO ADMIN POLISH",
    "AYDEMIR V2 LIQUID GLASS CARD PRIVATE DETAIL",
    "AYDEMIR V2 CARD PROPORTION AND DETAIL TITLE",
    "AYDEMIR V2 DETAIL TYPOGRAPHY AND PRICE REFINEMENT",
    "AYDEMIR V2 DELETE BUTTON AND DETAIL TEXT SCALE",
    "AYDEMIR V2 MASTER GOLDEN RATIO DESIGN SYSTEM",
  ];

  for (const marker of designMarkers) {
    const escaped = marker.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );

    const pattern = new RegExp(
      `\\n?\\/\\* ${escaped} \\*\\/[\\s\\S]*?(?=\\n\\/\\* AYDEMIR V2|$)`,
      "g",
    );

    source = source.replace(
      pattern,
      "",
    );
  }

  const cssPatch = fs.readFileSync(
    path.join(
      __dirname,
      "master-golden-ratio-design-system.css",
    ),
    "utf8",
  );

  fs.writeFileSync(
    target,
    source.trimEnd() +
      `\n\n${cssPatch}\n`,
    "utf8",
  );

  console.log(
    "Tüm site için tek ve tutarlı tasarım sistemi uygulandı."
  );
}

patchAdminDensity();
patchPublicDensity();
cleanAndAppendCss();

fs.rmSync(
  path.join(projectRoot, ".next"),
  {
    recursive: true,
    force: true,
  },
);

console.log("");
console.log(
  "AYDEMİR 3 / 4 / 6 ALTIN ORAN TASARIM SİSTEMİ TAMAMLANDI."
);
console.log(
  "Supabase verileri ve işlevsel sürükleme sistemleri değiştirilmedi."
);
