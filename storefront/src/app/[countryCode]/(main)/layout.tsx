import { Metadata } from "next"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import { getBaseURL } from "@lib/util/env"
import { listRegions } from "@lib/data/regions"
import { getCustomer } from "@lib/data/customer"
import { getRegion } from "@lib/data/regions"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default async function PageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const regions = await listRegions()
  const customer = await getCustomer()
  const region = await getRegion()

  return (
    <>
      <Nav regions={regions} region={region} customer={customer} />
      {children}
      {/* @ts-expect-error Server Component */}
      <Footer />
    </>
  )
}
