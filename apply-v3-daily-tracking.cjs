const fs = require("fs");
const path = require("path");

const projectRoot =
  process.cwd();

const packageJson =
  path.join(
    projectRoot,
    "package.json",
  );

if (
  !fs.existsSync(
    packageJson,
  )
) {
  console.error("");
  console.error(
    "HATA: Komutu package.json dosyasının bulunduğu proje klasöründe çalıştırın.",
  );
  process.exit(1);
}

const markerFile =
  path.join(
    projectRoot,
    ".aydemir-v3-daily-tracking.json",
  );

if (
  fs.existsSync(
    markerFile,
  )
) {
  console.log("");
  console.log(
    "Günlük Takip Merkezi daha önce kurulmuş görünüyor.",
  );
  console.log(
    "Dosyalar değiştirilmedi.",
  );
  process.exit(0);
}

function pad(value) {
  return String(value)
    .padStart(
      2,
      "0",
    );
}

const now =
  new Date();

const stamp =
  `${now.getFullYear()}${pad(
    now.getMonth() + 1,
  )}${pad(
    now.getDate(),
  )}-` +
  `${pad(
    now.getHours(),
  )}${pad(
    now.getMinutes(),
  )}${pad(
    now.getSeconds(),
  )}`;

const backupRoot =
  path.join(
    projectRoot,
    ".aydemir-backups",
    `v3-daily-tracking-${stamp}`,
  );

fs.mkdirSync(
  backupRoot,
  {
    recursive: true,
  },
);

const payloadRoot =
  path.join(
    __dirname,
    "payload",
  );

const targets = [
  "src/lib/requestTypes.ts",
  "src/components/admin/TrackingCenter.tsx",
  "src/components/admin/AdminShell.tsx",
  "src/app/yonetim/page.tsx",
  "src/app/yonetim/takip/page.tsx",
  "supabase/aydemir-v3-gunluk-takip.sql",
  "SQL-TAKIP-KOPYALA.bat",
  "src/app/globals.css",
];

const manifest = {
  version:
    "aydemir-v3-daily-tracking",
  createdAt:
    now.toISOString(),
  backupRoot,
  files: [],
};

function backupTarget(
  relativePath,
) {
  const target =
    path.join(
      projectRoot,
      relativePath,
    );

  const existed =
    fs.existsSync(
      target,
    );

  manifest.files.push({
    relativePath,
    existed,
  });

  if (!existed) {
    return;
  }

  const backup =
    path.join(
      backupRoot,
      relativePath,
    );

  fs.mkdirSync(
    path.dirname(
      backup,
    ),
    {
      recursive: true,
    },
  );

  fs.copyFileSync(
    target,
    backup,
  );
}

for (
  const target
  of targets
) {
  backupTarget(
    target,
  );
}

const copyTargets = [
  "src/lib/requestTypes.ts",
  "src/components/admin/TrackingCenter.tsx",
  "src/components/admin/AdminShell.tsx",
  "src/app/yonetim/page.tsx",
  "src/app/yonetim/takip/page.tsx",
  "supabase/aydemir-v3-gunluk-takip.sql",
  "SQL-TAKIP-KOPYALA.bat",
];

for (
  const relativePath
  of copyTargets
) {
  const source =
    path.join(
      payloadRoot,
      relativePath,
    );

  const target =
    path.join(
      projectRoot,
      relativePath,
    );

  if (
    !fs.existsSync(
      source,
    )
  ) {
    console.error(
      `HATA: Paket dosyası bulunamadı: ${relativePath}`,
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
    source,
    target,
  );
}

const cssTarget =
  path.join(
    projectRoot,
    "src",
    "app",
    "globals.css",
  );

let css =
  fs.readFileSync(
    cssTarget,
    "utf8",
  );

const cssMarker =
  "AYDEMIR V3 DAILY TRACKING CENTER";

const escaped =
  cssMarker.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );

const existingBlock =
  new RegExp(
    `\\n?\\/\\* ${escaped} \\*\\/[\\s\\S]*$`,
  );

css =
  css.replace(
    existingBlock,
    "",
  );

const patch =
  fs.readFileSync(
    path.join(
      __dirname,
      "tracking-center.css",
    ),
    "utf8",
  );

fs.writeFileSync(
  cssTarget,
  css.trimEnd() +
    `\n\n${patch}\n`,
  "utf8",
);

fs.writeFileSync(
  markerFile,
  JSON.stringify(
    manifest,
    null,
    2,
  ),
  "utf8",
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
  "GÜNLÜK TAKİP MERKEZİ DOSYALARI KURULDU.",
);
console.log(
  "Mevcut sürüm yedeklendi:",
);
console.log(
  backupRoot,
);
console.log("");
console.log(
  "ŞİMDİ SQL-TAKIP-KOPYALA.bat DOSYASINA ÇİFT TIKLAYIN.",
);
console.log(
  "Sonra Supabase SQL Editor içinde Ctrl+A, Ctrl+V ve Run yapın.",
);
console.log("");
console.log(
  "Supabase verileri bu komut tarafından değiştirilmedi.",
);
