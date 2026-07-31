export type Listing = {
  id: string;
  name: string;
  neighborhood: string;
  rooms: string;
  price: string;
  imageUrl: string;
  imageAlt: string;
};

export const stats = [
  { label: "Toplam İlan", value: 24 },
  { label: "Aktif İlan", value: 18 },
  { label: "Satılan", value: 6 },
  { label: "Müşteri Sunumu", value: 9 },
] as const;

export const recentListings: Listing[] = [
  {
    id: "1",
    name: "Yakut Konutları",
    neighborhood: "Demirel Mahallesi",
    rooms: "2+1",
    price: "5.500.000 TL",
    imageUrl:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
    imageAlt: "Yakut Konutları örnek görseli",
  },
  {
    id: "2",
    name: "Safir Konutları",
    neighborhood: "Aydoğmuş Mahallesi",
    rooms: "2+1",
    price: "6.250.000 TL",
    imageUrl:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
    imageAlt: "Safir Konutları örnek görseli",
  },
  {
    id: "3",
    name: "Aydemir Konsept",
    neighborhood: "Ayanoğlu Mahallesi",
    rooms: "3+1",
    price: "8.750.000 TL",
    imageUrl:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    imageAlt: "Aydemir Konsept örnek görseli",
  },
];
