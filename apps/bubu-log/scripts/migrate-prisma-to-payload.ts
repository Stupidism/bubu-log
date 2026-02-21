import { Pool } from 'pg'
import type { Payload } from 'payload'
import { loadScriptEnv } from './utils/load-env'
import { getPayloadForScript } from './utils/payload-script'

loadScriptEnv({ preferPayloadDatabase: true })

const databaseURL = process.env.DATABASE_URL
if (!databaseURL) {
  throw new Error('DATABASE_URL is required')
}

const pool = new Pool({ connectionString: databaseURL })
let payloadClient: Payload | null = null

type CollectionSlug =
  | 'app-users'
  | 'babies'
  | 'baby-users'
  | 'activities'
  | 'daily-stats'
  | 'audit-logs'

type ColumnRename = {
  table: string
  from: string
  to: string
}

const COLUMN_RENAMES: ColumnRename[] = [
  { table: 'User', from: 'emailVerified', to: 'email_verified' },
  { table: 'User', from: 'createdAt', to: 'created_at' },
  { table: 'User', from: 'updatedAt', to: 'updated_at' },

  { table: 'Baby', from: 'avatarUrl', to: 'avatar_url' },
  { table: 'Baby', from: 'birthDate', to: 'birth_date' },
  { table: 'Baby', from: 'createdAt', to: 'created_at' },
  { table: 'Baby', from: 'updatedAt', to: 'updated_at' },

  { table: 'BabyUser', from: 'babyId', to: 'baby_id' },
  { table: 'BabyUser', from: 'userId', to: 'user_id' },
  { table: 'BabyUser', from: 'isDefault', to: 'is_default' },
  { table: 'BabyUser', from: 'createdAt', to: 'created_at' },

  { table: 'Activity', from: 'startTime', to: 'start_time' },
  { table: 'Activity', from: 'endTime', to: 'end_time' },
  { table: 'Activity', from: 'createdAt', to: 'created_at' },
  { table: 'Activity', from: 'updatedAt', to: 'updated_at' },
  { table: 'Activity', from: 'babyId', to: 'baby_id' },
  { table: 'Activity', from: 'hasPoop', to: 'has_poop' },
  { table: 'Activity', from: 'hasPee', to: 'has_pee' },
  { table: 'Activity', from: 'poopColor', to: 'poop_color' },
  { table: 'Activity', from: 'poopPhotoUrl', to: 'poop_photo_url' },
  { table: 'Activity', from: 'peeAmount', to: 'pee_amount' },
  { table: 'Activity', from: 'burpSuccess', to: 'burp_success' },
  { table: 'Activity', from: 'milkAmount', to: 'milk_amount' },
  { table: 'Activity', from: 'milkSource', to: 'milk_source' },
  { table: 'Activity', from: 'breastFirmness', to: 'breast_firmness' },
  { table: 'Activity', from: 'supplementType', to: 'supplement_type' },
  { table: 'Activity', from: 'spitUpType', to: 'spit_up_type' },

  { table: 'DailyStat', from: 'babyId', to: 'baby_id' },
  { table: 'DailyStat', from: 'sleepCount', to: 'sleep_count' },
  { table: 'DailyStat', from: 'totalSleepMinutes', to: 'total_sleep_minutes' },
  { table: 'DailyStat', from: 'breastfeedCount', to: 'breastfeed_count' },
  { table: 'DailyStat', from: 'totalBreastfeedMinutes', to: 'total_breastfeed_minutes' },
  { table: 'DailyStat', from: 'bottleCount', to: 'bottle_count' },
  { table: 'DailyStat', from: 'totalMilkAmount', to: 'total_milk_amount' },
  { table: 'DailyStat', from: 'pumpCount', to: 'pump_count' },
  { table: 'DailyStat', from: 'totalPumpMilkAmount', to: 'total_pump_milk_amount' },
  { table: 'DailyStat', from: 'diaperCount', to: 'diaper_count' },
  { table: 'DailyStat', from: 'poopCount', to: 'poop_count' },
  { table: 'DailyStat', from: 'peeCount', to: 'pee_count' },
  { table: 'DailyStat', from: 'exerciseCount', to: 'exercise_count' },
  { table: 'DailyStat', from: 'totalHeadLiftMinutes', to: 'total_head_lift_minutes' },
  { table: 'DailyStat', from: 'supplementADCount', to: 'supplement_a_d_count' },
  { table: 'DailyStat', from: 'supplementD3Count', to: 'supplement_d3_count' },
  { table: 'DailyStat', from: 'spitUpCount', to: 'spit_up_count' },
  { table: 'DailyStat', from: 'projectileSpitUpCount', to: 'projectile_spit_up_count' },
  { table: 'DailyStat', from: 'createdAt', to: 'created_at' },
  { table: 'DailyStat', from: 'updatedAt', to: 'updated_at' },

  { table: 'AuditLog', from: 'resourceType', to: 'resource_type' },
  { table: 'AuditLog', from: 'resourceId', to: 'resource_id' },
  { table: 'AuditLog', from: 'inputMethod', to: 'input_method' },
  { table: 'AuditLog', from: 'inputText', to: 'input_text' },
  { table: 'AuditLog', from: 'errorMessage', to: 'error_message' },
  { table: 'AuditLog', from: 'beforeData', to: 'before_data' },
  { table: 'AuditLog', from: 'afterData', to: 'after_data' },
  { table: 'AuditLog', from: 'babyId', to: 'baby_id' },
  { table: 'AuditLog', from: 'activityId', to: 'activity_id' },
  { table: 'AuditLog', from: 'userId', to: 'user_id' },
  { table: 'AuditLog', from: 'createdAt', to: 'created_at' },
]

