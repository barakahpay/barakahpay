import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

const timestamp = (name: string) =>
  integer(name, { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`);

// -----------------------------------------------------------------------------
// Users (senders + institution admins)
// -----------------------------------------------------------------------------

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    name: text('name').notNull(),
    role: text('role', { enum: ['sender', 'institution', 'admin'] }).notNull(),
    country: text('country'),
    stellarAddress: text('stellar_address'),
    emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
    createdAt: timestamp('created_at'),
    updatedAt: timestamp('updated_at'),
  },
  (table) => ({
    emailIdx: uniqueIndex('users_email_idx').on(table.email),
    roleIdx: index('users_role_idx').on(table.role),
  })
);

// -----------------------------------------------------------------------------
// Waitlist
// -----------------------------------------------------------------------------

export const waitlist = sqliteTable(
  'waitlist',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    role: text('role', { enum: ['sender', 'school', 'other'] }).notNull(),
    country: text('country').notNull(),
    locale: text('locale', { enum: ['en', 'ur'] }),
    source: text('source').default('landing'),
    ip: text('ip'),
    createdAt: timestamp('created_at'),
  },
  (table) => ({
    emailIdx: uniqueIndex('waitlist_email_idx').on(table.email),
    roleIdx: index('waitlist_role_idx').on(table.role),
    createdAtIdx: index('waitlist_created_at_idx').on(table.createdAt),
  })
);

// -----------------------------------------------------------------------------
// Institutions (mirrors on-chain registry + off-chain metadata)
// -----------------------------------------------------------------------------

export const institutions = sqliteTable(
  'institutions',
  {
    id: text('id').primaryKey(),
    onchainId: text('onchain_id').notNull(),
    name: text('name').notNull(),
    legalName: text('legal_name'),
    category: text('category', { enum: ['school', 'hospital', 'utility', 'grocery'] })
      .notNull()
      .default('school'),
    kybStatus: text('kyb_status', {
      enum: ['pending', 'verified', 'suspended', 'revoked'],
    })
      .notNull()
      .default('pending'),
    stellarAddress: text('stellar_address').notNull(),
    bankAccountHash: text('bank_account_hash').notNull(),
    location: text('location'),
    country: text('country').notNull().default('PK'),
    contactEmail: text('contact_email'),
    contactPhone: text('contact_phone'),
    registeredAt: timestamp('registered_at'),
    verifiedAt: integer('verified_at', { mode: 'timestamp' }),
    createdAt: timestamp('created_at'),
    updatedAt: timestamp('updated_at'),
  },
  (table) => ({
    onchainIdx: uniqueIndex('institutions_onchain_id_idx').on(table.onchainId),
    addressIdx: uniqueIndex('institutions_stellar_address_idx').on(table.stellarAddress),
    statusIdx: index('institutions_status_idx').on(table.kybStatus),
    categoryIdx: index('institutions_category_idx').on(table.category),
  })
);

// -----------------------------------------------------------------------------
// Transactions (mirrors on-chain escrow lifecycle)
// -----------------------------------------------------------------------------

export const transactions = sqliteTable(
  'transactions',
  {
    id: text('id').primaryKey(),
    onchainEscrowId: text('onchain_escrow_id').notNull(),
    senderId: text('sender_id')
      .notNull()
      .references(() => users.id),
    senderAddress: text('sender_address').notNull(),
    institutionId: text('institution_id')
      .notNull()
      .references(() => institutions.id),
    institutionAddress: text('institution_address').notNull(),
    tokenAddress: text('token_address').notNull(),
    amount: text('amount').notNull(),
    purpose: text('purpose', {
      enum: ['school_fees', 'medical', 'utility', 'grocery'],
    })
      .notNull()
      .default('school_fees'),
    reference: text('reference').notNull(),
    status: text('status', {
      enum: ['draft', 'pending_deposit', 'active', 'released', 'refunded', 'disputed'],
    })
      .notNull()
      .default('draft'),
    timeoutSeconds: integer('timeout_seconds').notNull(),
    timeoutAt: integer('timeout_at', { mode: 'timestamp' }).notNull(),
    proofHash: text('proof_hash'),
    depositTxHash: text('deposit_tx_hash'),
    createEscrowTxHash: text('create_escrow_tx_hash'),
    releaseTxHash: text('release_tx_hash'),
    refundTxHash: text('refund_tx_hash'),
    metadataJson: text('metadata_json'),
    createdAt: timestamp('created_at'),
    updatedAt: timestamp('updated_at'),
  },
  (table) => ({
    onchainIdx: uniqueIndex('transactions_onchain_escrow_id_idx').on(table.onchainEscrowId),
    senderIdx: index('transactions_sender_idx').on(table.senderId),
    institutionIdx: index('transactions_institution_idx').on(table.institutionId),
    statusIdx: index('transactions_status_idx').on(table.status),
    createdAtIdx: index('transactions_created_at_idx').on(table.createdAt),
  })
);

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Waitlist = typeof waitlist.$inferSelect;
export type NewWaitlist = typeof waitlist.$inferInsert;

export type Institution = typeof institutions.$inferSelect;
export type NewInstitution = typeof institutions.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
