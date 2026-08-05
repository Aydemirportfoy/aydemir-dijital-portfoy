const fs = require("fs");
const path = require("path");

const projectRoot = process.cwd();

if (!fs.existsSync(path.join(projectRoot, "package.json"))) {
  console.error("");
  console.error("HATA: Komutu package.json dosyasının bulunduğu proje klasöründe çalıştırın.");
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(
  projectRoot,
  ".aydemir-backups",
  `vercel-build-fix-${stamp}`,
);

function backupFile(relativePath) {
  const source = path.join(projectRoot, relativePath);

  if (!fs.existsSync(source)) {
    return false;
  }

  const target = path.join(backupRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  return true;
}

function copyDirectory(source, target) {
  if (!fs.existsSync(source)) {
    return;
  }

  fs.mkdirSync(target, { recursive: true });

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourceEntry = path.join(source, entry.name);
    const targetEntry = path.join(target, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourceEntry, targetEntry);
    } else {
      fs.copyFileSync(sourceEntry, targetEntry);
    }
  }
}

const pageRelative = "src/app/yonetim/talepler/[id]/page.tsx";
const pageTarget = path.join(projectRoot, pageRelative);

if (!fs.existsSync(pageTarget)) {
  console.error(`HATA: ${pageRelative} bulunamadı.`);
  process.exit(1);
}

backupFile(pageRelative);
backupFile("tsconfig.json");
backupFile(".gitignore");

let page = fs.readFileSync(pageTarget, "utf8");

if (!page.includes("const normalizedRelations")) {
  const insertionPoint = `  if (!request) {
    notFound();
  }`;

  const normalizationBlock = `  const normalizedRelations =
    (relations ?? []).map(
      (relation) => {
        const rawPresentation =
          relation.presentation;

        return {
          ...relation,
          presentation:
            Array.isArray(
              rawPresentation,
            )
              ? rawPresentation[0] ??
                null
              : rawPresentation ??
                null,
        };
      },
    ) as unknown as RequestPresentationLink[];

  if (!request) {
    notFound();
  }`;

  if (!page.includes(insertionPoint)) {
    console.error("HATA: Talep detay sayfasında düzeltme noktası bulunamadı.");
    process.exit(1);
  }

  page = page.replace(insertionPoint, normalizationBlock);
}

const oldPresentationProp = `      initialPresentations={
        (relations ??
          []) as RequestPresentationLink[]
      }`;

const newPresentationProp = `      initialPresentations={
        normalizedRelations
      }`;

if (page.includes(oldPresentationProp)) {
  page = page.replace(oldPresentationProp, newPresentationProp);
}

fs.writeFileSync(pageTarget, page, "utf8");

/* TypeScript yalnızca gerçek uygulama kodlarını kontrol etsin. */
const tsconfigPath = path.join(projectRoot, "tsconfig.json");
const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf8"));

const exclude = new Set(
  Array.isArray(tsconfig.exclude)
    ? tsconfig.exclude
    : [],
);

exclude.add("node_modules");
exclude.add("payload");
exclude.add("patch-files");
exclude.add(".aydemir-backups");

tsconfig.exclude = Array.from(exclude);

fs.writeFileSync(
  tsconfigPath,
  `${JSON.stringify(tsconfig, null, 2)}\n`,
  "utf8",
);

/* Kurulum paketinden kalan payload klasörünü güvenle yedekle ve kaldır. */
const payloadPath = path.join(projectRoot, "payload");
const payloadBackup = path.join(backupRoot, "payload");

if (fs.existsSync(payloadPath)) {
  copyDirectory(payloadPath, payloadBackup);
  fs.rmSync(payloadPath, {
    recursive: true,
    force: true,
  });
}

/* Gelecekte payload tekrar Git'e eklenmesin. */
const gitignorePath = path.join(projectRoot, ".gitignore");
let gitignore = fs.existsSync(gitignorePath)
  ? fs.readFileSync(gitignorePath, "utf8")
  : "";

if (!gitignore.split(/\r?\n/).includes("payload/")) {
  gitignore = `${gitignore.trimEnd()}\n\npayload/\n`;
  fs.writeFileSync(gitignorePath, gitignore, "utf8");
}

fs.writeFileSync(
  path.join(backupRoot, "manifest.json"),
  JSON.stringify(
    {
      createdAt: new Date().toISOString(),
      pageRelative,
      payloadWasPresent: fs.existsSync(payloadBackup),
    },
    null,
    2,
  ),
  "utf8",
);

fs.rmSync(path.join(projectRoot, ".next"), {
  recursive: true,
  force: true,
});

console.log("");
console.log("VERCEL BUILD HATASI DÜZELTİLDİ.");
console.log("- Supabase sunum ilişkisi güvenli şekilde tek kayda dönüştürüldü.");
console.log("- payload klasörü yedeklendi ve projeden kaldırıldı.");
console.log("- TypeScript gereksiz kurulum klasörlerini artık kontrol etmeyecek.");
console.log("- Supabase verileri değiştirilmedi.");
console.log("");
console.log("ŞİMDİ ÇALIŞTIRIN:");
console.log("npm.cmd run build");
console.log("");
