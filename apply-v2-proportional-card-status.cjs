const fs = require("fs");
const path = require("path");

const projectRoot = process.cwd();

if (!fs.existsSync(path.join(projectRoot, "package.json"))) {
  console.error(
    "HATA: Komutu package.json dosyasının bulunduğu proje klasöründe çalıştırın."
  );
  process.exit(1);
}

const timestamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-");

const backupRoot = path.join(
  projectRoot,
  ".aydemir-backups",
  `premium-status-${timestamp}`,
);

function backup(relativePath) {
  const target = path.join(
    projectRoot,
    relativePath,
  );

  if (!fs.existsSync(target)) {
    return;
  }

  const destination = path.join(
    backupRoot,
    relativePath,
  );

  fs.mkdirSync(
    path.dirname(destination),
    { recursive: true },
  );

  fs.copyFileSync(
    target,
    destination,
  );
}

const managerRelative =
  "src/components/admin/ListingsManager.tsx";

const managerTarget = path.join(
  projectRoot,
  managerRelative,
);

backup(managerRelative);

let manager = fs.readFileSync(
  managerTarget,
  "utf8",
);

/* Kapak fotoğrafına komisyonsuz etiketi */
if (!manager.includes("ap-admin-commission-badge")) {
  const mediaMarker =
    '<div className="ap-compact-card-media">';

  if (!manager.includes(mediaMarker)) {
    console.error(
      "HATA: İlan kartı fotoğraf alanı bulunamadı."
    );
    process.exit(1);
  }

  manager = manager.replace(
    mediaMarker,
    `${mediaMarker}
                  {listing.commission_free ? (
                    <span className="ap-admin-commission-badge">
                      Komisyonsuz
                    </span>
                  ) : null}`,
  );

  console.log(
    "Kapak fotoğraflarına Komisyonsuz etiketi eklendi."
  );
}

/* Native select yerine premium durum menüsü */
if (!manager.includes("ap-status-menu-popover")) {
  const statusPattern =
    /<label className="ap-compact-status ap-clean-status">[\s\S]*?<\/label>/;

  if (!statusPattern.test(manager)) {
    console.error(
      "HATA: Mevcut durum seçici bulunamadı."
    );
    process.exit(1);
  }

  const premiumStatus = `<div className="ap-custom-status">
                      <span>Durum</span>

                      <details
                        className={\`ap-status-menu status-\${listing.status}\`}
                      >
                        <summary>
                          <span>
                            {listing.status === "active"
                              ? "Aktif"
                              : listing.status === "draft"
                                ? "Taslak"
                                : listing.status === "reserved"
                                  ? "Rezerve"
                                  : "Satıldı"}
                          </span>

                          <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path d="m7 10 5 5 5-5" />
                          </svg>
                        </summary>

                        <div className="ap-status-menu-popover">
                          {(
                            [
                              ["active", "Aktif"],
                              ["draft", "Taslak"],
                              ["reserved", "Rezerve"],
                              ["sold", "Satıldı"],
                            ] as Array<
                              [
                                ListingStatus,
                                string,
                              ]
                            >
                          ).map(
                            ([
                              value,
                              label,
                            ]) => (
                              <button
                                type="button"
                                key={value}
                                className={\`ap-status-option \${
                                  listing.status ===
                                  value
                                    ? "is-current"
                                    : ""
                                }\`}
                                disabled={
                                  working ===
                                  listing.id
                                }
                                onClick={(event) => {
                                  event.stopPropagation();

                                  const details =
                                    event.currentTarget.closest(
                                      "details",
                                    );

                                  details?.removeAttribute(
                                    "open",
                                  );

                                  changeStatus(
                                    listing.id,
                                    value,
                                  );
                                }}
                              >
                                <span
                                  className={\`ap-status-dot \${value}\`}
                                />

                                <span>
                                  {label}
                                </span>

                                <b>
                                  {listing.status ===
                                  value
                                    ? "✓"
                                    : ""}
                                </b>
                              </button>
                            ),
                          )}
                        </div>
                      </details>
                    </div>`;

  manager = manager.replace(
    statusPattern,
    premiumStatus,
  );

  console.log(
    "Native durum seçici premium menüye dönüştürüldü."
  );
}

fs.writeFileSync(
  managerTarget,
  manager,
  "utf8",
);

/* CSS */
const cssRelative =
  "src/app/globals.css";

const cssTarget = path.join(
  projectRoot,
  cssRelative,
);

backup(cssRelative);

let currentCss = fs.readFileSync(
  cssTarget,
  "utf8",
);

const marker =
  "AYDEMIR V2 PROPORTIONAL CARD COMMISSION PREMIUM STATUS";

const escaped = marker.replace(
  /[.*+?^${}()|[\]\\]/g,
  "\\$&",
);

const existingPattern = new RegExp(
  `\\n?\\/\\* ${escaped} \\*\\/[\\s\\S]*$`,
);

currentCss = currentCss.replace(
  existingPattern,
  "",
);

const cssPatch = fs.readFileSync(
  path.join(
    __dirname,
    "proportional-card-commission-premium-status.css",
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
  path.join(projectRoot, ".next"),
  {
    recursive: true,
    force: true,
  },
);

console.log("");
console.log(
  "KART ORANLARI, KOMİSYONSUZ ETİKETİ VE PREMIUM DURUM MENÜSÜ TAMAMLANDI."
);
console.log(
  "Supabase verileri değiştirilmedi."
);
