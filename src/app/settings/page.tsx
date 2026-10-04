import { SellerSettingsForm } from "@/components/SellerSettingsForm";
import { DeleteShopCard } from "@/components/DeleteShopCard";
import { getOrCreateSellerSettings } from "@/lib/seller";
import { isLocalDatabase } from "@/lib/db";
import { getCurrentSession, getUserShopsAction } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const seller = await getOrCreateSellerSettings();
  const isLocal = isLocalDatabase();
  const session = await getCurrentSession();
  const userShops = await getUserShopsAction();

  const currentShop = userShops.find((s) => s.id === session?.activeShopId) || userShops[0];
  const canDelete = userShops.length > 1;

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      <div>
        <header className="page-heading border-b border-slate-200/80 pb-4 mb-5">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Seller settings
          </h1>
          <p className="mt-1 max-w-2xl text-sm font-medium text-slate-500">
            Company, bank, and branding details appear on every invoice. Configure once here.
          </p>
        </header>

        <div className="space-y-10">
          <SellerSettingsForm initial={seller} isLocal={isLocal} />

          {currentShop && (
            <div className="pt-6 border-t border-slate-200/80">
              <DeleteShopCard
                shopId={currentShop.id}
                shopName={currentShop.name}
                canDelete={canDelete}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
