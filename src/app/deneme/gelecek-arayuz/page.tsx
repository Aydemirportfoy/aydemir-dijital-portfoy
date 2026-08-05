"use client";

import { MouseEvent, useMemo, useRef, useState } from "react";
import styles from "./future-ui.module.css";

type DemoProperty = {
  title: string;
  location: string;
  price: string;
  image: string;
  features: string[];
  accent: string;
};

const properties: DemoProperty[] = [
  {
    title: "Aydemir Konsept",
    location: "Ayanoğlu · Kepez · Antalya",
    price: "₺10.490.000",
    image: "/future-demo/future-building-1.svg",
    features: ["3+1", "145 m²", "Kapalı Otopark"],
    accent: "01",
  },
  {
    title: "Aydemir Premium",
    location: "Fevzi Çakmak · Kepez",
    price: "₺6.400.000",
    image: "/future-demo/future-building-2.svg",
    features: ["2+1", "Tramvaya Sıfır", "Sıfır Bina"],
    accent: "02",
  },
  {
    title: "Safir Konutları",
    location: "Aydoğmuş · Kepez",
    price: "₺5.500.000",
    image: "/future-demo/future-building-3.svg",
    features: ["2+1", "Havuz", "Yerden Isıtma"],
    accent: "03",
  },
];

export default function FutureInterfaceDemoPage() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  const activeProperty = properties[activeIndex];

  const stageStyle = useMemo(
    () =>
      ({
        "--pointer-x": `${pointer.x}px`,
        "--pointer-y": `${pointer.y}px`,
      }) as React.CSSProperties,
    [pointer],
  );

  function handlePointerMove(event: MouseEvent<HTMLDivElement>) {
    const target = stageRef.current;
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setPointer({
      x: Math.max(0, Math.min(rect.width, x)),
      y: Math.max(0, Math.min(rect.height, y)),
    });
  }

  return (
    <main className={styles.pageShell}>
      <section
        ref={stageRef}
        className={styles.futureStage}
        style={stageStyle}
        onMouseMove={handlePointerMove}
      >
        <div className={styles.ambientGlow} />
        <div className={styles.gridLayer} />

        <header className={styles.topBar}>
          <a href="/yonetim" className={styles.brandBlock}>
            <span className={styles.brandMark}>A</span>
            <span>
              <strong>AYDEMİR</strong>
              <small>Spatial Portfolio</small>
            </span>
          </a>

          <div className={styles.modePill}>
            <span className={styles.statusDot} />
            Canlı Deneme
          </div>
        </header>

        <div className={styles.heroGrid}>
          <section className={styles.heroCopy}>
            <p className={styles.eyebrow}>APPLE SPATIAL × LIQUID GLASS</p>
            <h1>
              Portföyünüz
              <span>mekânsal bir deneyime</span>
              dönüşüyor.
            </h1>
            <p className={styles.heroDescription}>
              Fare hareketine duyarlı derinlik, canlı cam paneller, akışkan
              geçişler ve sade satış odaklı bilgi mimarisi.
            </p>

            <div className={styles.heroActions}>
              <button type="button" className={styles.primaryButton}>
                Portföyü Keşfet
                <span>→</span>
              </button>
              <button type="button" className={styles.secondaryButton}>
                Sunumu Aç
              </button>
            </div>

            <div className={styles.metricRow}>
              <div>
                <strong>48</strong>
                <span>Aktif portföy</span>
              </div>
              <div>
                <strong>12</strong>
                <span>Bugünkü talep</span>
              </div>
              <div>
                <strong>%92</strong>
                <span>En güçlü eşleşme</span>
              </div>
            </div>
          </section>

          <section className={styles.spatialShowcase}>
            <div className={styles.orbitRing} />
            <div className={styles.orbitRingTwo} />

            <article className={styles.mainPropertyCard}>
              <div className={styles.imageWrap}>
                <img
                  key={activeProperty.image}
                  src={activeProperty.image}
                  alt={activeProperty.title}
                />
                <div className={styles.imageGlassTop}>
                  <span>{activeProperty.accent}/03</span>
                  <span>Komisyonsuz</span>
                </div>
                <div className={styles.imageGlassBottom}>
                  <div>
                    <small>Öne çıkan proje</small>
                    <strong>{activeProperty.title}</strong>
                  </div>
                  <button type="button" aria-label="Detayı aç">
                    ↗
                  </button>
                </div>
              </div>

              <div className={styles.cardMeta}>
                <div>
                  <p>{activeProperty.location}</p>
                  <strong>{activeProperty.price}</strong>
                </div>
                <div className={styles.featurePills}>
                  {activeProperty.features.map((feature) => (
                    <span key={feature}>{feature}</span>
                  ))}
                </div>
              </div>
            </article>

            <div className={styles.floatingMatchCard}>
              <small>Canlı talep eşleşmesi</small>
              <strong>%92 uygun</strong>
              <span>Ayanoğlu · 3+1 · Ayrı mutfak</span>
            </div>

            <div className={styles.floatingLeadCard}>
              <span className={styles.leadAvatar}>AB</span>
              <div>
                <small>Yeni müşteri</small>
                <strong>Ahmet Bey</strong>
              </div>
              <span className={styles.leadStatus}>Sıcak</span>
            </div>
          </section>
        </div>

        <section className={styles.propertyRail}>
          <div className={styles.railHeading}>
            <div>
              <small>Akışkan portföy</small>
              <strong>İlanlar arasında kayarak ilerle</strong>
            </div>
            <span>{String(activeIndex + 1).padStart(2, "0")} / 03</span>
          </div>

          <div className={styles.railCards}>
            {properties.map((property, index) => (
              <button
                type="button"
                key={property.title}
                className={`${styles.railCard} ${
                  index === activeIndex ? styles.railCardActive : ""
                }`}
                onClick={() => setActiveIndex(index)}
              >
                <img src={property.image} alt="" />
                <span>
                  <small>{property.location}</small>
                  <strong>{property.title}</strong>
                </span>
                <b>{property.price}</b>
              </button>
            ))}
          </div>
        </section>

        <footer className={styles.demoFooter}>
          <span>Bu ekran yalnızca bağımsız bir tasarım denemesidir.</span>
          <a href="/yonetim">Yönetim paneline dön</a>
        </footer>
      </section>
    </main>
  );
}
