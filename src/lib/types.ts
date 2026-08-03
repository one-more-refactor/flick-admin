/** corepanel — provider and page contracts.
 *
 * A panel is: an AuthProvider (how operators sign in) + a list of Pages
 * (what they see). corepanel renders everything else — login, shell, nav,
 * dashboards, resource tables, forms. No backend of its own: every byte of
 * data flows through the functions the host app supplies here.
 */

/** An authenticated operator session. Opaque to corepanel beyond these keys. */
export interface Session {
  /** Bearer/opaque credential the providers need for subsequent calls. */
  token: string;
  /** Shown in the sidebar session box ("root@myflick.app", "env token"). */
  label: string;
  /** Epoch seconds; corepanel logs the session out when it passes. */
  expires_at?: number;
}

export interface AuthProvider {
  login(email: string, password: string): Promise<Session>;
  /** Optional break-glass path: sign in with a raw token instead. */
  tokenLogin?(token: string): Promise<Session>;
  logout?(session: Session): Promise<void>;
  /** Revalidate a persisted session on boot; false ⇒ back to login. */
  check?(session: Session): Promise<boolean>;
}

// ---------------------------------------------------------------- widgets

/** One dashboard tile. `data` is whatever the dashboard's load() returned. */
export type Widget =
  | {
      type: 'stat';
      label: string;
      span?: 1 | 2 | 3 | 4;
      value: (data: unknown) => string | number;
      hint?: (data: unknown) => string;
    }
  | {
      type: 'line';
      label: string;
      span?: 1 | 2 | 3 | 4;
      series: (data: unknown) => Array<{ x: string; y: number }>;
    }
  | {
      type: 'bar';
      label: string;
      span?: 1 | 2 | 3 | 4;
      bars: (data: unknown) => Array<{ label: string; value: number }>;
    }
  | {
      type: 'list';
      label: string;
      span?: 1 | 2 | 3 | 4;
      header: string[];
      rows: (data: unknown) => string[][];
    };

// --------------------------------------------------------------- resources

export interface Column {
  key: string;
  label: string;
  /** Custom cell text; default is String(row[key] ?? ''). */
  render?: (row: any) => string;
  /** 'on' renders an accent chip, 'off' a dim one, null nothing. */
  badge?: (row: any) => 'on' | 'off' | null;
  /** Right-align (numbers). */
  num?: boolean;
}

export interface RowAction {
  label: string;
  /** Rendered in accent + asks "sure?" before running. */
  danger?: boolean;
  /** Hide the action for rows where this returns false. */
  when?: (row: any) => boolean;
  run: (session: Session, row: any) => Promise<void>;
}

export interface Resource {
  load(
    session: Session,
    query: { q: string; limit: number; offset: number }
  ): Promise<{ total: number; rows: any[] }>;
  columns: Column[];
  actions?: RowAction[];
  searchable?: boolean;
  pageSize?: number;
}

// ------------------------------------------------------------------ forms

export interface Field {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'toggle';
  placeholder?: string;
}

export interface FormDef {
  load(session: Session): Promise<Record<string, unknown>>;
  fields: Field[];
  save(session: Session, values: Record<string, unknown>): Promise<void>;
  description?: string;
}

// ------------------------------------------------------------------ pages

export type Page =
  | {
      kind: 'dashboard';
      id: string;
      label: string;
      load: (session: Session) => Promise<unknown>;
      widgets: Widget[];
      /** Re-fetch interval in seconds (omit = manual refresh only). */
      refresh?: number;
    }
  | { kind: 'resource'; id: string; label: string; resource: Resource }
  | { kind: 'form'; id: string; label: string; form: FormDef };

export interface PanelConfig {
  /** Wordmark in the sidebar; also the localStorage session key. */
  title: string;
  auth: AuthProvider;
  pages: Page[];
  /** Footer line under the nav (version, host, …). */
  footer?: string;
}
