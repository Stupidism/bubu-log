import { sql } from '@payloadcms/db-postgres'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "Baby" ADD COLUMN IF NOT EXISTS "full_name" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "Baby" DROP COLUMN IF EXISTS "full_name";
  `)
}
