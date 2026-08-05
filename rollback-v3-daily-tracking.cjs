const fs = require("fs");
const path = require("path");

const projectRoot =
  process.cwd();

const markerFile =
  path.join(
    projectRoot,
    ".aydemir-v3-daily-tracking.json",
  );

if (
  !fs.existsSync(
    markerFile,
  )
) {
  console.error("");
  console.error(
    "Geri dönüş bilgisi bulunamadı. Dosyalar değiştirilmedi.",
  );
  process.exit(1);
}

const manifest =
  JSON.parse(
    fs.readFileSync(
      markerFile,
      "utf8",
    ),
  );

for (
  const file
  of manifest.files
) {
  const target =
    path.join(
      projectRoot,
      file.relativePath,
    );

  const backup =
    path.join(
      manifest.backupRoot,
      file.relativePath,
    );

  if (
    file.existed
  ) {
    if (
      !fs.existsSync(
        backup,
      )
    ) {
      console.error(
        `HATA: Yedek dosya bulunamadı: ${file.relativePath}`,
      );
      process.exit(1);
    }

    fs.mkdirSync(
      path.dirname(
        target,
      ),
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
        recursive: true,
        force: true,
      },
    );
  }
}

fs.rmSync(
  markerFile,
  {
    force: true,
  },
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
  "GÜNLÜK TAKİP MERKEZİ DOSYALARI GERİ ALINDI.",
);
console.log(
  "Veritabanındaki ek takip kolonları silinmedi; mevcut verilere zarar verilmedi.",
);
console.log(
  "npm.cmd run build ve npm.cmd run dev komutlarını çalıştırın.",
);