async function columnExists(table: string, column: string): Promise<boolean> {
  const result = await pool.query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
          AND column_name = $2
      ) AS exists
    `,
    [table, column]
  )

  return Boolean(result.rows[0]?.exists)
}

async function tableExists(table: string): Promise<boolean> {
  const result = await pool.query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = $1
      ) AS exists
    `,
    [table]
  )

  return Boolean(result.rows[0]?.exists)
}

async function renameColumnsWithoutDataLoss() {
  let renamed = 0

  for (const mapping of COLUMN_RENAMES) {
    const fromExists = await columnExists(mapping.table, mapping.from)
    const toExists = await columnExists(mapping.table, mapping.to)

    if (!fromExists || toExists) {
      continue
    }

    await pool.query(
      `ALTER TABLE "${mapping.table}" RENAME COLUMN "${mapping.from}" TO "${mapping.to}"`
    )

    renamed += 1
    console.log(`  ✓ ${mapping.table}.${mapping.from} -> ${mapping.to}`)
  }

  return renamed
}

async function ensureCoreAppTablesWithoutDataLoss() {
  const ddlStatements = [
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_User_role') THEN
        CREATE TYPE "public"."enum_User_role" AS ENUM('ADMIN', 'DAD', 'MOM', 'NANNY', 'GRANDPARENT', 'OTHER');
      END IF;
    END $$;`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Baby_gender') THEN
        CREATE TYPE "public"."enum_Baby_gender" AS ENUM('BOY', 'GIRL', 'OTHER');
      END IF;
    END $$;`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Activity_type') THEN
        CREATE TYPE "public"."enum_Activity_type" AS ENUM('SLEEP', 'DIAPER', 'BREASTFEED', 'BOTTLE', 'PUMP', 'HEAD_LIFT', 'PASSIVE_EXERCISE', 'ROLL_OVER', 'PULL_TO_SIT', 'GAS_EXERCISE', 'BATH', 'OUTDOOR', 'EARLY_EDUCATION', 'SUPPLEMENT', 'SPIT_UP');
      END IF;
    END $$;`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Activity_poop_color') THEN
        CREATE TYPE "public"."enum_Activity_poop_color" AS ENUM('YELLOW', 'GREEN', 'BROWN', 'BLACK', 'WHITE', 'RED');
      END IF;
    END $$;`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Activity_pee_amount') THEN
        CREATE TYPE "public"."enum_Activity_pee_amount" AS ENUM('SMALL', 'MEDIUM', 'LARGE');
      END IF;
    END $$;`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Activity_milk_source') THEN
        CREATE TYPE "public"."enum_Activity_milk_source" AS ENUM('BREAST_MILK', 'FORMULA');
      END IF;
    END $$;`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Activity_breast_firmness') THEN
        CREATE TYPE "public"."enum_Activity_breast_firmness" AS ENUM('SOFT', 'ELASTIC', 'HARD');
      END IF;
    END $$;`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Activity_supplement_type') THEN
        CREATE TYPE "public"."enum_Activity_supplement_type" AS ENUM('AD', 'D3');
      END IF;
    END $$;`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Activity_spit_up_type') THEN
        CREATE TYPE "public"."enum_Activity_spit_up_type" AS ENUM('NORMAL', 'PROJECTILE');
      END IF;
    END $$;`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_AuditLog_action') THEN
        CREATE TYPE "public"."enum_AuditLog_action" AS ENUM('CREATE', 'UPDATE', 'DELETE');
      END IF;
    END $$;`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_AuditLog_resource_type') THEN
        CREATE TYPE "public"."enum_AuditLog_resource_type" AS ENUM('ACTIVITY');
      END IF;
    END $$;`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_AuditLog_input_method') THEN
        CREATE TYPE "public"."enum_AuditLog_input_method" AS ENUM('TEXT', 'VOICE');
      END IF;
    END $$;`,
    `CREATE TABLE IF NOT EXISTS "User" (
      "id" varchar PRIMARY KEY NOT NULL,
      "username" varchar NOT NULL,
      "password" varchar,
      "name" varchar,
      "email" varchar,
      "image" varchar,
      "email_verified" timestamp(3) with time zone,
      "role" "enum_User_role" DEFAULT 'OTHER' NOT NULL,
      "created_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone
    )`,
    `CREATE TABLE IF NOT EXISTS "Baby" (
      "id" varchar PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "avatar_url" varchar,
      "birth_date" timestamp(3) with time zone,
      "gender" "enum_Baby_gender" DEFAULT 'OTHER' NOT NULL,
      "created_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone
    )`,
    `CREATE TABLE IF NOT EXISTS "BabyUser" (
      "id" varchar PRIMARY KEY NOT NULL,
      "baby_id" varchar NOT NULL,
      "user_id" varchar NOT NULL,
      "is_default" boolean DEFAULT false,
      "created_at" timestamp(3) with time zone
    )`,
    `CREATE TABLE IF NOT EXISTS "Activity" (
      "id" varchar PRIMARY KEY NOT NULL,
      "type" "enum_Activity_type" NOT NULL,
      "start_time" timestamp(3) with time zone NOT NULL,
      "end_time" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone,
      "baby_id" varchar NOT NULL,
      "has_poop" boolean,
      "has_pee" boolean,
      "poop_color" "enum_Activity_poop_color",
      "poop_photo_url" varchar,
      "pee_amount" "enum_Activity_pee_amount",
      "burp_success" boolean,
      "milk_amount" numeric,
      "milk_source" "enum_Activity_milk_source",
      "breast_firmness" "enum_Activity_breast_firmness",
      "supplement_type" "enum_Activity_supplement_type",
      "spit_up_type" "enum_Activity_spit_up_type",
      "count" numeric,
      "notes" varchar
    )`,
    `CREATE TABLE IF NOT EXISTS "DailyStat" (
      "id" varchar PRIMARY KEY NOT NULL,
      "date" timestamp(3) with time zone NOT NULL,
      "baby_id" varchar NOT NULL,
      "sleep_count" numeric DEFAULT 0 NOT NULL,
      "total_sleep_minutes" numeric DEFAULT 0 NOT NULL,
      "breastfeed_count" numeric DEFAULT 0 NOT NULL,
      "total_breastfeed_minutes" numeric DEFAULT 0 NOT NULL,
      "bottle_count" numeric DEFAULT 0 NOT NULL,
      "total_milk_amount" numeric DEFAULT 0 NOT NULL,
      "pump_count" numeric DEFAULT 0 NOT NULL,
      "total_pump_milk_amount" numeric DEFAULT 0 NOT NULL,
      "diaper_count" numeric DEFAULT 0 NOT NULL,
      "poop_count" numeric DEFAULT 0 NOT NULL,
      "pee_count" numeric DEFAULT 0 NOT NULL,
      "exercise_count" numeric DEFAULT 0 NOT NULL,
      "total_head_lift_minutes" numeric DEFAULT 0 NOT NULL,
      "supplement_a_d_count" numeric DEFAULT 0 NOT NULL,
      "supplement_d3_count" numeric DEFAULT 0 NOT NULL,
      "spit_up_count" numeric DEFAULT 0 NOT NULL,
      "projectile_spit_up_count" numeric DEFAULT 0 NOT NULL,
      "created_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone
    )`,
    `CREATE TABLE IF NOT EXISTS "AuditLog" (
      "id" varchar PRIMARY KEY NOT NULL,
      "action" "enum_AuditLog_action" DEFAULT 'CREATE' NOT NULL,
      "resource_type" "enum_AuditLog_resource_type" DEFAULT 'ACTIVITY' NOT NULL,
      "resource_id" varchar,
      "input_method" "enum_AuditLog_input_method" NOT NULL,
      "input_text" varchar,
      "description" varchar,
      "success" boolean DEFAULT true NOT NULL,
      "error_message" varchar,
      "before_data" jsonb,
      "after_data" jsonb,
      "baby_id" varchar,
      "activity_id" varchar,
      "user_id" varchar,
      "created_at" timestamp(3) with time zone
    )`,
    `ALTER TABLE "BabyUser" ADD CONSTRAINT "BabyUser_baby_fk" FOREIGN KEY ("baby_id") REFERENCES "public"."Baby"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    `ALTER TABLE "BabyUser" ADD CONSTRAINT "BabyUser_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    `ALTER TABLE "Activity" ADD CONSTRAINT "Activity_baby_fk" FOREIGN KEY ("baby_id") REFERENCES "public"."Baby"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    `ALTER TABLE "DailyStat" ADD CONSTRAINT "DailyStat_baby_fk" FOREIGN KEY ("baby_id") REFERENCES "public"."Baby"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    `ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_baby_fk" FOREIGN KEY ("baby_id") REFERENCES "public"."Baby"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    `ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_activity_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."Activity"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    `ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "User_username_idx" ON "User" USING btree ("username")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_idx" ON "User" USING btree ("email")`,
    `CREATE INDEX IF NOT EXISTS "Baby_name_idx" ON "Baby" USING btree ("name")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "babyId_userId_idx" ON "BabyUser" USING btree ("baby_id", "user_id")`,
    `CREATE INDEX IF NOT EXISTS "BabyUser_baby_id_idx" ON "BabyUser" USING btree ("baby_id")`,
    `CREATE INDEX IF NOT EXISTS "BabyUser_user_id_idx" ON "BabyUser" USING btree ("user_id")`,
    `CREATE INDEX IF NOT EXISTS "Activity_baby_id_idx" ON "Activity" USING btree ("baby_id")`,
    `CREATE INDEX IF NOT EXISTS "Activity_type_idx" ON "Activity" USING btree ("type")`,
    `CREATE INDEX IF NOT EXISTS "Activity_start_time_idx" ON "Activity" USING btree ("start_time")`,
    `CREATE INDEX IF NOT EXISTS "Activity_created_at_idx" ON "Activity" USING btree ("created_at")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "babyId_date_idx" ON "DailyStat" USING btree ("baby_id", "date")`,
    `CREATE INDEX IF NOT EXISTS "DailyStat_baby_id_idx" ON "DailyStat" USING btree ("baby_id")`,
    `CREATE INDEX IF NOT EXISTS "DailyStat_date_idx" ON "DailyStat" USING btree ("date")`,
    `CREATE INDEX IF NOT EXISTS "AuditLog_baby_id_idx" ON "AuditLog" USING btree ("baby_id")`,
    `CREATE INDEX IF NOT EXISTS "AuditLog_user_id_idx" ON "AuditLog" USING btree ("user_id")`,
    `CREATE INDEX IF NOT EXISTS "AuditLog_created_at_idx" ON "AuditLog" USING btree ("created_at")`,
    `CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog" USING btree ("action")`,
    `CREATE INDEX IF NOT EXISTS "AuditLog_resource_type_idx" ON "AuditLog" USING btree ("resource_type")`,
    `CREATE INDEX IF NOT EXISTS "AuditLog_success_idx" ON "AuditLog" USING btree ("success")`,
  ]

  let executed = 0
  for (const statement of ddlStatements) {
    try {
      await pool.query(statement)
      executed += 1
    } catch (error) {
      const pgError = error as { code?: string }
      if (!['42710', '42P07', '42701'].includes(pgError.code || '')) {
        throw error
      }
    }
  }

  return executed
}

