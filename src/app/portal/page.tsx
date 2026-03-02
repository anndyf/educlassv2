
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import PortalClient from "./PortalClient"
import { getStudentPortalData } from "./actions"

export default async function PortalPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  if (!session.user.isPortalUser) {
    redirect("/dashboard")
  }

  const data = await getStudentPortalData()

  return <PortalClient initialData={data} user={session.user} />
}
