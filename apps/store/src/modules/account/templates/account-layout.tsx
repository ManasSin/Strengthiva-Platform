import React from "react"

import AccountNav from "../components/account-nav"
import { HttpTypes } from "@medusajs/types"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({
  customer,
  children,
}) => {
  return (
    <section className="section" data-testid="account-page">
      <div className="container">
        {customer && (
          <>
            <h1 className="h2" style={{ marginBottom: 8 }}>
              My Account
            </h1>
            <p className="lead" style={{ marginBottom: 28 }}>
              Manage your orders, saved products, addresses and profile.
            </p>
            <div style={{ marginBottom: 28 }}>
              <AccountNav customer={customer} />
            </div>
          </>
        )}

        <div>{children}</div>
      </div>
    </section>
  )
}

export default AccountLayout
