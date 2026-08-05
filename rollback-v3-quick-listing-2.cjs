const fs = require("fs");
const path = require("path");

const projectRoot = process.cwd();

const backupsRoot =
  path.join(
    projectRoot,
    ".aydemir-backups",
  );

if (
  !fs.existsSync(backupsRoot)
) {
  console.error(
    "Yedek klasörü bulunamadı.",
  );
  process.exit(1);
}

const backupFolders =
  fs.readdirSync(backupsRoot)
    .filter((name) =>
      name.startsWith(
        "hizli-ilan-2-",
      ),
    )
    .sort()
    .reverse();

if (
  backupFolders.length === 0
) {
  console.error(
    "Hızlı İlan 2.0 yedeği bulunamadı.",
  );
  process.exit(1);
}

const backupRoot =
  path.join(
    backupsRoot,
    backupFolders[0],
  );

const manifestPath =
  path.join(
    backupRoot,
    "manifest.json",
  );

if (
  !fs.existsSync(manifestPath)
) {
  console.error(
    "Yedek manifesti bulunamadı.",
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

const allFiles = [
  ...manifest.replacementFiles,
  manifest.cssTargetRelative,
];

for (
  const relativePath
  of allFiles
) {
  const backupFile =
    path.join(
      backupRoot,
      relativePath,
    );

  const targetFile =
    path.join(
      projectRoot,
      relativePath,
    );

  if (
    fs.existsSync(backupFile)
  ) {
    fs.mkdirSync(
      path.dirname(
        targetFile,
      ),
      {
        recursive: true,
      },
    );

    fs.copyFileSync(
      backupFile,
      targetFile,
    );
  } else if (
    manifest.existedBefore[
      relativePath
    ] === false
  ) {
    fs.rmSync(
      targetFile,
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

console.log("");
console.log(
  "HIZLI İLAN 2.0 GERİ ALINDI.",
);
console.log(
  "Kurulum öncesindeki dosyalar geri getirildi.",
);
console.log("");
