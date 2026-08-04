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
    `delete-button-text-scale-${timestamp}`,
  );

function backupFile(
  filePath,
  relativePath,
) {
  if (
    !fs.existsSync(
      filePath,
    )
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

if (
  !manager.includes(
    "ap-card-delete-button",
  )
) {
  const moreMenuPattern =
    /<details className="ap-card-more-menu">[\s\S]*?<\/details>/;

  if (
    !moreMenuPattern.test(
      manager,
    )
  ) {
    console.error(
      "HATA: Üç nokta menüsü bulunamadı.",
    );
    process.exit(1);
  }

  const deleteButton = `<button
                        type="button"
                        className="ap-card-delete-button"
                        title="İlanı sil"
                        aria-label={\`\${listing.title} ilanını sil\`}
                        disabled={
                          working ===
                          listing.id
                        }
                        onPointerDown={(event) =>
                          event.stopPropagation()
                        }
                        onClick={(event) => {
                          event.stopPropagation();

                          removeListing(
                            listing,
                          );
                        }}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path d="M4 7h16" />
                          <path d="M9 7V4h6v3" />
                          <path d="M7 7l1 13h8l1-13" />
                          <path d="M10 11v5" />
                          <path d="M14 11v5" />
                        </svg>
                      </button>`;

  manager =
    manager.replace(
      moreMenuPattern,
      deleteButton,
    );

  fs.writeFileSync(
    managerTarget,
    manager,
    "utf8",
  );

  console.log(
    "Üç nokta kaldırıldı, çöp kutusu eklendi.",
  );
} else {
  console.log(
    "Çöp kutusu daha önce eklenmiş.",
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
      "delete-button-detail-text-scale.css",
    ),
    "utf8",
  );

const marker =
  "AYDEMIR V2 DELETE BUTTON AND DETAIL TEXT SCALE";

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
    "Detay yazı ölçüleri güncellendi.",
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
  "ÇÖP KUTUSU VE DETAY YAZI BÜYÜTME TAMAMLANDI.",
);
console.log(
  "Silme işleminde mevcut onay sorusu korunmuştur.",
);
