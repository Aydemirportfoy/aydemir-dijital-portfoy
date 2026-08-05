const fs = require("fs");
const path = require("path");

const projectRoot = process.cwd();

if (!fs.existsSync(path.join(projectRoot, "package.json"))) {
  console.error(
    "HATA: Komutu package.json dosyasının bulunduğu proje klasöründe çalıştırın.",
  );
  process.exit(1);
}

const manifestPath = path.join(
  projectRoot,
  ".aydemir-v3-request-center.json",
);

if (!fs.existsSync(manifestPath)) {
  console.error(
    "HATA: Talep Merkezi kurulum kaydı bulunamadı.",
  );
  process.exit(1);
}

const manifest = JSON.parse(
  fs.readFileSync(
    manifestPath,
    "utf8",
  ),
);

for (const item of manifest.tracked) {
  const target = path.join(
    projectRoot,
    item.relativePath,
  );

  const backup = path.join(
    manifest.backupRoot,
    item.relativePath,
  );

  if (item.existed) {
    if (!fs.existsSync(backup)) {
      throw new Error(
        `Yedek dosya bulunamadı: ${backup}`,
      );
    }

    fs.mkdirSync(
      path.dirname(target),
      {
        recursive: true,
      },
    );

    fs.copyFileSync(
      backup,
      target,
    );
  } else {
    fs.rmSync(
      target,
      {
        force: true,
        recursive: true,
      },
    );
  }
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

fs.rmSync(
  manifestPath,
  {
    force: true,
  },
);

console.log("");
console.log(
  "TALEP MERKEZİ KODLARI GERİ ALINDI.",
);
console.log(
  "Not: Supabase tabloları silinmedi; veriler güvenli şekilde korunuyor.",
);
console.log(
  "Şimdi npm.cmd run build ve npm.cmd run dev çalıştırın.",
);
console.log("");
