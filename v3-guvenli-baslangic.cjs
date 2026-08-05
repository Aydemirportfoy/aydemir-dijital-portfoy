const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const projectRoot = process.cwd();
const packageJson = path.join(projectRoot, "package.json");

if (!fs.existsSync(packageJson)) {
  console.error("");
  console.error("HATA: Bu komutu package.json dosyasının bulunduğu proje klasöründe çalıştırın.");
  process.exit(1);
}

function pad(value) {
  return String(value).padStart(2, "0");
}

const now = new Date();
const stamp =
  `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-` +
  `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

const parentDir = path.dirname(projectRoot);
const backupsRoot = path.join(parentDir, "aydemir-portfoy-yedekleri");
const backupDir = path.join(backupsRoot, `v3-oncesi-${stamp}`);

fs.mkdirSync(backupDir, { recursive: true });

function run(command, args, options = {}) {
  const result = cp.spawnSync(command, args, {
    cwd: projectRoot,
    encoding: "utf8",
    shell: false,
    ...options,
  });

  return {
    ok: result.status === 0,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    status: result.status,
  };
}

function commandExists(command, args = ["--version"]) {
  const result = cp.spawnSync(command, args, {
    encoding: "utf8",
    shell: false,
  });
  return result.status === 0;
}

console.log("");
console.log("AYDEMİR PORTFÖY - GÜVENLİ V3 BAŞLANGICI");
console.log("-----------------------------------------");
console.log(`Yedek klasörü: ${backupDir}`);
console.log("");

/* 1) GIT GERİ DÖNÜŞ NOKTASI */
let gitCommit = "Git bilgisi alınamadı.";
let gitBranch = "Git dalı oluşturulamadı.";
let gitTag = "Git etiketi oluşturulamadı.";

if (commandExists("git", ["--version"])) {
  const inside = run("git", ["rev-parse", "--is-inside-work-tree"]);

  if (inside.ok && inside.stdout.trim() === "true") {
    const commitResult = run("git", ["rev-parse", "HEAD"]);
    const currentBranch = run("git", ["branch", "--show-current"]);
    const statusResult = run("git", ["status", "--porcelain"]);

    if (commitResult.ok) {
      gitCommit = commitResult.stdout.trim();
    }

    const backupBranch = `backup/v3-oncesi-${stamp}`;
    const branchResult = run("git", ["branch", backupBranch, "HEAD"]);

    if (branchResult.ok) {
      gitBranch = backupBranch;
      console.log(`✓ Git yedek dalı oluşturuldu: ${backupBranch}`);
    } else {
      gitBranch = `Oluşturulamadı: ${branchResult.stderr.trim()}`;
      console.log("! Git yedek dalı oluşturulamadı.");
    }

    const tagName = `v3-oncesi-${stamp}`;
    const tagResult = run("git", [
      "tag",
      "-a",
      tagName,
      "-m",
      "Akıllı ilan ve talep sistemi öncesi güvenli geri dönüş noktası",
    ]);

    if (tagResult.ok) {
      gitTag = tagName;
      console.log(`✓ Git geri dönüş etiketi oluşturuldu: ${tagName}`);
    } else {
      gitTag = `Oluşturulamadı: ${tagResult.stderr.trim()}`;
      console.log("! Git geri dönüş etiketi oluşturulamadı.");
    }

    fs.writeFileSync(
      path.join(backupDir, "GIT-DURUMU.txt"),
      [
        `Tarih: ${now.toLocaleString("tr-TR")}`,
        `Mevcut dal: ${currentBranch.stdout.trim() || "bilinmiyor"}`,
        `Commit: ${gitCommit}`,
        `Yedek dalı: ${gitBranch}`,
        `Yedek etiketi: ${gitTag}`,
        "",
        "Çalışma alanı durumu:",
        statusResult.stdout.trim() || "Temiz",
        "",
      ].join("\n"),
      "utf8",
    );
  } else {
    console.log("! Bu klasör bir Git deposu olarak görünmüyor.");
  }
} else {
  console.log("! Git bulunamadı; dosya yedeği yine oluşturulacak.");
}

/* 2) ÖZEL ENV YEDEĞİ - YÜKLENECEK ZIP'E GİRMEZ */
const envPath = path.join(projectRoot, ".env.local");
if (fs.existsSync(envPath)) {
  const privateDir = path.join(backupDir, "OZEL-YEDEK-YUKLEME");
  fs.mkdirSync(privateDir, { recursive: true });
  fs.copyFileSync(envPath, path.join(privateDir, ".env.local"));
  fs.writeFileSync(
    path.join(privateDir, "UYARI.txt"),
    "Bu klasör özel bağlantı bilgileri içerir. İnternete veya sohbete yüklemeyin.\n",
    "utf8",
  );
  console.log("✓ .env.local yalnızca yerel özel yedek klasörüne kopyalandı.");
} else {
  console.log("! .env.local bulunamadı; bu adım atlandı.");
}

/* 3) KOD YEDEĞİ VE YÜKLEMEYE UYGUN ZIP */
if (!commandExists("tar.exe", ["--version"])) {
  console.error("");
  console.error("HATA: Windows tar.exe bulunamadı. ZIP oluşturulamadı.");
  process.exit(1);
}

const safeBackupZip = path.join(
  backupDir,
  `AYDEMIR-KOD-YEDEGI-${stamp}.zip`,
);

const uploadZip = path.join(
  parentDir,
  `aydemir-portfoy-v3-kaynak-${stamp}.zip`,
);

const excludes = [
  "--exclude=node_modules",
  "--exclude=.next",
  "--exclude=.git",
  "--exclude=.env.local",
  "--exclude=.aydemir-backups",
  "--exclude=aydemir-portfoy-yedekleri",
];

function createZip(outputPath) {
  const result = cp.spawnSync(
    "tar.exe",
    [
      "-a",
      "-c",
      "-f",
      outputPath,
      ...excludes,
      ".",
    ],
    {
      cwd: projectRoot,
      stdio: "inherit",
      shell: false,
    },
  );

  return result.status === 0;
}

console.log("");
console.log("Kod yedeği oluşturuluyor...");
if (!createZip(safeBackupZip)) {
  console.error("HATA: Kod yedeği oluşturulamadı.");
  process.exit(1);
}
console.log(`✓ Kod yedeği hazır: ${safeBackupZip}`);

console.log("");
console.log("Sohbete yüklenebilecek güvenli kaynak ZIP hazırlanıyor...");
if (!createZip(uploadZip)) {
  console.error("HATA: Yükleme ZIP'i oluşturulamadı.");
  process.exit(1);
}
console.log(`✓ Yükleme ZIP'i hazır: ${uploadZip}`);

