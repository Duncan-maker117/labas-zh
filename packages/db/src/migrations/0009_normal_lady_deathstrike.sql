CREATE TABLE "passage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"text" text NOT NULL,
	"title" text,
	"exam_type_id" text NOT NULL,
	"section_type_id" text NOT NULL,
	"creator_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "passage_id" uuid;--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "match_targets" jsonb;--> statement-breakpoint
ALTER TABLE "passage" ADD CONSTRAINT "passage_exam_type_id_exam_type_id_fk" FOREIGN KEY ("exam_type_id") REFERENCES "public"."exam_type"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passage" ADD CONSTRAINT "passage_section_type_id_section_type_id_fk" FOREIGN KEY ("section_type_id") REFERENCES "public"."section_type"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passage" ADD CONSTRAINT "passage_creator_user_id_user_id_fk" FOREIGN KEY ("creator_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "passage_creatorUserId_idx" ON "passage" USING btree ("creator_user_id");--> statement-breakpoint
CREATE INDEX "passage_examTypeId_idx" ON "passage" USING btree ("exam_type_id");--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_passage_id_passage_id_fk" FOREIGN KEY ("passage_id") REFERENCES "public"."passage"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "question_passageId_idx" ON "question" USING btree ("passage_id");