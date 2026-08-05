const fs = require("fs");
const path = require("path");

const projectRoot = process.cwd();
const packageRoot = __dirname;

if (!fs.existsSync(path.join(projectRoot, "package.json"))) {
  console.error("");
  console.error(
    "HATA: Komutu package.json dosyasının bulunduğu proje klasöründe çalıştırın.",
  );
  process.exit(1);
}

function pad(value) {
  return String(value).padStart(2, "0");
}

const now = new Date();
const stamp =
  `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-` +
  `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

const manifestPath = path.join(
  projectRoot,
  ".aydemir-v3-request-center.json",
);

const trackedFiles = [
  "src/components/admin/AdminShell.tsx",
  "src/app/yonetim/page.tsx",
  "src/app/globals.css",
  "supabase/schema.sql",
  "src/lib/requestTypes.ts",
  "src/lib/requestMatching.ts",
  "src/lib/requestQuickParser.ts",
  "src/components/admin/RequestCenter.tsx",
  "src/components/admin/RequestDetailManager.tsx",
  "src/app/yonetim/talepler/page.tsx",
  "src/app/yonetim/talepler/[id]/page.tsx",
  "supabase/aydemir-v3-talep-merkezi.sql",
];

let backupRoot;
let tracked;
let existingManifest = null;

if (fs.existsSync(manifestPath)) {
  existingManifest = JSON.parse(
    fs.readFileSync(
      manifestPath,
      "utf8",
    ),
  );

  backupRoot =
    existingManifest.backupRoot;

  tracked =
    existingManifest.tracked;
} else {
  backupRoot = path.join(
    projectRoot,
    ".aydemir-backups",
    `v3-talep-merkezi-${stamp}`,
  );

  tracked = trackedFiles.map((relativePath) => {
    const target = path.join(projectRoot, relativePath);
    const existed = fs.existsSync(target);

    if (existed) {
      const backupTarget = path.join(
        backupRoot,
        relativePath,
      );

      fs.mkdirSync(
        path.dirname(backupTarget),
        {
          recursive: true,
        },
      );

      fs.copyFileSync(
        target,
        backupTarget,
      );
    }

    return {
      relativePath,
      existed,
    };
  });
}

function copyDirectory(source, target) {
  fs.mkdirSync(target, {
    recursive: true,
  });

  for (const entry of fs.readdirSync(source, {
    withFileTypes: true,
  })) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else {
      fs.mkdirSync(
        path.dirname(targetPath),
        {
          recursive: true,
        },
      );

      fs.copyFileSync(
        sourcePath,
        targetPath,
      );
    }
  }
}

function removeMarkedBlock(
  source,
  marker,
  prefix,
) {
  const escaped = marker.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );

  const pattern = new RegExp(
    `\\n?${prefix}${escaped}[\\s\\S]*?(?=\\n(?:\\/\\* AYDEMIR|-- AYDEMIR)|$)`,
    "g",
  );

  return source.replace(
    pattern,
    "",
  );
}

console.log("");
console.log("AYDEMİR V3 TALEP MERKEZİ KURULUYOR");
console.log("-----------------------------------");
console.log(`Güvenli yedek: ${backupRoot}`);

if (existingManifest) {
  console.log(
    "Mevcut ilk kurulum yedeği korundu.",
  );
}

console.log("");

copyDirectory(
  path.join(packageRoot, "payload"),
  projectRoot,
);

/* NAVİGASYONA TALEPLER EKLE */
const adminShellPath = path.join(
  projectRoot,
  "src",
  "components",
  "admin",
  "AdminShell.tsx",
);

let adminShell = fs.readFileSync(
  adminShellPath,
  "utf8",
);

if (
  !adminShell.includes(
    'href: "/yonetim/talepler"',
  )
) {
  const needle =
    '  { href: "/yonetim/hizli-ilan", label: "Hızlı Giriş", icon: "✦" },\n';

  if (!adminShell.includes(needle)) {
    throw new Error(
      "AdminShell menü yapısı bulunamadı. Kurulum durduruldu.",
    );
  }

  adminShell = adminShell.replace(
    needle,
    needle +
      '  { href: "/yonetim/talepler", label: "Talepler", icon: "◎" },\n',
  );

  fs.writeFileSync(
    adminShellPath,
    adminShell,
    "utf8",
  );
}

/* YÖNETİM ANA SAYFASINA TALEP KARTI EKLE */
const dashboardPath = path.join(
  projectRoot,
  "src",
  "app",
  "yonetim",
  "page.tsx",
);

let dashboard = fs.readFileSync(
  dashboardPath,
  "utf8",
);

if (
  !dashboard.includes(
    'href="/yonetim/talepler"',
  )
) {
  const needle = `        <Link
          href="/yonetim/ilanlar"
          className="ap-command-card ap-glass"
        >`;

  const card = `        <Link
          href="/yonetim/talepler"
          className="ap-command-card ap-command-card-demand ap-glass"
        >
          <span className="ap-command-icon">
            ◎
          </span>

          <div>
            <p className="ap-kicker">
              TALEP MOTORU
            </p>

            <h2>Talebi Eşleştir</h2>

            <p>
              Müşteri talebini kaydedin;
              uygun ilanlar otomatik
              sıralansın.
            </p>
          </div>

          <b>↗</b>
        </Link>

