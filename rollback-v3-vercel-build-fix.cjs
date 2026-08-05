const fs = require("fs");
const path = require("path");

const projectRoot = process.cwd();
const backupsRoot = path.join(projectRoot, ".aydemir-backups");

if (!fs.existsSync(backupsRoot)) {
  console.error("Yedek klasörü bulunamadı.");
  process.exit(1);
}

const folders = fs
  .readdirSync(backupsRoot)
  .filter((name) => name.startsWith("vercel-build-fix-"))
  .sort()
  .reverse();

if (folders.length === 0) {
  console.error("Vercel build düzeltmesi için yedek bulunamadı.");
  process.exit(1);
}

const backupRoot = path.join(backupsRoot, folders[0]);

function restoreFile(relativePath) {
  const backup = path.join(backupRoot, relativePath);
  const target = path.join(projectRoot, relativePath);

  if (!fs.existsSync(backup)) {
    return;
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(backup, target);
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

restoreFile("src/app/yonetim/talepler/[id]/page.tsx");
restoreFile("tsconfig.json");
restoreFile(".gitignore");

const payloadBackup = path.join(backupRoot, "payload");
const payloadTarget = path.join(projectRoot, "payload");

if (fs.existsSync(payloadBackup)) {
  fs.rmSync(payloadTarget, {
    recursive: true,
    force: true,
  });
  copyDirectory(payloadBackup, payloadTarget);
}

fs.rmSync(path.join(projectRoot, ".next"), {
  recursive: true,
  force: true,
});

console.log("");
console.log("VERCEL BUILD DÜZELTMESİ GERİ ALINDI.");
console.log("");
