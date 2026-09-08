import { FC } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import { useTranslation } from "react-i18next";

import type { Banner } from "@/api/domains/banners";

import "swiper/css";
import "swiper/css/pagination";

type Props = {
  banners: Banner[];
  isLoading: boolean;
  onBannerClick: (banner: Banner) => void;
};

export const BannerCarousel: FC<Props> = ({
  banners,
  isLoading,
  onBannerClick,
}) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="mb-3">
        <div className="w-full aspect-[2/1] rounded-xl bg-gray-200 animate-pulse" />
      </div>
    );
  }

  if (banners.length === 0) return null;

  return (
    <div className="mb-3">
      <Swiper
        modules={[Pagination, Autoplay]}
        pagination={{ clickable: true }}
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        loop={banners.length > 1}
        spaceBetween={12}
        className="rounded-xl [&_.swiper-pagination-bullet-active]:!bg-[var(--color-primary)]"
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner.id}>
            <button
              onClick={() => onBannerClick(banner)}
              className="w-full block relative"
            >
              <img
                src={banner.imageUrl}
                alt={banner.title ?? t("bannerCarousel.bannerAlt")}
                className="w-full aspect-[2/1] object-cover rounded-xl"
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/30 via-transparent to-black/10" />
              {banner.title && (
                <span className="absolute bottom-3 left-4 text-white font-semibold text-sm drop-shadow-md">
                  {banner.title}
                </span>
              )}
            </button>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};
