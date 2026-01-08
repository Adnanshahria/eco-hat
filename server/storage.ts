import { type User, type InsertUser } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;

  constructor() {
    this.users = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.users.size + 1; // Numeric ID like serial
    const user: User = {
      ...insertUser,
      id,
      userId: insertUser.userId ?? null,
      phone: insertUser.phone ?? null,
      role: insertUser.role ?? "buyer",
      isSuperAdmin: insertUser.isSuperAdmin ?? false,
      fullName: insertUser.fullName ?? null,
      avatarUrl: insertUser.avatarUrl ?? null,
      bio: insertUser.bio ?? null,
      savedAddresses: insertUser.savedAddresses ?? [],
      shopLocation: insertUser.shopLocation ?? null,
      shopType: insertUser.shopType ?? null,
      verificationStatus: insertUser.verificationStatus ?? "none",
      identityDocuments: insertUser.identityDocuments ?? null,
      rejectionReason: insertUser.rejectionReason ?? null,
      createdAt: new Date(),
    };
    this.users.set(id.toString(), user);
    return user;
  }
}

export const storage = new MemStorage();
