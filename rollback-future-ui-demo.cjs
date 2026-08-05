const fs = require("fs");
const path = require("path");

const projectRoot = process.cwd();
const backupsRoot = path.join(projectRoot, ".aydemir-backups");

if (!fs.existsSync(backupsRoot)) {
  console.error("Yedek klasörü bulunamadı.");
  process.exit(1);
}

const backupFolders = fs
  .readdirSync(backupsRoot)
  .filter((name) => name.startsWith("future-ui-demo-"))
  .sort()
  .reverse();

if (backupFolders.length === 0) {
  console.error("Gelecek arayüz denemesi için yedek bulunamadı.");
  process.exit(1);
}

const backupRoot = path.join(backupsRoot, backupFolders[0]);
const manifestPath = path.join(backupRoot, "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

for (const relativePath of manifest.files) {
  const backupFile = path.join(backupRoot, relativePath);
  const targetFile = path.join(projectRoot, relativePath);

  if (fs.existsSync(backupFile)) {
    fs.mkdirSync(path.dirname(targetFile), { recursive: true });
    fs.copyFileSync(backupFile, targetFile);
  } else {
    fs.rmSync(targetFile, { force: true });
  }
}

fs.rmSync(
  path.join(projectRoot, ".next"),
  {
    recursive: true,
    force: true,
  },
);

console.log("");
console.log("GELECEK ARAYÜZ DENEMESİ GERİ ALINDI.");
console.log("");
