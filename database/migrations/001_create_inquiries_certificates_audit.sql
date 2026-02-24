-- Migration: Create inquiries, certificates, audit_logs for backend cert verification
-- Run in Supabase SQL Editor or via migration tool

-- inquiries: Persona Webhook writes here
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  payload JSONB,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inquiries_inquiry_id ON inquiries(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);

-- certificates: issued certs bound to user_id (auth.users from Supabase Auth)
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  inquiry_id TEXT NOT NULL UNIQUE,
  measurement JSONB NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL,
  nonce TEXT NOT NULL,
  signature TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_inquiry_id ON certificates(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_certificates_issued_at ON certificates(issued_at DESC);

-- audit_logs: compliance / audit trail
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  user_id UUID,
  inquiry_id TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- RLS: certificates readable only by owning user; backend uses service_role to bypass
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_certificates"
  ON certificates FOR SELECT
  USING (auth.uid() = user_id);

-- inquiries and audit_logs: backend-only (no SELECT policy = anon cannot read; service_role bypasses)
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE inquiries IS 'Persona webhook inquiry status; backend writes only';
COMMENT ON TABLE certificates IS 'Issued certificates; RLS allows user to read own rows';
COMMENT ON TABLE audit_logs IS 'Audit trail; backend only';
