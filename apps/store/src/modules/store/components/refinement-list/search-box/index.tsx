"use client"

import { useEffect, useRef, useState } from "react"

type SearchBoxProps = {
  /** Current `q` from the URL — the source of truth once typing settles. */
  value: string
  setQueryParams: (name: string, value: string) => void
  "data-testid"?: string
}

// Debounced so the store page isn't re-fetched on every keystroke. Search is
// applied server-side by Medusa (the `q` param on /store/products) rather than
// filtering the fetched page client-side — listProductsWithSort pulls 100 rows
// and paginates them in memory, so filtering after that point would leave the
// pagination and result count describing the unfiltered set.
const DEBOUNCE_MS = 300

const SearchBox = ({
  value,
  setQueryParams,
  "data-testid": dataTestId,
}: SearchBoxProps) => {
  // Local state keeps typing responsive; the URL catches up after the debounce.
  const [draft, setDraft] = useState(value)

  // Tracks the last value this input and the URL agreed on, so the debounce
  // below can tell "the user typed something new" apart from "the URL just told
  // us what we already knew" — without that, pushing a param would echo back in
  // and re-trigger the debounce.
  const lastSynced = useRef(value)

  // Re-sync when the URL changes from somewhere other than this input (back/
  // forward navigation, or a link that clears the search).
  useEffect(() => {
    lastSynced.current = value
    setDraft(value)
  }, [value])

  useEffect(() => {
    if (draft === lastSynced.current) {
      return
    }
    const timer = setTimeout(() => {
      lastSynced.current = draft
      setQueryParams("q", draft)
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [draft, setQueryParams])

  return (
    <div className="flex flex-col gap-y-3">
      <label
        htmlFor="store-search"
        className="txt-compact-small-plus text-ui-fg-muted"
      >
        Search
      </label>
      <div className="relative">
        <input
          id="store-search"
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Search by product name"
          autoComplete="off"
          data-testid={dataTestId}
          className="w-full rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-2 text-base-regular outline-none focus:border-ui-border-interactive"
        />
      </div>
    </div>
  )
}

export default SearchBox
