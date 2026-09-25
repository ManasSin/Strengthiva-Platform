import { acceptTransferRequest } from "@lib/data/orders"
import TransferImage from "@modules/order/components/transfer-image"

export default async function TransferPage({
  params,
}: {
  params: { id: string; token: string }
}) {
  const { id, token } = params

  const { success, error } = await acceptTransferRequest(id, token)

  return (
    <section className="section" style={{ maxWidth: 560, marginInline: "auto" }}>
      <div className="container">
        <div className="panel stack">
          <TransferImage />
          {success && (
            <>
              <h3>Order transfered!</h3>
              <p className="muted">
                Order {id} has been successfully transfered to the new owner.
              </p>
            </>
          )}
          {!success && (
            <>
              <p className="muted">
                There was an error accepting the transfer. Please try again.
              </p>
              {error && (
                <p className="field-error">Error message: {error}</p>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}
