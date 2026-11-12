import { Store, Truck } from "lucide-react";

type Props = {
  etaLong: string;
  seller?: string;
  /** Admin override for the "Delivery by" line. Null/empty = use etaLong. */
  deliveryBy?: string | null;
  /** Admin override for the "Sold by" line. Null/empty = use seller. */
  soldBy?: string | null;
};

export function DeliveryMeta({ etaLong, seller = "Urban Vogue", deliveryBy, soldBy }: Props) {
  const finalEta = deliveryBy && deliveryBy.trim() ? deliveryBy : etaLong;
  const finalSeller = soldBy && soldBy.trim() ? soldBy : seller;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2.5 rounded-lg bg-gray-50 px-3 py-2.5 text-[12.5px] text-gray-700">
        <Truck className="size-4 shrink-0 text-[#1a1a2e]" />
        <span>Delivery by <span className="font-bold text-gray-900">{finalEta}</span></span>
      </div>
      <div className="flex items-center gap-2.5 rounded-lg bg-gray-50 px-3 py-2.5 text-[12.5px] text-gray-700">
        <Store className="size-4 shrink-0 text-[#1a1a2e]" />
        <span>Sold by <span className="font-bold text-gray-900">{finalSeller}</span></span>
      </div>
    </div>
  );
}

export default DeliveryMeta;