`;

  if (!dashboard.includes(needle)) {
    throw new Error(
      "Yönetim paneli kart alanı bulunamadı. Kurulum durduruldu.",
    );
  }

  dashboard = dashboard.replace(
    needle,
    card + needle,
  );

  fs.writeFileSync(
    dashboardPath,
    dashboard,
    "utf8",
  );
}

/* PREMIUM CSS EKLE */
const globalsPath = path.join(
  projectRoot,
  "src",
  "app",
  "globals.css",
);

let globals = fs.readFileSync(
  globalsPath,
  "utf8",
);

globals = removeMarkedBlock(
  globals,
  "AYDEMIR V3 REQUEST CENTER",
  "\\/\\* ",
);

const cssPatch = fs.readFileSync(
  path.join(
    packageRoot,
    "talep-merkezi.css",
  ),
  "utf8",
);

fs.writeFileSync(
  globalsPath,
  globals.trimEnd() +
    `\n\n${cssPatch.trim()}\n`,
  "utf8",
);

/* SQL DOSYASINI ANA ŞEMAYA EKLE */
const schemaPath = path.join(
  projectRoot,
  "supabase",
  "schema.sql",
);

let schema = fs.existsSync(schemaPath)
  ? fs.readFileSync(
      schemaPath,
      "utf8",
    )
  : "";

schema = removeMarkedBlock(
  schema,
  "AYDEMIR V3 TALEP MERKEZI",
  "-- ",
);

const sqlPatch = fs.readFileSync(
  path.join(
    packageRoot,
    "aydemir-v3-talep-merkezi.sql",
  ),
  "utf8",
);

fs.mkdirSync(
  path.dirname(schemaPath),
  {
    recursive: true,
  },
);

fs.writeFileSync(
  schemaPath,
  schema.trimEnd() +
    `\n\n${sqlPatch.trim()}\n`,
  "utf8",
);

if (!existingManifest) {
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        installedAt:
          now.toISOString(),
        backupRoot,
        tracked,
      },
      null,
      2,
    ),
    "utf8",
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

console.log("✓ Talep Merkezi sayfası eklendi");
console.log("✓ Akıllı talep çözümleme eklendi");
console.log("✓ Otomatik ilan eşleştirme eklendi");
console.log("✓ Tek tıkla müşteri sunumu eklendi");
console.log("✓ Görüşme notu ve takip tarihi eklendi");
console.log("✓ Yönetim menüsü ve ana panel güncellendi");
console.log("");
console.log("ŞİMDİ SUPABASE SQL ADIMINI TAMAMLAYIN:");
console.log(
  path.join(
    projectRoot,
    "supabase",
    "aydemir-v3-talep-merkezi.sql",
  ),
);
console.log("");
console.log(
  "SQL çalıştırıldıktan sonra npm.cmd run build ve npm.cmd run dev komutlarını kullanın.",
);
console.log("");
console.log(
  "Geri dönüş komutu: node .\\rollback-v3-request-center.cjs",
);
console.log("");
