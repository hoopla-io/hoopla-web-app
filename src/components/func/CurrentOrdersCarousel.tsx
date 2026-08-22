import { FC } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Mousewheel } from "swiper/modules";

import type { ActiveOrder } from "@/api/domains/orders";
import { CurrentOrderCard } from "@/components/func/CurrentOrderCard";

import "swiper/css";

type Props = {
  orders: ActiveOrder[];
};

export const CurrentOrdersCarousel: FC<Props> = ({ orders }) => {
  if (orders.length === 0) return null;

  if (orders.length === 1) {
    return (
      <div className="mb-3">
        <CurrentOrderCard order={orders[0]} />
      </div>
    );
  }

  return (
    <div className="mb-3">
      <Swiper
        modules={[Mousewheel]}
        slidesPerView="auto"
        spaceBetween={12}
        loop={false}
        mousewheel={{ forceToAxis: true, sensitivity: 1 }}
      >
        {orders.map((order) => (
          <SwiperSlide key={order.id} className="!w-[calc(100%-24px)]">
            <CurrentOrderCard order={order} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};