/* 4) GERİ YÜKLEME TALİMATI */
const restoreText = `
AYDEMİR PORTFÖY - GERİ YÜKLEME BİLGİSİ

Oluşturulma tarihi:
${now.toLocaleString("tr-TR")}

Git commit:
${gitCommit}

Git yedek dalı:
${gitBranch}

Git etiketi:
${gitTag}

KOD YEDEĞİ:
${safeBackupZip}

ÖZEL ENV YEDEĞİ:
${fs.existsSync(envPath) ? path.join(backupDir, "OZEL-YEDEK-YUKLEME", ".env.local") : "Bulunamadı"}

GIT İLE GERİ DÖNME:
1. Terminali proje klasöründe açın.
2. git status
3. git switch ${typeof gitBranch === "string" && gitBranch.startsWith("backup/") ? gitBranch : "<yedek-dal-adi>"}

NOT:
- Yükleme için hazırlanan ZIP içinde .env.local, node_modules, .next ve .git yoktur.
- Eski çalışan sürüm Git dalı, Git etiketi ve yerel ZIP ile korunmuştur.
- Bu işlem uygulama dosyalarını değiştirmez.
`.trimStart();

fs.writeFileSync(
  path.join(backupDir, "GERI-YUKLEME.txt"),
  restoreText,
  "utf8",
);

console.log("");
console.log("=========================================");
console.log("GÜVENLİ YEDEK TAMAMLANDI.");
console.log("UYGULAMA DOSYALARINDA HİÇBİR DEĞİŞİKLİK YAPILMADI.");
console.log("");
console.log("ŞİMDİ SOHBETE ŞU ZIP DOSYASINI YÜKLEYİN:");
console.log(uploadZip);
console.log("=========================================");
console.log("");
