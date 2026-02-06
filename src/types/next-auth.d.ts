import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      username: string
      isSuperuser: boolean
      isDirecao: boolean
      isStaff: boolean
    } & DefaultSession["user"]
  }

  interface User {
    username: string
    isSuperuser: boolean
    isDirecao: boolean
    isStaff: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    username: string
    isSuperuser: boolean
    isDirecao: boolean
    isStaff: boolean
  }
}
