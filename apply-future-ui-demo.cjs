const fs = require("fs");
const path = require("path");

const projectRoot = process.cwd();
const packageJson = path.join(projectRoot, "package.json");

if (!fs.existsSync(packageJson)) {
  console.error("");
  console.error("HATA: Komutu package.json dosyasının bulunduğu proje klasöründe çalıştırın.");
  process.exit(1);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(
  projectRoot,
  ".aydemir-backups",
  `future-ui-demo-${timestamp}`,
);

const files = [
  "src/app/deneme/gelecek-arayuz/page.tsx",
  "src/app/deneme/gelecek-arayuz/future-ui.module.css",
  "public/future-demo/future-building-1.svg",
  "public/future-demo/future-building-2.svg",
  "public/future-demo/future-building-3.svg",
];

function copyWithDirectories(source, target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

for (const relativePath of files) {
  const target = path.join(projectRoot, relativePath);

  if (fs.existsSync(target)) {
    copyWithDirectories(
      target,
      path.join(backupRoot, relativePath),
    );
  }

  copyWithDirectories(
    path.join(__dirname, relativePath),
    target,
  );
}

fs.writeFileSync(
  path.join(backupRoot, "manifest.json"),
  JSON.stringify(
    {
      createdAt: new Date().toISOString(),
      files,
    },
    null,
    2,
  ),
  "utf8",
);

fs.rmSync(
  path.join(projectRoot, ".next"),
  {
    recursive: true,
    force: true,
  },
);

console.log("");
console.log("GELECEK ARAYÜZ DENEMESİ KURULDU.");
console.log("Mevcut yönetim paneline, ilanlara, taleplere ve veritabanına dokunulmadı.");
console.log("");
console.log("AÇILACAK ADRES:");
console.log("http://localhost:3000/deneme/gelecek-arayuz");
console.log("");
