#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/409c0e117aad4f1871ba8dafabc01714d6dcf5c1bb5616ed10af703385aee053/contract';
import endContract from '../../snapshots/409c0e117aad4f1871ba8dafabc01714d6dcf5c1bb5616ed10af703385aee053/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'apis',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('end_time', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('peoples', 'text[]', {
            notNull: true,
            default: lit([]),
            codecRef: { codecId: 'pg/text@1', many: true },
          }),
          col('profile_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('slug_url', 'character varying(30)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 30 } },
          }),
          col('start_time', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('status', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('title', 'character varying(50)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 50 } },
          }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('url_base', 'character varying(100)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 100 } },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'apis_peoples_elem_not_null_c694cff5',
            'array_position("peoples", NULL) IS NULL',
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'audit_logs',
        columns: [
          col('author_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('changed_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('name', 'character varying(100)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 100 } },
          }),
          col('what_changed', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'banks',
        columns: [
          col('balance', 'numeric(10,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
          }),
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'character varying(100)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 100 } },
          }),
          col('profile_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'events',
        columns: [
          col('all_day', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('attendees', 'text[]', {
            notNull: true,
            default: lit([]),
            codecRef: { codecId: 'pg/text@1', many: true },
          }),
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('end_at', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('end_date', 'date', { codecRef: { codecId: 'pg/date-temporal@1' } }),
          col('etag', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('google_calendar_id', 'character varying(255)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 255 } },
          }),
          col('google_event_id', 'character varying(255)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 255 } },
          }),
          col('html_link', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('location', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'character varying(255)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 255 } },
          }),
          col('profile_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('recurrence', 'text[]', {
            notNull: true,
            default: lit([]),
            codecRef: { codecId: 'pg/text@1', many: true },
          }),
          col('recurring_event_id', 'character varying(255)', {
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 255 } },
          }),
          col('start_at', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('start_date', 'date', { codecRef: { codecId: 'pg/date-temporal@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('confirmed'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('time_zone', 'character varying(64)', {
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 64 } },
          }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'events_attendees_elem_not_null_75685dad',
            'array_position("attendees", NULL) IS NULL',
          ),
          checkExpression(
            'events_recurrence_elem_not_null_99e061d7',
            'array_position("recurrence", NULL) IS NULL',
          ),
          checkExpression(
            'events_status_check_89084d85',
            "\"status\" IN ('confirmed', 'tentative', 'cancelled')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'finances',
        columns: [
          col('bank_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('currency', 'character varying(3)', {
            notNull: true,
            default: lit('BRL'),
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 3 } },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'character varying(100)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 100 } },
          }),
          col('paid_at', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('peoples', 'text[]', {
            notNull: true,
            default: lit([]),
            codecRef: { codecId: 'pg/text@1', many: true },
          }),
          col('profile_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('tag_id', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('type', 'text', {
            notNull: true,
            default: lit('inflow'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('url', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('value', 'numeric(10,2)', {
            notNull: true,
            default: fn("'0'::numeric(10,2)"),
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'finances_peoples_elem_not_null_c694cff5',
            'array_position("peoples", NULL) IS NULL',
          ),
          checkExpression(
            'finances_type_check_1d2db729',
            "\"type\" IN ('outflow', 'inflow', 'transfer')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'profiles',
        columns: [
          col('bio', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('email', 'character varying(100)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 100 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('slug_url', 'character varying(30)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 30 } },
          }),
          col('status', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('url_photo', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('user_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('username', 'character varying(100)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 100 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'refresh_tokens',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('expires_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('previous_token_id', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('session_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('token_hash', 'character varying(64)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 64 } },
          }),
          col('user_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'sessions',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('revoked_at', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('revoked_reason', 'character varying(20)', {
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 20 } },
          }),
          col('user_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'tags',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'character varying(30)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 30 } },
          }),
          col('profile_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('slug_url', 'character varying(40)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 40 } },
          }),
          col('status', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'tasks',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('done', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('end_time', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('observations', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('peoples', 'text[]', {
            notNull: true,
            default: lit([]),
            codecRef: { codecId: 'pg/text@1', many: true },
          }),
          col('priority', 'text', {
            notNull: true,
            default: lit('medium'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('profile_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('scheduled_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('start_time', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('status', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('title', 'character varying(50)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 50 } },
          }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'tasks_peoples_elem_not_null_c694cff5',
            'array_position("peoples", NULL) IS NULL',
          ),
          checkExpression(
            'tasks_priority_check_389bff97',
            "\"priority\" IN ('low', 'medium', 'urgent', 'archived')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'tasks_tags',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('tag_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('task_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['task_id', 'tag_id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'users',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('email', 'character varying(100)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 100 } },
          }),
          col('hash_password', 'character varying(255)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 255 } },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'character varying(255)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 255 } },
          }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'apis',
        constraint: 'apis_profile_id_title_key',
        columns: ['profile_id', 'title'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'banks',
        constraint: 'banks_profile_id_name_key',
        columns: ['profile_id', 'name'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'events',
        constraint: 'events_profile_id_google_calendar_id_google_event_id_key',
        columns: ['profile_id', 'google_calendar_id', 'google_event_id'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'profiles',
        constraint: 'profiles_user_id_key',
        columns: ['user_id'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'profiles',
        constraint: 'profiles_username_key',
        columns: ['username'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'profiles',
        constraint: 'profiles_slug_url_key',
        columns: ['slug_url'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'refresh_tokens',
        constraint: 'refresh_tokens_previous_token_id_key',
        columns: ['previous_token_id'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'refresh_tokens',
        constraint: 'refresh_tokens_token_hash_key',
        columns: ['token_hash'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'tags',
        constraint: 'tags_profile_id_name_key',
        columns: ['profile_id', 'name'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'tags',
        constraint: 'tags_profile_id_slug_url_key',
        columns: ['profile_id', 'slug_url'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'users',
        constraint: 'users_email_key',
        columns: ['email'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'apis',
        index: 'apis_profile_id_idx_ff36b76a',
        columns: ['profile_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'audit_logs',
        index: 'audit_logs_author_id_changed_at_idx_891b0749',
        columns: ['author_id', 'changed_at'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'audit_logs',
        index: 'audit_logs_author_id_idx_f3862461',
        columns: ['author_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'audit_logs',
        index: 'audit_logs_name_changed_at_idx_6bb80fff',
        columns: ['name', 'changed_at'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'banks',
        index: 'banks_profile_id_idx_ff36b76a',
        columns: ['profile_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'events',
        index: 'events_profile_id_idx_ff36b76a',
        columns: ['profile_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'events',
        index: 'events_profile_id_start_at_idx_19641f7c',
        columns: ['profile_id', 'start_at'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'events',
        index: 'events_profile_id_start_date_idx_a4990290',
        columns: ['profile_id', 'start_date'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'events',
        index: 'events_profile_id_status_idx_3cf35723',
        columns: ['profile_id', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'finances',
        index: 'finances_bank_id_idx_a1a980e6',
        columns: ['bank_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'finances',
        index: 'finances_bank_id_paid_at_idx_50cd4303',
        columns: ['bank_id', 'paid_at'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'finances',
        index: 'finances_profile_id_idx_ff36b76a',
        columns: ['profile_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'finances',
        index: 'finances_profile_id_name_idx_c80a85b8',
        columns: ['profile_id', 'name'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'finances',
        index: 'finances_tag_id_idx_94b47830',
        columns: ['tag_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'profiles',
        index: 'profiles_email_idx_46df9cad',
        columns: ['email'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'refresh_tokens',
        index: 'refresh_tokens_session_id_idx_00ba47bf',
        columns: ['session_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'refresh_tokens',
        index: 'refresh_tokens_user_id_idx_6c952402',
        columns: ['user_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'sessions',
        index: 'sessions_user_id_idx_6c952402',
        columns: ['user_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'tags',
        index: 'tags_profile_id_idx_ff36b76a',
        columns: ['profile_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'tags',
        index: 'tags_profile_id_status_idx_3cf35723',
        columns: ['profile_id', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'tasks',
        index: 'tasks_profile_id_idx_ff36b76a',
        columns: ['profile_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'tasks_tags',
        index: 'tasks_tags_tag_id_idx_94b47830',
        columns: ['tag_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'tasks_tags',
        index: 'tasks_tags_task_id_idx_5d5ac774',
        columns: ['task_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'users',
        index: 'users_name_idx_ce87e6ba',
        columns: ['name'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'apis',
        foreignKey: {
          name: 'apis_profile_id_fkey',
          columns: ['profile_id'],
          references: { schema: 'public', table: 'profiles', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'audit_logs',
        foreignKey: {
          name: 'audit_logs_author_id_fkey',
          columns: ['author_id'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'banks',
        foreignKey: {
          name: 'banks_profile_id_fkey',
          columns: ['profile_id'],
          references: { schema: 'public', table: 'profiles', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'events',
        foreignKey: {
          name: 'events_profile_id_fkey',
          columns: ['profile_id'],
          references: { schema: 'public', table: 'profiles', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'finances',
        foreignKey: {
          name: 'finances_profile_id_fkey',
          columns: ['profile_id'],
          references: { schema: 'public', table: 'profiles', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'finances',
        foreignKey: {
          name: 'finances_bank_id_fkey',
          columns: ['bank_id'],
          references: { schema: 'public', table: 'banks', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'finances',
        foreignKey: {
          name: 'finances_tag_id_fkey',
          columns: ['tag_id'],
          references: { schema: 'public', table: 'tags', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'profiles',
        foreignKey: {
          name: 'profiles_user_id_fkey',
          columns: ['user_id'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'refresh_tokens',
        foreignKey: {
          name: 'refresh_tokens_session_id_fkey',
          columns: ['session_id'],
          references: { schema: 'public', table: 'sessions', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'refresh_tokens',
        foreignKey: {
          name: 'refresh_tokens_user_id_fkey',
          columns: ['user_id'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'refresh_tokens',
        foreignKey: {
          name: 'refresh_tokens_previous_token_id_fkey',
          columns: ['previous_token_id'],
          references: { schema: 'public', table: 'refresh_tokens', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'sessions',
        foreignKey: {
          name: 'sessions_user_id_fkey',
          columns: ['user_id'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'tags',
        foreignKey: {
          name: 'tags_profile_id_fkey',
          columns: ['profile_id'],
          references: { schema: 'public', table: 'profiles', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'tasks',
        foreignKey: {
          name: 'tasks_profile_id_fkey',
          columns: ['profile_id'],
          references: { schema: 'public', table: 'profiles', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'tasks_tags',
        foreignKey: {
          name: 'tasks_tags_task_id_fkey',
          columns: ['task_id'],
          references: { schema: 'public', table: 'tasks', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'tasks_tags',
        foreignKey: {
          name: 'tasks_tags_tag_id_fkey',
          columns: ['tag_id'],
          references: { schema: 'public', table: 'tags', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
