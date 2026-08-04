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
    `apple-detail-${timestamp}`,
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

/* FOTOĞRAF ÜSTÜ YAZIYI SADECE KOMİSYONSUZ YAP */
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

const badgePattern =
  /(<span className="ap-detail-commission-badge">\s*)Komisyonsuz Firma Satışı(\s*<\/span>)/;

if (
  badgePattern.test(
    detail,
  )
) {
  detail =
    detail.replace(
      badgePattern,
      "$1Komisyonsuz$2",
    );

  fs.writeFileSync(
    detailTarget,
    detail,
    "utf8",
  );

  console.log(
    "Fotoğraf üstündeki yazı Komisyonsuz olarak değiştirildi.",
  );
} else if (
  /<span className="ap-detail-commission-badge">\s*Komisyonsuz\s*<\/span>/.test(
    detail,
  )
) {
  console.log(
    "Fotoğraf üstündeki yazı zaten Komisyonsuz.",
  );
} else {
  console.log(
    "UYARI: Komisyonsuz rozet metni bulunamadı; CSS yine uygulandı.",
  );
}

/* ESKİ BOYUT VE HİZA BLOKLARINI TEMİZLE */
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

let css =
  fs.readFileSync(
    cssTarget,
    "utf8",
  );

const removeMarkers = [
  "AYDEMIR V2 DETAIL ALIGNMENT AND INFO READABILITY",
  "AYDEMIR V2 SAFE DETAIL ALIGNMENT FIX",
  "AYDEMIR V2 BALANCED DETAIL PROPORTION",
  "AYDEMIR V2 COMPACT LIQUID GLASS DETAIL ALIGNMENT",
  "AYDEMIR V2 DETAIL DESKTOP 70 MOBILE NATURAL",
  "AYDEMIR V2 COMMISSION BADGE POSITION 3D",
  "AYDEMIR V2 APPLE DETAIL SIZE AND COMMISSION BADGE",
];

for (
  const marker
  of removeMarkers
) {
  const escaped =
    marker.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );

  const pattern =
    new RegExp(
      `\\n?\\/\\* ${escaped} \\*\\/[\\s\\S]*?(?=\\n\\/\\* AYDEMIR V2|$)`,
      "g",
    );

  css =
    css.replace(
      pattern,
      "",
    );
}

const patch =
  fs.readFileSync(
    path.join(
      __dirname,
      "apple-detail-size-commission.css",
    ),
    "utf8",
  );

fs.writeFileSync(
  cssTarget,
  css.trimEnd() +
    `\n\n${patch}\n`,
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
  "APPLE TARZI DETAY BOYUTU VE KOMİSYONSUZ ROZETİ TAMAMLANDI.",
);
console.log(
  "Supabase verileri değiştirilmedi.",
);
