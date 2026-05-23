import { eq, desc, and, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "../models/db";
import * as schema from "../models/schema";
import { signToken, requireAuth, AuthContext } from "../middleware/auth";

interface Context {
  auth: AuthContext;
}

export const resolvers = {
  // ── Queries ───────────────────────────────────────────────────────

  Query: {
    me: async (_: unknown, __: unknown, ctx: Context) => {
      const userId = requireAuth(ctx.auth.userId);
      const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, userId))
        .limit(1);
      return user ?? null;
    },

    missions: async (
      _: unknown,
      args: { category?: string; difficulty?: string }
    ) => {
      const conditions = [eq(schema.missions.isActive, true)];
      if (args.category) {
        conditions.push(eq(schema.missions.category, args.category));
      }
      return db
        .select()
        .from(schema.missions)
        .where(and(...conditions))
        .orderBy(schema.missions.createdAt);
    },

    mission: async (_: unknown, args: { id: number }) => {
      const [mission] = await db
        .select()
        .from(schema.missions)
        .where(eq(schema.missions.id, args.id))
        .limit(1);
      return mission ?? null;
    },

    myProgress: async (_: unknown, __: unknown, ctx: Context) => {
      const userId = requireAuth(ctx.auth.userId);
      return db
        .select()
        .from(schema.missionProgress)
        .where(eq(schema.missionProgress.userId, userId));
    },

    missionProgress: async (
      _: unknown,
      args: { missionId: number },
      ctx: Context
    ) => {
      const userId = requireAuth(ctx.auth.userId);
      const [progress] = await db
        .select()
        .from(schema.missionProgress)
        .where(
          and(
            eq(schema.missionProgress.userId, userId),
            eq(schema.missionProgress.missionId, args.missionId)
          )
        )
        .limit(1);
      return progress ?? null;
    },

    leaderboard: async (_: unknown, args: { limit?: number }) => {
      const limit = args.limit ?? 50;
      const rows = await db
        .select({
          id: schema.users.id,
          username: schema.users.username,
          displayName: schema.users.displayName,
          avatarUrl: schema.users.avatarUrl,
          xp: schema.users.xp,
          level: schema.users.level,
          rank: schema.users.rank,
          createdAt: schema.users.createdAt,
        })
        .from(schema.users)
        .orderBy(desc(schema.users.xp))
        .limit(limit);

      return rows.map((user, index) => ({
        user,
        rank: index + 1,
        xp: user.xp,
        missionsCompleted: 0, // TODO: aggregate from missionProgress
      }));
    },

    openMatches: async () =>
      db
        .select()
        .from(schema.pvpMatches)
        .where(eq(schema.pvpMatches.status, "waiting")),

    myMatches: async (_: unknown, __: unknown, ctx: Context) => {
      const userId = requireAuth(ctx.auth.userId);
      return db
        .select()
        .from(schema.pvpMatches)
        .where(eq(schema.pvpMatches.challengerId, userId));
    },

    myAchievements: async (_: unknown, __: unknown, ctx: Context) => {
      const userId = requireAuth(ctx.auth.userId);
      const rows = await db
        .select({
          id: schema.achievements.id,
          name: schema.achievements.name,
          description: schema.achievements.description,
          iconUrl: schema.achievements.iconUrl,
          xpReward: schema.achievements.xpReward,
          unlockedAt: schema.userAchievements.unlockedAt,
        })
        .from(schema.userAchievements)
        .innerJoin(
          schema.achievements,
          eq(schema.userAchievements.achievementId, schema.achievements.id)
        )
        .where(eq(schema.userAchievements.userId, userId));
      return rows;
    },

    allAchievements: async () => db.select().from(schema.achievements),
  },

  // ── Mutations ─────────────────────────────────────────────────────

  Mutation: {
    register: async (
      _: unknown,
      args: {
        input: {
          username: string;
          email: string;
          password: string;
          displayName?: string;
        };
      }
    ) => {
      const { username, email, password, displayName } = args.input;
      const passwordHash = await bcrypt.hash(password, 12);

      const [user] = await db
        .insert(schema.users)
        .values({
          username,
          email,
          passwordHash,
          displayName: displayName ?? username,
        })
        .returning();

      return { token: signToken(user.id), user };
    },

    login: async (
      _: unknown,
      args: { input: { email: string; password: string } }
    ) => {
      const { email, password } = args.input;
      const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email))
        .limit(1);

      if (!user) throw new Error("Invalid credentials");

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) throw new Error("Invalid credentials");

      return { token: signToken(user.id), user };
    },

    startMission: async (
      _: unknown,
      args: { input: { missionId: number } },
      ctx: Context
    ) => {
      const userId = requireAuth(ctx.auth.userId);

      const [progress] = await db
        .insert(schema.missionProgress)
        .values({
          userId,
          missionId: args.input.missionId,
          status: "in_progress",
        })
        .onConflictDoUpdate({
          target: [schema.missionProgress.userId, schema.missionProgress.missionId],
          set: {
            status: "in_progress",
            attempts: sql`${schema.missionProgress.attempts} + 1`,
            startedAt: new Date(),
          },
        })
        .returning();

      return progress;
    },

    completeMission: async (
      _: unknown,
      args: { input: { missionId: number; score: number; timeSpent: number } },
      ctx: Context
    ) => {
      const userId = requireAuth(ctx.auth.userId);
      const { missionId, score, timeSpent } = args.input;

      // Update progress
      const [progress] = await db
        .update(schema.missionProgress)
        .set({
          status: "completed",
          score,
          timeSpent,
          completedAt: new Date(),
        })
        .where(
          and(
            eq(schema.missionProgress.userId, userId),
            eq(schema.missionProgress.missionId, missionId)
          )
        )
        .returning();

      if (!progress) throw new Error("Mission progress not found");

      // Award XP
      const [mission] = await db
        .select()
        .from(schema.missions)
        .where(eq(schema.missions.id, missionId))
        .limit(1);

      if (mission) {
        await db
          .update(schema.users)
          .set({ xp: sql`${schema.users.xp} + ${mission.xpReward}` })
          .where(eq(schema.users.id, userId));
      }

      return progress;
    },

    createMatch: async (
      _: unknown,
      args: { input: { missionId?: number } },
      ctx: Context
    ) => {
      const userId = requireAuth(ctx.auth.userId);
      const [match] = await db
        .insert(schema.pvpMatches)
        .values({
          challengerId: userId,
          missionId: args.input.missionId ?? null,
          status: "waiting",
        })
        .returning();
      return match;
    },

    joinMatch: async (
      _: unknown,
      args: { input: { matchId: number } },
      ctx: Context
    ) => {
      const userId = requireAuth(ctx.auth.userId);
      const [match] = await db
        .update(schema.pvpMatches)
        .set({ opponentId: userId, status: "in_progress" })
        .where(
          and(
            eq(schema.pvpMatches.id, args.input.matchId),
            eq(schema.pvpMatches.status, "waiting")
          )
        )
        .returning();

      if (!match) throw new Error("Match not available");
      return match;
    },
  },

  // ── Field resolvers ───────────────────────────────────────────────

  MissionProgress: {
    mission: async (parent: { missionId: number }) => {
      const [mission] = await db
        .select()
        .from(schema.missions)
        .where(eq(schema.missions.id, parent.missionId))
        .limit(1);
      return mission;
    },
    user: async (parent: { userId: number }) => {
      const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, parent.userId))
        .limit(1);
      return user;
    },
  },
};
