-- Firm's own bank accounts. Visible to every employee; add/delete is
-- admin-only (enforced in middleware.ts via ADMIN_WRITE_APIS), same as
-- dsc_register.
CREATE TABLE IF NOT EXISTS bank_accounts (
  id BIGSERIAL PRIMARY KEY,
  bank_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Which firm bank account a payment was received into.
ALTER TABLE payments ADD COLUMN IF NOT EXISTS bank_account_id BIGINT REFERENCES bank_accounts(id) ON DELETE SET NULL;
