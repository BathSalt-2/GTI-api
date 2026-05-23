import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  real,
  pgEnum,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Enums ─────────────────────────────────────────────────────────────

export const difficultyEnum = pgEnum("difficulty", [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
]);

export const missionStatusEnum = pgEnum("mission_status", [
  "available",
  "in_progress",
  "completed",
  "failed",
]);

export const matchStatusEnum = pgEnum("match_status", [
  "waiting",
  "in_progress",
  "completed",
  "cancelled",
]);

// ── Users ─────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: varchar("display_name", { length: 100 }),
  avatarUrl: text("avatar_url"),
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  rank: varchar("rank", { length: 50 }).default("Recruit"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Missions ──────────────────────────────────────────────────────────

export const missions = pgTable("missions", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  difficulty: difficultyEnum("difficulty").notNull(),
  xpReward: integer("xp_reward").notNull().default(100),
  timeLimit: integer("time_limit"), // seconds
  objectives: jsonb("objectives").notNull().default([]),
  prerequisites: jsonb("prerequisites").default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Mission Progress ──────────────────────────────────────────────────

export const missionProgress = pgTable(
  "mission_progress",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    missionId: integer("mission_id")
      .notNull()
      .references(() => missions.id, { onDelete: "cascade" }),
    status: missionStatusEnum("status").notNull().default("available"),
    score: real("score"),
    completedAt: timestamp("completed_at"),
    timeSpent: integer("time_spent"), // seconds
    attempts: integer("attempts").notNull().default(0),
    cognitiveMetrics: jsonb("cognitive_metrics").default({}),
    startedAt: timestamp("started_at").notNull().defaultNow(),
  },
  (table) => ({
    userMissionIdx: uniqueIndex("user_mission_idx").on(
      table.userId,
      table.missionId
    ),
  })
);

// ── PvP Matches ───────────────────────────────────────────────────────

export const pvpMatches = pgTable("pvp_matches", {
  id: serial("id").primaryKey(),
  challengerId: integer("challenger_id")
    .notNull()
    .references(() => users.id),
  opponentId: integer("opponent_id").references(() => users.id),
  winnerId: integer("winner_id").references(() => users.id),
  missionId: integer("mission_id").references(() => missions.id),
  status: matchStatusEnum("status").notNull().default("waiting"),
  challengerScore: real("challenger_score"),
  opponentScore: real("opponent_score"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

// ── Achievements ──────────────────────────────────────────────────────

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description").notNull(),
  iconUrl: text("icon_url"),
  xpReward: integer("xp_reward").notNull().default(50),
  criteria: jsonb("criteria").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userAchievements = pgTable(
  "user_achievements",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    achievementId: integer("achievement_id")
      .notNull()
      .references(() => achievements.id, { onDelete: "cascade" }),
    unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
  },
  (table) => ({
    userAchievementIdx: uniqueIndex("user_achievement_idx").on(
      table.userId,
      table.achievementId
    ),
  })
);

// ── Relations ─────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  missionProgress: many(missionProgress),
  achievements: many(userAchievements),
  challengedMatches: many(pvpMatches, { relationName: "challenger" }),
}));

export const missionsRelations = relations(missions, ({ many }) => ({
  progress: many(missionProgress),
}));

export const missionProgressRelations = relations(
  missionProgress,
  ({ one }) => ({
    user: one(users, {
      fields: [missionProgress.userId],
      references: [users.id],
    }),
    mission: one(missions, {
      fields: [missionProgress.missionId],
      references: [missions.id],
    }),
  })
);
