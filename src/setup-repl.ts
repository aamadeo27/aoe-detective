import { PrismaClient } from '@prisma/client'

globalThis.db = new PrismaClient()
