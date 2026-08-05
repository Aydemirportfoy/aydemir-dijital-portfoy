const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const projectRoot = process.cwd();
const packageRoot = __dirname;
const payloadRoot = path.join(
  packageRoot,
  "payload",
);

const beforeHashes =
  {
  "src/components/admin/ListingEditor.tsx": "f764fca5fe3fc1ae971e23a0440ab1d0fe3a2027694ef3e31af9d7beffeaf99f",
  "src/components/admin/AdminShell.tsx": "43844c7618299832d1818390ed6003da132c5bca409f6f8a8b5a313147b4ccdd",
  "src/app/yonetim/page.tsx": "80b1d28f775278207a06f48955471b9f247c156e43c874b6d04b16339f6485e8",
  "src/app/globals.css": "3d9846c3d3d8d3b6177b932b5ff657696b9b3961f3e541c8cb17ae199ea5a82e"
};

const afterHashes =
  {
  "src/components/admin/ListingEditor.tsx": "56d5aa5ffd0d49f22af477d706844c2c6e7b3ee64baac1c0418ee99b679e7548",
  "src/components/admin/AdminShell.tsx": "9c1f3492980088935348e7c95b22b688100ed137ebc9605dea7fc3f9bc39efde",
  "src/app/yonetim/page.tsx": "a428faf6da99ac60694c8bd21a74e7302246e279969e3b2bab3687016c7f3222",
  "src/app/globals.css": "54ad70c49b37e185ebaa672e1d6a640a27ed4a541c5f5a1e973058d57bf70990",
  "src/lib/sahibindenParser.ts": "021f3b6b6487c7fb81dd8a8b413acdc69a65e6e11bd26f873fbe84b31da61f69",
  "src/components/admin/QuickListingImporter.tsx": "5f9bc7e51097cbea977ac230d66a84519cf06cd494e204ca3a9cccff4fff7c32",
  "src/app/yonetim/hizli-ilan/page.tsx": "1643cdf78eb55e8961a449e8bdf183f2e318924070e07c48fc7dd52c88ac7d17"
};

const targets = Object.keys(
  afterHashes,
);

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

function hashFile(filePath) {
  return crypto
    .createHash("sha256")
    .update(
      fs.readFileSync(
        filePath,
      ),
    )
    .digest("hex");
}

function ensureParent(filePath) {
  fs.mkdirSync(
    path.dirname(filePath),
    {
      recursive: true,
    },
  );
}

function pad(value) {
  return String(value).padStart(2, "0");
}

const now = new Date();

const stamp =
  `${now.getFullYear()}` +
  `${pad(now.getMonth() + 1)}` +
  `${pad(now.getDate())}-` +
  `${pad(now.getHours())}` +
  `${pad(now.getMinutes())}` +
  `${pad(now.getSeconds())}`;

let allAlreadyInstalled = true;
const problems = [];

for (const relativePath of targets) {
  const currentPath =
    path.join(
      projectRoot,
      relativePath,
    );

  const before =
    beforeHashes[relativePath];

  const after =
    afterHashes[relativePath];

  if (
    !fs.existsSync(
      currentPath,
    )
  ) {
    if (before) {
      problems.push(
        `${relativePath} bulunamadı.`,
      );
    }

    allAlreadyInstalled = false;
    continue;
  }

  const currentHash =
    hashFile(currentPath);

  if (
    currentHash === after
  ) {
    continue;
  }

  allAlreadyInstalled = false;

  if (
    before &&
    currentHash === before
  ) {
    continue;
  }

  if (!before) {
    problems.push(
      `${relativePath} dosyası daha önce yoktu ancak şimdi farklı bir içerikle mevcut.`,
    );
    continue;
  }

  problems.push(
    `${relativePath} yüklenen kaynak ZIP'ten sonra değiştirilmiş görünüyor.`,
  );
}

if (allAlreadyInstalled) {
  console.log("");
  console.log(
    "V3 Akıllı Hızlı İlan Girişi zaten kurulu.",
  );
  process.exit(0);
}

if (problems.length > 0) {
  console.error("");
  console.error(
    "GÜVENLİK NEDENİYLE KURULUM DURDURULDU.",
  );
  console.error(
    "Mevcut dosyalardan bazıları yüklenen kaynak sürümle eşleşmiyor:",
  );

  for (const problem of problems) {
    console.error(
      `- ${problem}`,
    );
  }

  console.error("");
  console.error(
    "Hiçbir dosya değiştirilmedi.",
  );
  process.exit(1);
}

const backupRoot =
  path.join(
    projectRoot,
    ".aydemir-backups",
    `v3-smart-entry-${stamp}`,
  );

fs.mkdirSync(
  backupRoot,
  {
    recursive: true,
  },
);

const manifest = {
  createdAt:
    now.toISOString(),
  targets: [],
};

for (const relativePath of targets) {
  const currentPath =
    path.join(
      projectRoot,
      relativePath,
    );

  const existed =
    fs.existsSync(
      currentPath,
    );

  manifest.targets.push({
    relativePath,
    existed,
  });

  if (!existed) {
    continue;
  }

  const backupPath =
    path.join(
      backupRoot,
      relativePath,
    );

  ensureParent(
    backupPath,
  );

  fs.copyFileSync(
    currentPath,
    backupPath,
  );
}

fs.writeFileSync(
  path.join(
    backupRoot,
    "manifest.json",
  ),
  JSON.stringify(
    manifest,
    null,
    2,
  ),
  "utf8",
);

for (const relativePath of targets) {
  const sourcePath =
    path.join(
      payloadRoot,
      relativePath,
    );

  const targetPath =
    path.join(
      projectRoot,
      relativePath,
    );

  if (
    !fs.existsSync(
      sourcePath,
    )
  ) {
    console.error(
      `HATA: Paket dosyası eksik: ${relativePath}`,
    );
    process.exit(1);
  }

  ensureParent(
    targetPath,
  );

  fs.copyFileSync(
    sourcePath,
    targetPath,
  );
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

fs.writeFileSync(
  path.join(
    projectRoot,
    ".aydemir-v3-smart-entry.json",
  ),
  JSON.stringify(
    {
      installedAt:
        now.toISOString(),
      backupRoot,
      version:
        "v3-smart-entry-1",
    },
    null,
    2,
  ),
  "utf8",
);

console.log("");
console.log(
  "V3 AKILLI HIZLI İLAN GİRİŞİ KURULDU.",
);
console.log(
  "Mevcut ilan, sunum ve Supabase verilerine dokunulmadı.",
);
console.log(
  `Yerel geri dönüş yedeği: ${backupRoot}`,
);
console.log("");
console.log(
  "Şimdi şu komutları çalıştırın:",
);
console.log(
  "npm.cmd run build",
);
console.log(
  "npm.cmd run dev",
);
console.log("");
console.log(
  "Geri almak gerekirse:",
);
console.log(
  "node .\\rollback-v3-smart-entry.cjs",
);