async function ensurePayloadSystemTablesWithoutDataLoss() {
  const ddlStatements = [
    `CREATE TABLE IF NOT EXISTS "cms_admins" (
      "id" serial PRIMARY KEY NOT NULL,
      "display_name" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "email" varchar NOT NULL,
      "reset_password_token" varchar,
      "reset_password_expiration" timestamp(3) with time zone,
      "salt" varchar,
      "hash" varchar,
      "login_attempts" numeric DEFAULT 0,
      "lock_until" timestamp(3) with time zone
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "cms_admins_email_idx" ON "cms_admins" USING btree ("email")`,
    `CREATE INDEX IF NOT EXISTS "cms_admins_updated_at_idx" ON "cms_admins" USING btree ("updated_at")`,
    `CREATE INDEX IF NOT EXISTS "cms_admins_created_at_idx" ON "cms_admins" USING btree ("created_at")`,

    `CREATE TABLE IF NOT EXISTS "cms_admins_sessions" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "created_at" timestamp(3) with time zone,
      "expires_at" timestamp(3) with time zone NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS "cms_admins_sessions_order_idx" ON "cms_admins_sessions" USING btree ("_order")`,
    `CREATE INDEX IF NOT EXISTS "cms_admins_sessions_parent_id_idx" ON "cms_admins_sessions" USING btree ("_parent_id")`,

    `CREATE TABLE IF NOT EXISTS "payload_kv" (
      "id" serial PRIMARY KEY NOT NULL,
      "key" varchar NOT NULL,
      "data" jsonb NOT NULL
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "payload_kv_key_idx" ON "payload_kv" USING btree ("key")`,

    `CREATE TABLE IF NOT EXISTS "payload_locked_documents" (
      "id" serial PRIMARY KEY NOT NULL,
      "global_slug" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug")`,
    `CREATE INDEX IF NOT EXISTS "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at")`,
    `CREATE INDEX IF NOT EXISTS "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at")`,

    `CREATE TABLE IF NOT EXISTS "payload_locked_documents_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "cms_admins_id" integer,
      "User_id" varchar,
      "Baby_id" varchar,
      "BabyUser_id" varchar,
      "Activity_id" varchar,
      "DailyStat_id" varchar,
      "AuditLog_id" varchar
    )`,
    `ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "cms_admins_id" integer`,
    `ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "User_id" varchar`,
    `ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "Baby_id" varchar`,
    `ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "BabyUser_id" varchar`,
    `ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "Activity_id" varchar`,
    `ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "DailyStat_id" varchar`,
    `ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "AuditLog_id" varchar`,
    `CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order")`,
    `CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id")`,
    `CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path")`,
    `CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_cms_admins_id_idx" ON "payload_locked_documents_rels" USING btree ("cms_admins_id")`,
    `CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_User_id_idx" ON "payload_locked_documents_rels" USING btree ("User_id")`,
    `CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_Baby_id_idx" ON "payload_locked_documents_rels" USING btree ("Baby_id")`,
    `CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_BabyUser_id_idx" ON "payload_locked_documents_rels" USING btree ("BabyUser_id")`,
    `CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_Activity_id_idx" ON "payload_locked_documents_rels" USING btree ("Activity_id")`,
    `CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_DailyStat_id_idx" ON "payload_locked_documents_rels" USING btree ("DailyStat_id")`,
    `CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_AuditLog_id_idx" ON "payload_locked_documents_rels" USING btree ("AuditLog_id")`,

    `CREATE TABLE IF NOT EXISTS "payload_preferences" (
      "id" serial PRIMARY KEY NOT NULL,
      "key" varchar,
      "value" jsonb,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key")`,
    `CREATE INDEX IF NOT EXISTS "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at")`,
    `CREATE INDEX IF NOT EXISTS "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at")`,

    `CREATE TABLE IF NOT EXISTS "payload_preferences_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "cms_admins_id" integer
    )`,
    `ALTER TABLE "payload_preferences_rels" ADD COLUMN IF NOT EXISTS "cms_admins_id" integer`,
    `CREATE INDEX IF NOT EXISTS "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order")`,
    `CREATE INDEX IF NOT EXISTS "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id")`,
    `CREATE INDEX IF NOT EXISTS "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path")`,
    `CREATE INDEX IF NOT EXISTS "payload_preferences_rels_cms_admins_id_idx" ON "payload_preferences_rels" USING btree ("cms_admins_id")`,

    `CREATE TABLE IF NOT EXISTS "payload_migrations" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar,
      "batch" numeric,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at")`,
    `CREATE INDEX IF NOT EXISTS "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at")`,
  ]

  let executed = 0
  for (const statement of ddlStatements) {
    await pool.query(statement)
    executed += 1
  }

  return executed
}

