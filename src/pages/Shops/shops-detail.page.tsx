import { useCreateOrder } from "@/api/hooks/orders.hook";
import { useShop } from "@/api/hooks/shops.hook";
import { Page } from "@/components/Page";
import { useLocation } from "@/context/location.context";
import { useFormatHours } from "@/helpers/utils";
import { request } from "@telegram-apps/bridge";
import { Button } from "@telegram-apps/telegram-ui";
import { MapPin, Clock, Phone, Globe, Instagram } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";

export const ShopDetailPage = () => {
  let params = useParams();
  const { shopId } = params;

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { location } = useLocation();

  const handleImageChange = (index: number) => {
    setCurrentImageIndex(index);
  };

  const { formatWorkingHours } = useFormatHours();

  const { shopDetail, isLoading, isError } = useShop({
    shopId: Number(shopId),
  });

  const { mutate: createOrder, isPending } = useCreateOrder();

  if (isError) return <div>Error: {isError}</div>;

  if (isLoading || !shopDetail) return <div>Loading...</div>;

  return (
    <Page>
      <div className="pb-20">
        <div className="relative h-[24vh]">
          <img
            src={
              shopDetail.pictures[currentImageIndex]?.pictureUrl ||
              "/placeholder.svg"
            }
            alt={shopDetail.name!}
            className="object-cover"
          />

          <div className="absolute bottom-4 right-4 bg-[var(--tg-theme-bg-color] backdrop-blur-sm px-2 py-1 rounded-md text-sm">
            {currentImageIndex + 1}/{shopDetail.pictures.length}
          </div>
        </div>

        {/* Image Thumbnails */}
        <div className="px-2 mt-6 mb-6 relative">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {shopDetail.pictures.map((picture, index) => (
              <button
                key={index}
                onClick={() => handleImageChange(index)}
                className={`flex-shrink-0 rounded-lg overflow-hidden border-2 relative h-16 w-24 ${
                  currentImageIndex === index
                    ? "border-[var(--tg-theme-button-color)]"
                    : "border-transparent"
                }`}
              >
                <img
                  src={picture.pictureUrl || "/placeholder.svg"}
                  alt={`${shopDetail.name} ${index + 1}`}
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Content Section */}
        <div className="px-4 space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-4">{shopDetail.name}</h1>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock size={20} />
                <p className="text-sm">
                  Open today: {formatWorkingHours(shopDetail.workingHours)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={20} />
                <a
                  href={`https://yandex.uz/maps/?ll=${shopDetail.location?.lng},${shopDetail.location?.lat}&z=16&mode=routes&rtext=${location?.latitude},${location?.longitude}~${shopDetail.location?.lat},${shopDetail.location?.lng}&ruri=~&rtt=auto`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline"
                >
                  Get Directions
                </a>
              </div>
              {shopDetail.phoneNumbers.map((phone, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Phone size={20} />
                  <a href={`tel:${phone.phoneNumber}`} className="text-sm">
                    +{phone.phoneNumber}
                  </a>
                </div>
              ))}
            </div>

            {/* Social Links */}
            <div className="flex gap-4 mt-4">
              {shopDetail.urls.map((url, index) => (
                <a
                  key={index}
                  href={url.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80"
                >
                  {url.urlType === "web" ? (
                    <Globe size={24} />
                  ) : (
                    <Instagram size={24} />
                  )}
                </a>
              ))}
            </div>
          </div>

          {/* Available Drinks */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Available Drinks</h2>
            <div className="grid grid-cols-2 gap-4">
              {shopDetail.drinks?.map((drink) => (
                <div
                  key={drink.id}
                  className="rounded-lg overflow-hidden shadow-md"
                >
                  <img
                    src={drink.pictureUrl || "/placeholder.svg"}
                    alt={drink.name}
                    width={200}
                    height={200}
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-2 bg-[var(--tg-theme-bg-color)] border-t border-[var(--tg-theme-secondary-bg-color)]">
                    <h3 className="font-medium text-center text-[var(--tg-theme-text-color)]">
                      {drink.name}
                    </h3>
                    <Button
                      mode="filled"
                      className="w-full mt-2"
                      onClick={() => {
                        request("web_app_open_popup", "popup_closed", {
                          params: {
                            title: "Confirm Order",
                            message: `Do you want to order a cup of ${drink.name}?`,
                            buttons: [
                              { id: "yes", type: "ok" },
                              { id: "no", type: "cancel" },
                            ],
                          },
                        }).then((result) => {
                          if (result.button_id === "yes") {
                            console.log(`Ordering ${drink.name}...`);
                            createOrder(
                              {
                                drink_id: drink.id,
                                shop_id: Number(shopId),
                              },
                              {
                                onSuccess: (data) => {
                                  console.log("Order created:", data);

                                  toast.success(`Order status: ${data.Status}`);
                                },
                                onError: (error) => {
                                  console.error("Order failed:", error);
                                  // Optionally: show error toast
                                  toast.error(error.message);
                                },
                              }
                            );
                          } else {
                            console.log("User canceled the order.");
                          }
                        });
                      }}
                    >
                      Order
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
};
