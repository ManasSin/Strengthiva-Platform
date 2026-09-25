import { declineTransferRequest } from "@lib/data/orders"
import TransferImage from "@modules/order/components/transfer-image"

export default async function TransferPage({
  params,
}: {
  params: { id: string; token: string }
}) {
  const { id, token } = params

  const { success, error } = await declineTransferRequest(id, token)

  return (
    <section className="section" style={{ maxWidth: 560, marginInline: "auto" }}>
      <div className="container">
        <div className="panel stack">
          <TransferImage />
          {success && (
            <>
              <h3>Order transfer declined!</h3>
              <p className="muted">
                Transfer of order {id} has been successfully declined.
              </p>
            </>
          )}
          {!success && (
            <>
              <p className="muted">
                There was an error declining the transfer. Please try again.
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