async function cleanupTmpProbeActivities() {
  if (!(await tableExists('Activity'))) {
    return
  }
  await pool.query(`DELETE FROM "Activity" WHERE id LIKE 'tmp-migrate-check-%'`)
}

async function verifyPayloadCollections() {
  payloadClient = await getPayloadForScript()

  const collections: CollectionSlug[] = [
    'app-users',
    'babies',
    'baby-users',
    'activities',
    'daily-stats',
    'audit-logs',
  ]

  console.log('\n📊 Payload collection counts:')

  for (const collection of collections) {
    const result = await payloadClient.count({
      collection,
      overrideAccess: true,
    })
    console.log(`  - ${collection}: ${result.totalDocs}`)
  }
}

async function main() {
  console.log('🧭 Start migration: Prisma schema -> Payload schema')
  console.log('🔒 Safety mode: only renaming columns in-place, no truncation/drop')

  const renamedCount = await renameColumnsWithoutDataLoss()

  if (renamedCount === 0) {
    console.log('ℹ️ No column rename needed (schema already normalized).')
  } else {
    console.log(`✅ Renamed ${renamedCount} columns.`)
  }

  const appDDLCount = await ensureCoreAppTablesWithoutDataLoss()
  console.log(`✅ Ensured app tables/indexes (${appDDLCount} DDL statements).`)

  const ddlCount = await ensurePayloadSystemTablesWithoutDataLoss()
  console.log(`✅ Ensured Payload system tables/indexes (${ddlCount} DDL statements).`)

  await cleanupTmpProbeActivities()
  await verifyPayloadCollections()

  console.log('\n✅ Migration completed without data deletion')
}

main()
  .catch((error) => {
    console.error('❌ Migration failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    if (payloadClient) {
      await payloadClient.destroy()
    }
    await pool.end()
    process.exit(process.exitCode ?? 0)
  })
