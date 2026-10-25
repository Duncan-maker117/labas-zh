CREATE TABLE "response_evaluation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"answer_id" uuid NOT NULL,
	"status" text NOT NULL,
	"claim_id" text NOT NULL,
	"score" integer,
	"feedback" jsonb,
	"model" text,
	"tokens_used" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "responseEvaluation_answer_unique" UNIQUE("answer_id")
);
--> statement-breakpoint
ALTER TABLE "response_evaluation" ADD CONSTRAINT "response_evaluation_answer_id_answer_id_fk" FOREIGN KEY ("answer_id") REFERENCES "public"."answer"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "section_type" ("id", "name") VALUES
  ('READING', 'Reading'), ('LISTENING', 'Listening'), ('WRITING', 'Writing'), ('SPEAKING', 'Speaking')
ON CONFLICT ("id") DO NOTHING;
