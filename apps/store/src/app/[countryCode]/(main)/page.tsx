import { Metadata } from "next"

import { getCatalog } from "@lib/data/store-catalog"
import HomeTemplate from "@modules/home/templates"

export const metadata: Metadata = {
  title: "Strengthiva — Modern Ayurvedic Essentials",
  description:
    "Classical Ayurvedic formulations, traceable and batch-tested — shop by category, by concern, or start with a free assessment.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const catalog = await getCatalog(countryCode)

  return <HomeTemplate catalog={catalog} />
}
