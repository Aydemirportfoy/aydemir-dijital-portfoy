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
    `commission-description-card-${timestamp}`,
  );

function backupFile(
  relativePath,
) {
  const target =
    path.join(
      projectRoot,
      relativePath,
    );

  if (
    !fs.existsSync(
      target,
    )
  ) {
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

const descriptionRelative =
  "src/components/CollapsibleDescription.tsx";

const descriptionTarget =
  path.join(
    projectRoot,
    descriptionRelative,
  );

backupFile(
  descriptionRelative,
);

fs.mkdirSync(
  path.dirname(
    descriptionTarget,
  ),
  {
    recursive: true,
  },
);

fs.copyFileSync(
  path.join(
    __dirname,
    "patch-files",
    descriptionRelative,
  ),
  descriptionTarget,
);

console.log(
  "Devamını Gör bileşeni yenilendi.",
);

const detailRelative =
  "src/app/ilan/[slug]/page.tsx";

const detailTarget =
  path.join(
    projectRoot,
    detailRelative,
  );

backupFile(
  detailRelative,
);

let detail =
  fs.readFileSync(
    detailTarget,
    "utf8",
  );

if (
  !detail.includes(
    "ap-detail-commission-badge",
  )
) {
  const mediaMarker =
    '<div className="ap-media-column">';

  if (
    !detail.includes(
      mediaMarker,
    )
  ) {
    console.error(
      "HATA: İlan detay galerisi bulunamadı.",
    );

    process.exit(1);
  }

  const commissionBadge = `${mediaMarker}
              {listing.commission_free ? (
                <span className="ap-detail-commission-badge">
                  Komisyonsuz Firma Satışı
                </span>
              ) : null}`;

  detail =
    detail.replace(
      mediaMarker,
      commissionBadge,
    );

  fs.writeFileSync(
    detailTarget,
    detail,
    "utf8",
  );

  console.log(
    "İlan detay galerisine Komisyonsuz etiketi eklendi.",
  );
} else {
  console.log(
    "Komisyonsuz etiketi daha önce eklenmiş.",
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
  cssRelative,
);

let currentCss =
  fs.readFileSync(
    cssTarget,
    "utf8",
  );

const marker =
  "AYDEMIR V2 COMMISSION DESCRIPTION CARD FINAL";

const escaped =
  marker.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );

const existingPattern =
  new RegExp(
    `\\n?\\/\\* ${escaped} \\*\\/[\\s\\S]*$`,
  );

currentCss =
  currentCss.replace(
    existingPattern,
    "",
  );

const cssPatch =
  fs.readFileSync(
    path.join(
      __dirname,
      "commission-description-card-final.css",
    ),
    "utf8",
  );

fs.writeFileSync(
  cssTarget,
  currentCss.trimEnd() +
    `\n\n${cssPatch}\n`,
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
  "KOMİSYONSUZ ETİKETİ, AÇIKLAMA BUTONU VE KART DÜZENİ TAMAMLANDI.",
);
console.log(
  "Supabase verilerine dokunulmadı.",
);
