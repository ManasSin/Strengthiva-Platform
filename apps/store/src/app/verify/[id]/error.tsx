"use client"
import { VerificationUnavailable } from "@strengthiva/transparency/public-record"
import "@strengthiva/transparency/styles.css"
export default function VerifyError({ reset }: { reset: () => void }) {
  return (
    <div>
      <VerificationUnavailable unavailable />
      <div className="transparency retry-record">
        <button type="button" className="btn btn-primary" onClick={reset}>
          Try loading the record again
        </button>
      </div>
    </div>
  )
}
