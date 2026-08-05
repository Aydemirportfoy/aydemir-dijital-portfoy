const fs = require("fs");
const path = require("path");

const projectRoot =
  process.cwd();

if (
  !fs.existsSync(
    path.join(
      projectRoot,
      "package.json",
    ),
  )
) {
  console.error("");
  console.error(
    "HATA: Komutu package.json dosyasının bulunduğu proje klasöründe çalıştırın.",
  );
  process.exit(1);
}

const backupsRoot =
  path.join(
    projectRoot,
    ".aydemir-backups",
  );

if (
  !fs.existsSync(
    backupsRoot,
  )
) {
  console.error(
    "HATA: Geri dönüş yedeği bulunamadı.",
  );
  process.exit(1);
}

const candidates =
  fs.readdirSync(
    backupsRoot,
    {
      withFileTypes: true,
    },
  )
    .filter(
      (entry) =>
        entry.isDirectory() &&
        entry.name.startsWith(
          "v3-smart-entry-",
        ),
    )
    .map((entry) => ({
      name:
        entry.name,
      path:
        path.join(
          backupsRoot,
          entry.name,
        ),
      time:
        fs.statSync(
          path.join(
            backupsRoot,
            entry.name,
          ),
        ).mtimeMs,
    }))
    .sort(
      (first, second) =>
        second.time -
        first.time,
    );

if (
  candidates.length === 0
) {
  console.error(
    "HATA: V3 Akıllı Giriş yedeği bulunamadı.",
  );
  process.exit(1);
}

const backup =
  candidates[0];

const manifestPath =
  path.join(
    backup.path,
    "manifest.json",
  );

if (
  !fs.existsSync(
    manifestPath,
  )
) {
  console.error(
    "HATA: Yedek manifesti bulunamadı.",
  );
  process.exit(1);
}

const manifest =
  JSON.parse(
    fs.readFileSync(
      manifestPath,
      "utf8",
    ),
  );

for (
  const item
  of manifest.targets
) {
  const targetPath =
    path.join(
      projectRoot,
      item.relativePath,
    );

  if (
    item.existed
  ) {
    const backupPath =
      path.join(
        backup.path,
        item.relativePath,
      );

    fs.mkdirSync(
      path.dirname(
        targetPath,
      ),
      {
        recursive: true,
      },
    );

    fs.copyFileSync(
      backupPath,
      targetPath,
    );
  } else {
    fs.rmSync(
      targetPath,
      {
        force: true,
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
  path.join(
    projectRoot,
    ".aydemir-v3-smart-entry.json",
  ),
  {
    force: true,
  },
);

console.log("");
console.log(
  "V3 Akıllı Hızlı İlan Girişi geri alındı.",
);
console.log(
  `Kullanılan yedek: ${backup.path}`,
);
console.log(
  "Supabase verileri değiştirilmedi.",
);
console.log("");
console.log(
  "Şimdi npm.cmd run build ve npm.cmd run dev çalıştırın.",
);
