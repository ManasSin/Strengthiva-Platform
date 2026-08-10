"use client";

import { useEffect, useState } from "react";
import { api, ApiError, type OrderListItem } from "@/lib/api-client";
import { ButtonLink } from "@/components/ui/button-link";
import { AccountCard, EmptyState } from "@/components/account/account-ui";
import { STORE_URL } from "@/lib/site";

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<OrderListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listOrders()
      .then(setOrders)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Couldn't load your orders."),
      );
  }, []);

  return (
    <AccountCard title="Orders" description="Purchases from store.strengthiva.com.">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!orders && !error && <div className="h-24 animate-pulse rounded-lg bg-border/40" />}

      {orders?.length === 0 && (
        <EmptyState
          title="No orders yet"
          body="Anything you buy from the Strengthiva store will show up here."
          action={
            <ButtonLink href={STORE_URL} variant="default" size="lg">
              Browse products
            </ButtonLink>
          }
        />
      )}

      {orders && orders.length > 0 && (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => (
            <li key={order.id} className="rounded-xl border border-border p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {new Date(order.ordered_at).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
                {order.total !== null && (
                  <div className="font-semibold text-foreground">
                    ₹{order.total.toLocaleString("en-IN")}
                  </div>
                )}
              </div>

              <ul className="mt-3 flex flex-col gap-1.5 text-sm">
                {order.line_items.map((item, i) => (
                  <li key={`${order.id}-${i}`} className="flex justify-between gap-4">
                    {/* purchase_events stores ids, not names — an unmapped product
                        still lists rather than vanishing from the order. */}
                    <span className="text-foreground">
                      {item.product_name ?? (
                        <span className="text-muted-foreground">
                          Product {item.medusa_product_id?.slice(-6) ?? "—"}
                        </span>
                      )}
                      {item.quantity > 1 && (
                        <span className="text-muted-foreground"> × {item.quantity}</span>
                      )}
                    </span>
                    {item.unit_price !== null && (
                      <span className="shrink-0 text-muted-foreground">
                        ₹{(item.unit_price * item.quantity).toLocaleString("en-IN")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </AccountCard>
  );
}
