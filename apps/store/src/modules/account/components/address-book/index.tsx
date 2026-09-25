import React from "react"

import AddAddress from "../address-card/add-address"
import EditAddress from "../address-card/edit-address-modal"
import { HttpTypes } from "@medusajs/types"

type AddressBookProps = {
  customer: HttpTypes.StoreCustomer
  region: HttpTypes.StoreRegion
}

const AddressBook: React.FC<AddressBookProps> = ({ customer, region }) => {
  const { addresses } = customer

  if (!addresses.length) {
    return (
      <div data-testid="addresses-page-wrapper">
        <div className="card" style={{ maxWidth: 480 }}>
          <h3 style={{ marginBottom: 14 }}>No saved addresses yet</h3>
          <p className="muted" style={{ fontSize: 14, marginBottom: 16 }}>
            Addresses you use at checkout will be saved here for next time.
          </p>
          <AddAddress region={region} addresses={addresses} />
        </div>
      </div>
    )
  }

  return (
    <div className="grid-3" data-testid="addresses-page-wrapper">
      <AddAddress region={region} addresses={addresses} />
      {addresses.map((address) => {
        return (
          <EditAddress region={region} address={address} key={address.id} />
        )
      })}
    </div>
  )
}

export default AddressBook
