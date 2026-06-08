import { Injectable, Inject } from '@nestjs/common';
import { eq, desc, and, asc } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { DB_TOKEN, type AppDatabase } from '../../db';
import { sessions, messages, modelSettings, providerConfigs } from '../../db/schema';
import { db } from '../../db';
import { I18nService } from '../../common/i18n/i18n.service';
import { I18nException } from '../../common/i18n/i18n.exception';
import type { CreateSessionDto } from './dto/create-session.dto';
import type { UpdateSessionDto } from './dto/update-session.dto';
import type { AddMessageDto } from './dto/add-message.dto';

@Injectable()
export class SessionsService {
  private readonly db: AppDatabase;

  constructor(
    private readonly i18n: I18nService,
    @Inject(DB_TOKEN) dbInstance?: AppDatabase,
  ) {
    this.db = dbInstance ?? db;
  }

  async getSessions() {
    const rows = this.db
      .select()
      .from(sessions)
      .orderBy(desc(sessions.updatedAt))
      .all();
    return { sessions: rows };
  }

  async createSession(dto: CreateSessionDto) {
    if (dto.providerKey && dto.modelId) {
      const provider = this.db
        .select()
        .from(providerConfigs)
        .where(eq(providerConfigs.key, dto.providerKey))
        .get();
      if (!provider) {
        throw new I18nException(400, 'errors.providerNotConnected', { key: dto.providerKey });
      }

      const modelKey = `${dto.providerKey}:${dto.modelId}`;
      const model = this.db
        .select()
        .from(modelSettings)
        .where(eq(modelSettings.id, modelKey))
        .get();
      if (!model || !model.enabled) {
        throw new I18nException(400, 'errors.modelNotEnabled', { key: modelKey });
      }
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    const defaultTitle = this.i18n.t('session.defaultTitle', this.i18n.currentLang());
    this.db.insert(sessions).values({
      id,
      title: dto.title ?? defaultTitle,
      providerKey: dto.providerKey ?? null,
      modelId: dto.modelId ?? null,
      enableThinking: dto.enableThinking ?? false,
      titleGenerated: false,
      createdAt: now,
      updatedAt: now,
    }).run();
    return { id, title: dto.title ?? defaultTitle, providerKey: dto.providerKey ?? null, modelId: dto.modelId ?? null, enableThinking: dto.enableThinking ?? false, createdAt: now, updatedAt: now };
  }

  async updateSession(id: string, dto: UpdateSessionDto) {
    const now = new Date().toISOString();
    const set: Record<string, unknown> = { updatedAt: now };
    if (dto.title !== undefined) set.title = dto.title;
    if (dto.providerKey !== undefined) set.providerKey = dto.providerKey;
    if (dto.modelId !== undefined) set.modelId = dto.modelId;
    if (dto.enableThinking !== undefined) set.enableThinking = dto.enableThinking;
    if (dto.titleGenerated !== undefined) set.titleGenerated = dto.titleGenerated;

    this.db.update(sessions).set(set as any).where(eq(sessions.id, id)).run();
  }

  async deleteSession(id: string) {
    this.db.delete(messages).where(eq(messages.sessionId, id)).run();
    this.db.delete(sessions).where(eq(sessions.id, id)).run();
  }

  async getMessages(sessionId: string, limit = 50, offset = 0) {
    const rows = this.db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(asc(messages.createdAt))
      .limit(limit)
      .offset(offset)
      .all();
    return {
      messages: rows.map((r) => ({
        id: r.id,
        role: r.role,
        parts: JSON.parse(r.parts),
        createdAt: r.createdAt,
      })),
    };
  }

  async addMessage(sessionId: string, dto: AddMessageDto) {
    this.db.insert(messages).values({
      id: dto.id,
      sessionId,
      role: dto.role,
      parts: JSON.stringify(dto.parts),
      createdAt: dto.createdAt,
    }).onConflictDoUpdate({
      target: messages.id,
      set: { parts: JSON.stringify(dto.parts) },
    }).run();

    const now = new Date().toISOString();
    this.db.update(sessions).set({ updatedAt: now }).where(eq(sessions.id, sessionId)).run();
  }

  async addMessages(sessionId: string, dtos: AddMessageDto[]) {
    const insertValues = dtos.map((dto) => ({
      id: dto.id,
      sessionId,
      role: dto.role,
      parts: JSON.stringify(dto.parts),
      createdAt: dto.createdAt,
    }));

    if (insertValues.length > 0) {
      this.db.insert(messages).values(insertValues).onConflictDoNothing().run();
    }

    const now = new Date().toISOString();
    this.db.update(sessions).set({ updatedAt: now }).where(eq(sessions.id, sessionId)).run();
  }

  async getAllMessages(sessionId: string) {
    const rows = this.db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(asc(messages.createdAt))
      .all();
    return rows.map((r) => ({
      id: r.id,
      role: r.role,
      parts: JSON.parse(r.parts),
      createdAt: r.createdAt,
    }));
  }
}
