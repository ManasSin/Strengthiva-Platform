import TransferActions from "@modules/order/components/transfer-actions"
import TransferImage from "@modules/order/components/transfer-image"

export default async function TransferPage({
  params,
}: {
  params: { id: string; token: string }
}) {
  const { id, token } = params

  return (
    <section className="section" style={{ maxWidth: 560, marginInline: "auto" }}>
      <div className="container">
        <div className="panel stack">
          <TransferImage />
          <h3>Transfer request for order {id}</h3>
          <p className="muted">
            You&#39;ve received a request to transfer ownership of your order ({id}).
            If you agree to this request, you can approve the transfer by clicking
            the button below.
          </p>
          <hr className="rule" />
          <p className="muted">
            If you accept, the new owner will take over all responsibilities and
            permissions associated with this order.
          </p>
          <p className="muted">
            If you do not recognize this request or wish to retain ownership, no
            further action is required.
          </p>
          <hr className="rule" />
          <TransferActions id={id} token={token} />
        </div>
      </div>
    </section>
  )
}
