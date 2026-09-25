"use client"

import { clx } from "@modules/common/components/ui"
import { useParams, usePathname } from "next/navigation"

import { signout } from "@lib/data/customer"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const AccountNav = ({
  customer: _customer,
}: {
  customer: HttpTypes.StoreCustomer | null
}) => {
  const route = usePathname()
  const { countryCode } = useParams() as { countryCode: string }

  const handleLogout = async () => {
    await signout(countryCode)
  }

  return (
    <div className="tabs" role="tablist" data-testid="account-nav">
      <AccountNavLink href="/account" route={route!} data-testid="overview-link">
        Overview
      </AccountNavLink>
      <AccountNavLink href="/account/orders" route={route!} data-testid="orders-link">
        Orders
      </AccountNavLink>
      <AccountNavLink href="/account/wishlist" route={route!} data-testid="wishlist-link">
        Wishlist
      </AccountNavLink>
      <AccountNavLink href="/account/addresses" route={route!} data-testid="addresses-link">
        Addresses
      </AccountNavLink>
      <AccountNavLink href="/account/profile" route={route!} data-testid="profile-link">
        Profile
      </AccountNavLink>
      <button
        type="button"
        className="tab"
        onClick={handleLogout}
        data-testid="logout-button"
      >
        Log out
      </button>
    </div>
  )
}

type AccountNavLinkProps = {
  href: string
  route: string
  children: React.ReactNode
  "data-testid"?: string
}

const AccountNavLink = ({
  href,
  route,
  children,
  "data-testid": dataTestId,
}: AccountNavLinkProps) => {
  const { countryCode }: { countryCode: string } = useParams()

  const active = route.split(countryCode)[1] === href
  return (
    <LocalizedClientLink
      href={href}
      className={clx("tab", { active })}
      role="tab"
      aria-selected={active}
      data-testid={dataTestId}
    >
      {children}
    </LocalizedClientLink>
  )
}

export default AccountNav
