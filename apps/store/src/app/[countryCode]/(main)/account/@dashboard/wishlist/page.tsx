import { Metadata } from "next"
import { notFound } from "next/navigation"

import { retrieveCustomer } from "@lib/data/customer"
import { getCatalog } from "@lib/data/store-catalog"
import WishlistOverview from "@modules/account/components/wishlist-overview"

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Products you've saved for later.",
}

export default async function Wishlist(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params
  const { countryCode } = params
  const customer = await retrieveCustomer().catch(() => null)

  if (!customer) {
    notFound()
  }

  const catalog = await getCatalog(countryCode)

  return <WishlistOverview cards={catalog.cards} />
}
