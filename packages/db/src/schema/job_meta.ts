import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { topics } from "./topic";

export const jobMeta = pgTable("job_meta", {
  topicId: integer("topic_id")
    .primaryKey()
    .references(() => topics.id, { onDelete: "cascade" }),
  company: text("company").notNull(),
  companyLogo: text("company_logo"),
  position: text("position").notNull(),
  location: text("location").notNull(),
  remote: text("remote").notNull(),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  experience: text("experience"),
  techTags: text("tech_tags").array(),
  contact: text("contact").notNull(),
  createAt: timestamp("create_at").defaultNow(),
  updateAt: timestamp("update_at").defaultNow(),
});
