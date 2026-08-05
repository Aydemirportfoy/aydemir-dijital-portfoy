export type ProjectTemplate = {
  id: string;
  projectName: string;
  neighborhood: string;
  roomCount: string;
  kitchenType: string;
  title: string;
  shortDescription: string;
  description: string;
  features: string[];
  creditAvailable: boolean;
  exchangeAvailable: boolean;
  commissionFree: boolean;
  note: string;
};

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: "safir-konutlari",
    projectName: "Safir Konutları",
    neighborhood: "Aydoğmuş Mahallesi",
    roomCount: "2+1",
    kitchenType: "Ayrı mutfak",
    title: "Safir Konutları'nda 2+1 Sıfır Daire",
    shortDescription:
      "Havuzlu site içerisinde modern ve kullanışlı 2+1 daire.",
    description:
      "Aydemir İnşaat güvencesiyle Safir Konutları'nda; havuz, çocuk parkı, kamelya, güvenlik, çift asansör, yerden ısıtma, ankastre set ve görüntülü diafon özelliklerine sahip 2+1 daire.",
    features: [
      "Havuz",
      "Çocuk parkı",
      "Kamelya",
      "Güvenlik",
      "Asansör",
      "Yerden ısıtma",
      "Ankastre set",
      "Görüntülü diafon",
    ],
    creditAvailable: true,
    exchangeAvailable: true,
    commissionFree: true,
    note: "Kat, cephe, metrekare, fiyat ve fotoğrafları tamamlayın.",
  },
  {
    id: "aydemir-premium",
    projectName: "Aydemir Premium",
    neighborhood: "Fevzi Çakmak Mahallesi",
    roomCount: "2+1",
    kitchenType: "Ayrı mutfak",
    title: "Aydemir Premium'da Tramvaya Yakın 2+1 Daire",
    shortDescription:
      "Güçlü konumu ve modern mimarisiyle öne çıkan 2+1 daire.",
    description:
      "Aydemir İnşaat güvencesiyle Aydemir Premium'da; güvenlik, lobi, şifreli bina girişi, asansör ve kamelya avantajlarına sahip modern 2+1 daire.",
    features: [
      "Güvenlik",
      "Asansör",
      "Kamelya",
      "Ankastre set",
      "Görüntülü diafon",
    ],
    creditAvailable: true,
    exchangeAvailable: true,
    commissionFree: true,
    note: "Kat, cephe, metrekare, fiyat ve fotoğrafları tamamlayın.",
  },
  {
    id: "aydemir-konsept",
    projectName: "Aydemir Konsept",
    neighborhood: "Ayanoğlu Mahallesi",
    roomCount: "3+1",
    kitchenType: "Ayrı mutfak",
    title: "Aydemir Konsept'te Site İçerisinde 3+1 Daire",
    shortDescription:
      "Sosyal alanları ve geniş yaşam planıyla öne çıkan 3+1 daire.",
    description:
      "Aydemir İnşaat güvencesiyle Aydemir Konsept'te; açık havuz, spor salonu, sauna, hamam, kapalı otopark ve yerden ısıtma özelliklerine sahip 3+1 daire.",
    features: [
      "Havuz",
      "Spor salonu",
      "Sauna",
      "Hamam",
      "Kapalı otopark",
      "Yerden ısıtma",
      "Asansör",
      "Ebeveyn banyosu",
    ],
    creditAvailable: true,
    exchangeAvailable: true,
    commissionFree: true,
    note: "Kat, cephe, metrekare, fiyat ve fotoğrafları tamamlayın.",
  },
  {
    id: "yakut-konutlari",
    projectName: "Yakut Konutları",
    neighborhood: "Demirel Mahallesi",
    roomCount: "2+1",
    kitchenType: "Ayrı mutfak",
    title: "Yakut Konutları'nda Ayrı Mutfaklı 2+1 Daire",
    shortDescription:
      "Butik site içerisinde ferah ve kullanışlı 2+1 daire.",
    description:
      "Yakut Konutları'nda; ayrı mutfak, ankastre set, açık yüzme havuzu, çocuk parkı, kamelya, güvenlik kameraları ve asansör özelliklerine sahip 2+1 daire.",
    features: [
      "Havuz",
      "Çocuk parkı",
      "Kamelya",
      "Güvenlik",
      "Asansör",
      "Ankastre set",
      "Balkon",
    ],
    creditAvailable: true,
    exchangeAvailable: true,
    commissionFree: true,
    note: "Kat, cephe, metrekare, fiyat ve fotoğrafları tamamlayın.",
  },
  {
    id: "aydemir-cadde",
    projectName: "Aydemir Cadde",
    neighborhood: "Aydoğmuş Mahallesi",
    roomCount: "3+1",
    kitchenType: "Ayrı mutfak",
    title: "Aydemir Cadde'de Site İçerisinde 3+1 Daire",
    shortDescription:
      "Sosyal alanları ve modern yaşam detaylarıyla öne çıkan 3+1 daire.",
    description:
      "Aydemir Cadde'de; havuz, çocuk parkı, kamelya, açık otopark, güvenlik kamerası, yerden ısıtma, ebeveyn banyosu, giyinme odası, elektrikli panjur, ankastre set ve klima altyapısı özelliklerine sahip 3+1 daire.",
    features: [
      "Havuz",
      "Çocuk parkı",
      "Kamelya",
      "Açık otopark",
      "Güvenlik",
      "Yerden ısıtma",
      "Ebeveyn banyosu",
      "Giyinme odası",
      "Elektrikli panjur",
      "Ankastre set",
      "Klima altyapısı",
    ],
    creditAvailable: true,
    exchangeAvailable: true,
    commissionFree: true,
    note: "Mahalle, kat, cephe, metrekare, fiyat ve fotoğrafları kontrol edin.",
  },
  {
    id: "aydemir-suit",
    projectName: "Aydemir Suit",
    neighborhood: "Aydoğmuş Mahallesi",
    roomCount: "1+1",
    kitchenType: "Açık mutfak",
    title: "Aydemir Suit'te Otel Konseptli 1+1 Daire",
    shortDescription:
      "Tramvaya yakın konumda otel konseptli modern 1+1 daire.",
    description:
      "Aydemir Suit'te; çift klima, üçlü ankastre set, gizli kapı detayı ve tramvaya yakın konum avantajına sahip otel konseptli 1+1 daire.",
    features: [
      "Asansör",
      "Ankastre set",
      "Klima altyapısı",
      "Görüntülü diafon",
    ],
    creditAvailable: true,
    exchangeAvailable: true,
    commissionFree: true,
    note: "Kat, cephe, metrekare, fiyat ve fotoğrafları tamamlayın.",
  },
  {
    id: "luna-konutlari",
    projectName: "Luna Konutları",
    neighborhood: "Aktoprak Mahallesi",
    roomCount: "2+1",
    kitchenType: "",
    title: "Luna Konutları'nda Modern 2+1 Daire",
    shortDescription:
      "Aktoprak Mahallesi'nde modern ve kullanışlı 2+1 daire.",
    description:
      "Luna Konutları'nda; ebeveyn banyosu, ankastre set ve elektrikli panjur özelliklerine sahip modern 2+1 daire.",
    features: [
      "Ebeveyn banyosu",
      "Ankastre set",
      "Elektrikli panjur",
      "Asansör",
    ],
    creditAvailable: true,
    exchangeAvailable: true,
    commissionFree: true,
    note: "Mutfak tipi, kat, cephe, metrekare, fiyat ve fotoğrafları tamamlayın.",
  },
  {
    id: "doga-sitesi",
    projectName: "Doğa Sitesi",
    neighborhood: "Aydoğmuş Mahallesi",
    roomCount: "2+1",
    kitchenType: "",
    title: "Doğa Sitesi'nde Havuzlu 2+1 Daire",
    shortDescription:
      "Havuzlu site içerisinde ferah ve kullanışlı 2+1 daire.",
    description:
      "Doğa Sitesi'nde; havuzlu site yaşamı ve kullanışlı plan avantajına sahip 2+1 daire.",
    features: [
      "Havuz",
      "Asansör",
      "Çocuk parkı",
      "Kamelya",
    ],
    creditAvailable: true,
    exchangeAvailable: true,
    commissionFree: true,
    note: "Mutfak tipi, kat, cephe, metrekare, fiyat ve fotoğrafları tamamlayın.",
  },
  {
    id: "orman-palace",
    projectName: "Orman Palace",
    neighborhood: "Varsak Karşıyaka Mahallesi",
    roomCount: "3,5+1",
    kitchenType: "Ayrı mutfak",
    title: "Orman Palace'ta Geniş 3,5+1 Daire",
    shortDescription:
      "Sosyal alanları ve geniş planıyla öne çıkan 3,5+1 daire.",
    description:
      "Orman Palace'ta; havuz, kapalı otopark, yerden ısıtma, ebeveyn banyosu ve çift balkon özelliklerine sahip geniş 3,5+1 daire.",
    features: [
      "Havuz",
      "Kapalı otopark",
      "Yerden ısıtma",
      "Ebeveyn banyosu",
      "Balkon",
      "Asansör",
    ],
    creditAvailable: true,
    exchangeAvailable: true,
    commissionFree: true,
    note: "Kat, cephe, fiyat ve fotoğrafları tamamlayın.",
  },
];
