export type Listing = {
  id: number;
  slug: string;
  title: string;
  neighborhood: string;
  rooms: string;
  price: string;
  image: string;
  description: string;
  features: string[];
};

export const listings: Listing[] = [
  {
    id: 1,
    slug: "yakut-konutlari",
    title: "Yakut Konutları",
    neighborhood: "Demirel Mahallesi",
    rooms: "2+1",
    price: "5.500.000 TL",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=90",
    description:
      "Demirel Mahallesi'nde modern mimarisi, ferah yaşam alanları ve kullanışlı planıyla öne çıkan 2+1 daire seçeneği.",
    features: [
      "2+1",
      "Modern mimari",
      "Ferah yaşam alanı",
      "Aydemir İnşaat güvencesi",
    ],
  },
  {
    id: 2,
    slug: "safir-konutlari",
    title: "Safir Konutları",
    neighborhood: "Aydoğmuş Mahallesi",
    rooms: "2+1",
    price: "6.250.000 TL",
    image:
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1600&q=90",
    description:
      "Aydoğmuş Mahallesi'nde kaliteli işçilik, modern tasarım ve konforlu yaşamı bir araya getiren 2+1 daire seçeneği.",
    features: [
      "2+1",
      "Premium tasarım",
      "Kullanışlı plan",
      "Aydemir İnşaat güvencesi",
    ],
  },
  {
    id: 3,
    slug: "aydemir-konsept",
    title: "Aydemir Konsept",
    neighborhood: "Ayanoğlu Mahallesi",
    rooms: "3+1",
    price: "8.750.000 TL",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=90",
    description:
      "Ayanoğlu Mahallesi'nde geniş yaşam alanı, modern detaylar ve premium site konsepti sunan 3+1 daire seçeneği.",
    features: [
      "3+1",
      "Geniş yaşam alanı",
      "Premium site konsepti",
      "Aydemir İnşaat güvencesi",
    ],
  },
];

export function getListingBySlug(slug: string) {
  return listings.find((listing) => listing.slug === slug);
}
