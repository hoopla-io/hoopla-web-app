import { Receipt } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@telegram-apps/telegram-ui";

export default function Invoice() {
  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto">
        <Card className="shadow-lg border-0 bg-[var(--tg-theme-bg-color)] text-white">
          <CardHeader className="text-center pb-6 pt-8">
            <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Receipt className="w-6 h-6 text-green-600" />
            </div>
            <h1 className="text-2xl font-semibold ">Invoice from Hoopla</h1>
          </CardHeader>

          <CardContent className="px-6 pb-8">
            <div className="space-y-6">
              <div className="flex justify-between">
                {/* Payment Method */}
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">
                    Payment Method
                  </p>
                  <p className="">Hoopla</p>
                </div>

                {/* Date */}
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">
                    Date Ordered
                  </p>
                  <p className="">June 18, 2025</p>
                </div>
              </div>

              <Separator />

              {/* Summary Section */}
              <div>
                <h2 className="text-lg font-semibold  mb-4">Order Summary</h2>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-400">
                      Shop
                    </span>
                    <span className="">Aroma Coffee</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-400">
                      Drink
                    </span>
                    <span>Espresso</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  mode="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button className="flex-1 text-white">Confirm Order</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
