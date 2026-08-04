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
  console.error(
    "HATA: Komutu package.json dosyasının bulunduğu proje klasöründe çalıştırın.",
  );
  process.exit(1);
}

const timestamp =
  new Date()
    .toISOString()
    .replace(/[:.]/g, "-");

const backupRoot =
  path.join(
    projectRoot,
    ".aydemir-backups",
    `card-ratio-title-${timestamp}`,
  );

function backupFile(
  filePath,
  relativePath,
) {
  if (
    !fs.existsSync(filePath)
  ) {
    return;
  }

  const backupPath =
    path.join(
      backupRoot,
      relativePath,
    );

  fs.mkdirSync(
    path.dirname(
      backupPath,
    ),
    {
      recursive: true,
    },
  );

  fs.copyFileSync(
    filePath,
    backupPath,
  );
}

const managerRelative =
  "src/components/admin/ListingsManager.tsx";

const managerTarget =
  path.join(
    projectRoot,
    managerRelative,
  );

backupFile(
  managerTarget,
  managerRelative,
);

let manager =
  fs.readFileSync(
    managerTarget,
    "utf8",
  );

const locationBlock = `                          {mapLink ? (
                            <a
                              href={mapLink}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Konumu Aç
                            </a>
                          ) : (
                            <span className="is-disabled">
                              Konum girilmedi
                            </span>
                          )}

`;

if (
  manager.includes(
    locationBlock,
  )
) {
  manager =
    manager.replace(
      locationBlock,
      "",
    );

  fs.writeFileSync(
    managerTarget,
    manager,
    "utf8",
  );

  console.log(
    "Üç nokta menüsünden konum kaldırıldı.",
  );
} else {
  console.log(
    "Üç nokta menüsünde konum zaten bulunmuyor.",
  );
}

const detailRelative =
  "src/app/ilan/[slug]/page.tsx";

const detailTarget =
  path.join(
    projectRoot,
    detailRelative,
  );

backupFile(
  detailTarget,
  detailRelative,
);

let detail =
  fs.readFileSync(
    detailTarget,
    "utf8",
  );

if (
  detail.includes(
    'className="ap-detail-title"',
  )
) {
  detail =
    detail.replace(
      'className="ap-detail-title"',
      'className="ap-detail-title ap-detail-title-balanced"',
    );

  fs.writeFileSync(
    detailTarget,
    detail,
    "utf8",
  );

  console.log(
    "İlan detay başlığı dengeli sınıfa geçirildi.",
  );
} else if (
  detail.includes(
    "ap-detail-title-balanced",
  )
) {
  console.log(
    "İlan detay başlığı daha önce güncellenmiş.",
  );
} else {
  console.error(
    "UYARI: İlan detay başlığı bulunamadı.",
  );
}

const cssRelative =
  "src/app/globals.css";

const cssTarget =
  path.join(
    projectRoot,
    cssRelative,
  );

backupFile(
  cssTarget,
  cssRelative,
);

const cssPatch =
  fs.readFileSync(
    path.join(
      __dirname,
      "card-proportion-detail-title.css",
    ),
    "utf8",
  );

const marker =
  "AYDEMIR V2 CARD PROPORTION AND DETAIL TITLE";

const currentCss =
  fs.readFileSync(
    cssTarget,
    "utf8",
  );

if (
  !currentCss.includes(
    marker,
  )
) {
  fs.appendFileSync(
    cssTarget,
    `\n\n${cssPatch}\n`,
    "utf8",
  );

  console.log(
    "Kart oranları ve başlık ölçüleri güncellendi.",
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

console.log("");
console.log(
  "KART ORANLARI VE İLAN DETAY BAŞLIĞI TAMAMLANDI.",
);
