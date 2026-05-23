import type { BannerItem } from "../../layout/BannerCarousel";

export type SuggestionProps = {
    message: string;
    onClose?: () => void;
}

export const bannerData: BannerItem[] = [
  {
    id: 1,
    image: "/1_.png",
    href: "/job/1",
    alt: "Banner 1",
  },
  {
    id: 2,
    image: "/2_.png",
    href: "/job/2",
    alt: "Banner 2",
  },
  {
    id: 3,
    image: "/3_.png",
    href: "/job/3",
    alt: "Banner 3",
  },
  {
    id: 4,
    image: "/4_.png",
    href: "/job/4",
    alt: "Banner 4",
  },
  {
    id: 5,
    image: "/5_.png",
    href: "/job/5",
    alt: "Banner 5",
  },
   {
    id: 6,
    image: "/6_.png",
    href: "/job/6",
    alt: "Banner 6",
  },
];