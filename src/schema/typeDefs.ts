import gql from "graphql-tag";

export const typeDefs = gql`
  # ── Enums ──────────────────────────────────────────────────────────

  enum Difficulty {
    BEGINNER
    INTERMEDIATE
    ADVANCED
    EXPERT
  }

  enum MissionStatus {
    AVAILABLE
    IN_PROGRESS
    COMPLETED
    FAILED
  }

  enum MatchStatus {
    WAITING
    IN_PROGRESS
    COMPLETED
    CANCELLED
  }

  # ── Types ──────────────────────────────────────────────────────────

  type User {
    id: Int!
    username: String!
    email: String!
    displayName: String
    avatarUrl: String
    xp: Int!
    level: Int!
    rank: String
    missionProgress: [MissionProgress!]!
    achievements: [Achievement!]!
    createdAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Mission {
    id: Int!
    title: String!
    description: String!
    category: String!
    difficulty: Difficulty!
    xpReward: Int!
    timeLimit: Int
    objectives: [String!]!
    isActive: Boolean!
    createdAt: String!
  }

  type MissionProgress {
    id: Int!
    user: User!
    mission: Mission!
    status: MissionStatus!
    score: Float
    completedAt: String
    timeSpent: Int
    attempts: Int!
    startedAt: String!
  }

  type PvPMatch {
    id: Int!
    challenger: User!
    opponent: User
    winner: User
    mission: Mission
    status: MatchStatus!
    challengerScore: Float
    opponentScore: Float
    createdAt: String!
    completedAt: String
  }

  type Achievement {
    id: Int!
    name: String!
    description: String!
    iconUrl: String
    xpReward: Int!
    unlockedAt: String
  }

  type LeaderboardEntry {
    user: User!
    rank: Int!
    xp: Int!
    missionsCompleted: Int!
  }

  # ── Inputs ─────────────────────────────────────────────────────────

  input RegisterInput {
    username: String!
    email: String!
    password: String!
    displayName: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input StartMissionInput {
    missionId: Int!
  }

  input CompleteMissionInput {
    missionId: Int!
    score: Float!
    timeSpent: Int!
  }

  input CreateMatchInput {
    missionId: Int
  }

  input JoinMatchInput {
    matchId: Int!
  }

  # ── Queries ────────────────────────────────────────────────────────

  type Query {
    # Auth
    me: User

    # Missions
    missions(category: String, difficulty: Difficulty): [Mission!]!
    mission(id: Int!): Mission

    # Progress
    myProgress: [MissionProgress!]!
    missionProgress(missionId: Int!): MissionProgress

    # Leaderboard
    leaderboard(limit: Int): [LeaderboardEntry!]!

    # PvP
    openMatches: [PvPMatch!]!
    myMatches: [PvPMatch!]!

    # Achievements
    myAchievements: [Achievement!]!
    allAchievements: [Achievement!]!
  }

  # ── Mutations ──────────────────────────────────────────────────────

  type Mutation {
    # Auth
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!

    # Missions
    startMission(input: StartMissionInput!): MissionProgress!
    completeMission(input: CompleteMissionInput!): MissionProgress!

    # PvP
    createMatch(input: CreateMatchInput!): PvPMatch!
    joinMatch(input: JoinMatchInput!): PvPMatch!
  }
`;
