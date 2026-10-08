CREATE TYPE "public"."order_status" AS ENUM('a_confirmar', 'pendiente_pago', 'pagado', 'en_produccion', 'listo', 'enviado', 'entregado', 'cancelado');--> statement-breakpoint
CREATE TABLE "admin_users" (
	"email" text PRIMARY KEY NOT NULL,
	"name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "builder_options" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"group" text,
	"label" text NOT NULL,
	"description" text,
	"hex" text,
	"delta" integer DEFAULT 0 NOT NULL,
	"complexity" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "designs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"images" text[] DEFAULT '{}' NOT NULL,
	"shape" text NOT NULL,
	"length" text NOT NULL,
	"finish" text DEFAULT 'glossy' NOT NULL,
	"complexity" integer DEFAULT 1 NOT NULL,
	"price" integer NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"colors" text[] DEFAULT '{}' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "designs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seq" serial NOT NULL,
	"number" text NOT NULL,
	"token" text NOT NULL,
	"status" "order_status" DEFAULT 'pendiente_pago' NOT NULL,
	"customer" jsonb NOT NULL,
	"items" jsonb NOT NULL,
	"subtotal" integer NOT NULL,
	"delivery_method" text NOT NULL,
	"delivery_cost" integer DEFAULT 0 NOT NULL,
	"delivery_label" text NOT NULL,
	"address" jsonb,
	"payment_method" text NOT NULL,
	"mp_preference_id" text,
	"mp_payment_id" text,
	"mp_init_point" text,
	"total" integer NOT NULL,
	"needs_confirmation" boolean DEFAULT false NOT NULL,
	"tracking" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target" text NOT NULL,
	"label" text NOT NULL,
	"minutes" integer DEFAULT 0 NOT NULL,
	"usages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recipes_target_unique" UNIQUE("target")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"unit" text NOT NULL,
	"pack_cost" integer NOT NULL,
	"pack_qty" numeric(12, 3) NOT NULL,
	"supplier" text,
	"url" text,
	"notes" text,
	"active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
