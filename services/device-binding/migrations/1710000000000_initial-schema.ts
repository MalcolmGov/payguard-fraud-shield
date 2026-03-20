/* eslint-disable @typescript-eslint/naming-convention */
import type { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // ── devices ──────────────────────────────────────────────────────────────
  pgm.createTable('devices', {
    id:              { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    fingerprint:     { type: 'varchar(64)', notNull: true, unique: true },
    device_model:    { type: 'varchar(100)' },
    os_version:      { type: 'varchar(50)' },
    app_version:     { type: 'varchar(20)' },
    is_rooted:       { type: 'boolean', default: false },
    is_emulator:     { type: 'boolean', default: false },
    is_jailbroken:   { type: 'boolean', default: false },
    created_at:      { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    last_seen_at:    { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('devices', 'fingerprint');
  pgm.createIndex('devices', 'created_at');

  // ── device_tokens ─────────────────────────────────────────────────────────
  pgm.createTable('device_tokens', {
    jti:          { type: 'uuid', primaryKey: true },
    device_id:    { type: 'uuid', notNull: true, references: '"devices"', onDelete: 'CASCADE' },
    user_id:      { type: 'varchar(128)', notNull: true },
    fingerprint:  { type: 'varchar(64)', notNull: true },
    issued_at:    { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    expires_at:   { type: 'timestamptz', notNull: true },
    revoked_at:   { type: 'timestamptz' },
    revoked_by:   { type: 'varchar(64)' },
  });
  pgm.createIndex('device_tokens', ['device_id', 'revoked_at']);
  pgm.createIndex('device_tokens', ['user_id', 'revoked_at']);

  // ── device_accounts ───────────────────────────────────────────────────────
  pgm.createTable('device_accounts', {
    id:                 { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    device_id:          { type: 'uuid', notNull: true, references: '"devices"', onDelete: 'CASCADE' },
    device_fingerprint: { type: 'varchar(64)', notNull: true },
    user_id:            { type: 'varchar(128)', notNull: true },
    trust_status:       { type: 'varchar(20)', notNull: true, default: "'new_device'" },
    trusted_at:         { type: 'timestamptz' },
    first_seen_at:      { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    last_seen_at:       { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('device_accounts', 'unique_device_user', 'UNIQUE(device_id, user_id)');
  pgm.createIndex('device_accounts', 'device_fingerprint');
  pgm.createIndex('device_accounts', 'user_id');

  // ── device_blacklist ──────────────────────────────────────────────────────
  pgm.createTable('device_blacklist', {
    id:              { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    fingerprint:     { type: 'varchar(64)', notNull: true, unique: true },
    reason:          { type: 'text' },
    fraud_case_id:   { type: 'varchar(64)' },
    blacklisted_by:  { type: 'varchar(128)' },
    blacklisted_at:  { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    expires_at:      { type: 'timestamptz' },
  });
  pgm.createIndex('device_blacklist', 'fingerprint');

  // ── device_ip_history ─────────────────────────────────────────────────────
  pgm.createTable('device_ip_history', {
    id:          { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    device_id:   { type: 'uuid', notNull: true, references: '"devices"', onDelete: 'CASCADE' },
    ip_address:  { type: 'varchar(45)', notNull: true },
    country:     { type: 'varchar(10)' },
    sim_country: { type: 'varchar(10)' },
    seen_at:     { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('device_ip_history', ['device_id', 'seen_at']);

  // ── device_fraud_reports ──────────────────────────────────────────────────
  pgm.createTable('device_fraud_reports', {
    id:          { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    device_id:   { type: 'uuid', notNull: true, references: '"devices"', onDelete: 'CASCADE' },
    reporter_id: { type: 'varchar(128)' },
    report_type: { type: 'varchar(50)' },
    description: { type: 'text' },
    reported_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('device_fraud_reports', 'device_id');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('device_fraud_reports');
  pgm.dropTable('device_ip_history');
  pgm.dropTable('device_blacklist');
  pgm.dropTable('device_accounts');
  pgm.dropTable('device_tokens');
  pgm.dropTable('devices');
}
