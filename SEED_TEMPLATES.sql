-- Seed Task Templates for BFP Work
-- Run this in Supabase SQL Editor to populate templates with all CA firm tasks

-- 1. GST Monthly Return (GSTR-1 & 3B)
INSERT INTO task_templates (name, category, keyword) VALUES
('GST Monthly Return (GSTR-1 & 3B)', 'GST', 'GSTR-1, GSTR-3B');

-- Insert subtasks for template 1
INSERT INTO template_subtasks (template_id, text, sort_order) VALUES
((SELECT id FROM task_templates WHERE name = 'GST Monthly Return (GSTR-1 & 3B)' LIMIT 1), 'Collect sales register and purchase register', 1),
((SELECT id FROM task_templates WHERE name = 'GST Monthly Return (GSTR-1 & 3B)' LIMIT 1), 'Reconcile GSTR-2B with purchase books (ITC match)', 2),
((SELECT id FROM task_templates WHERE name = 'GST Monthly Return (GSTR-1 & 3B)' LIMIT 1), 'Identify and resolve ITC mismatches', 3),
((SELECT id FROM task_templates WHERE name = 'GST Monthly Return (GSTR-1 & 3B)' LIMIT 1), 'Prepare and validate GSTR-1 (outward supplies)', 4),
((SELECT id FROM task_templates WHERE name = 'GST Monthly Return (GSTR-1 & 3B)' LIMIT 1), 'Compute output tax, ITC, and net liability', 5),
((SELECT id FROM task_templates WHERE name = 'GST Monthly Return (GSTR-1 & 3B)' LIMIT 1), 'Prepare GSTR-3B summary', 6),
((SELECT id FROM task_templates WHERE name = 'GST Monthly Return (GSTR-1 & 3B)' LIMIT 1), 'Get client approval on tax payable', 7),
((SELECT id FROM task_templates WHERE name = 'GST Monthly Return (GSTR-1 & 3B)' LIMIT 1), 'File GSTR-1 on portal', 8),
((SELECT id FROM task_templates WHERE name = 'GST Monthly Return (GSTR-1 & 3B)' LIMIT 1), 'Pay tax and file GSTR-3B', 9),
((SELECT id FROM task_templates WHERE name = 'GST Monthly Return (GSTR-1 & 3B)' LIMIT 1), 'Save filed acknowledgements to client folder', 10);

-- 2. GST Annual Return (GSTR-9 / 9C)
INSERT INTO task_templates (name, category, keyword) VALUES
('GST Annual Return (GSTR-9 / 9C)', 'GST', 'GSTR-9, GSTR-9C');

INSERT INTO template_subtasks (template_id, text, sort_order) VALUES
((SELECT id FROM task_templates WHERE name = 'GST Annual Return (GSTR-9 / 9C)' LIMIT 1), 'Consolidate all monthly GSTR-1 and 3B for the year', 1),
((SELECT id FROM task_templates WHERE name = 'GST Annual Return (GSTR-9 / 9C)' LIMIT 1), 'Reconcile annual turnover with audited financials', 2),
((SELECT id FROM task_templates WHERE name = 'GST Annual Return (GSTR-9 / 9C)' LIMIT 1), 'Reconcile ITC claimed vs GSTR-2A/2B annual', 3),
((SELECT id FROM task_templates WHERE name = 'GST Annual Return (GSTR-9 / 9C)' LIMIT 1), 'Compute differences and additional liability', 4),
((SELECT id FROM task_templates WHERE name = 'GST Annual Return (GSTR-9 / 9C)' LIMIT 1), 'Prepare GSTR-9 (annual return)', 5),
((SELECT id FROM task_templates WHERE name = 'GST Annual Return (GSTR-9 / 9C)' LIMIT 1), 'Prepare GSTR-9C reconciliation statement (if applicable)', 6),
((SELECT id FROM task_templates WHERE name = 'GST Annual Return (GSTR-9 / 9C)' LIMIT 1), 'Get management sign-off', 7),
((SELECT id FROM task_templates WHERE name = 'GST Annual Return (GSTR-9 / 9C)' LIMIT 1), 'File GSTR-9 / 9C on portal', 8),
((SELECT id FROM task_templates WHERE name = 'GST Annual Return (GSTR-9 / 9C)' LIMIT 1), 'Archive acknowledgement', 9);

-- 3. Income Tax Return (ITR)
INSERT INTO task_templates (name, category, keyword) VALUES
('Income Tax Return (ITR)', 'Income Tax', 'ITR');

INSERT INTO template_subtasks (template_id, text, sort_order) VALUES
((SELECT id FROM task_templates WHERE name = 'Income Tax Return (ITR)' LIMIT 1), 'Collect Form 16 / 16A and financial statements', 1),
((SELECT id FROM task_templates WHERE name = 'Income Tax Return (ITR)' LIMIT 1), 'Download and reconcile Form 26AS', 2),
((SELECT id FROM task_templates WHERE name = 'Income Tax Return (ITR)' LIMIT 1), 'Reconcile AIS / TIS with books', 3),
((SELECT id FROM task_templates WHERE name = 'Income Tax Return (ITR)' LIMIT 1), 'Compute total income under all heads', 4),
((SELECT id FROM task_templates WHERE name = 'Income Tax Return (ITR)' LIMIT 1), 'Apply deductions (Chapter VI-A) and reliefs', 5),
((SELECT id FROM task_templates WHERE name = 'Income Tax Return (ITR)' LIMIT 1), 'Compute tax liability and interest (234A/B/C)', 6),
((SELECT id FROM task_templates WHERE name = 'Income Tax Return (ITR)' LIMIT 1), 'Prepare and review ITR computation', 7),
((SELECT id FROM task_templates WHERE name = 'Income Tax Return (ITR)' LIMIT 1), 'Get client confirmation', 8),
((SELECT id FROM task_templates WHERE name = 'Income Tax Return (ITR)' LIMIT 1), 'File ITR and e-verify', 9);

-- 4. TDS Return - 24Q (Salary)
INSERT INTO task_templates (name, category, keyword) VALUES
('TDS Return - 24Q (Salary)', 'TDS', '24Q');

INSERT INTO template_subtasks (template_id, text, sort_order) VALUES
((SELECT id FROM task_templates WHERE name = 'TDS Return - 24Q (Salary)' LIMIT 1), 'Collect salary details and deduction data', 1),
((SELECT id FROM task_templates WHERE name = 'TDS Return - 24Q (Salary)' LIMIT 1), 'Validate PAN of all deductees', 2),
((SELECT id FROM task_templates WHERE name = 'TDS Return - 24Q (Salary)' LIMIT 1), 'Reconcile TDS deducted vs deposited (challans)', 3),
((SELECT id FROM task_templates WHERE name = 'TDS Return - 24Q (Salary)' LIMIT 1), 'Prepare 24Q using RPU / software', 4),
((SELECT id FROM task_templates WHERE name = 'TDS Return - 24Q (Salary)' LIMIT 1), 'Validate FVU file', 5),
((SELECT id FROM task_templates WHERE name = 'TDS Return - 24Q (Salary)' LIMIT 1), 'File return on TRACES / portal', 6),
((SELECT id FROM task_templates WHERE name = 'TDS Return - 24Q (Salary)' LIMIT 1), 'Download and share Form 16 (Part A/B)', 7);

-- 5. TDS Return - 26Q (Non-Salary)
INSERT INTO task_templates (name, category, keyword) VALUES
('TDS Return - 26Q (Non-Salary)', 'TDS', '26Q');

INSERT INTO template_subtasks (template_id, text, sort_order) VALUES
((SELECT id FROM task_templates WHERE name = 'TDS Return - 26Q (Non-Salary)' LIMIT 1), 'Collect vendor payment and deduction details', 1),
((SELECT id FROM task_templates WHERE name = 'TDS Return - 26Q (Non-Salary)' LIMIT 1), 'Validate deductee PANs', 2),
((SELECT id FROM task_templates WHERE name = 'TDS Return - 26Q (Non-Salary)' LIMIT 1), 'Reconcile TDS deducted vs challans deposited', 3),
((SELECT id FROM task_templates WHERE name = 'TDS Return - 26Q (Non-Salary)' LIMIT 1), 'Prepare 26Q file', 4),
((SELECT id FROM task_templates WHERE name = 'TDS Return - 26Q (Non-Salary)' LIMIT 1), 'Validate FVU and correct errors', 5),
((SELECT id FROM task_templates WHERE name = 'TDS Return - 26Q (Non-Salary)' LIMIT 1), 'File return on portal', 6),
((SELECT id FROM task_templates WHERE name = 'TDS Return - 26Q (Non-Salary)' LIMIT 1), 'Download and issue Form 16A', 7);

-- 6. Statutory Audit
INSERT INTO task_templates (name, category, keyword) VALUES
('Statutory Audit', 'Audit', 'Audit');

INSERT INTO template_subtasks (template_id, text, sort_order) VALUES
((SELECT id FROM task_templates WHERE name = 'Statutory Audit' LIMIT 1), 'Obtain trial balance and prior-year financials', 1),
((SELECT id FROM task_templates WHERE name = 'Statutory Audit' LIMIT 1), 'Prepare and finalise audit plan', 2),
((SELECT id FROM task_templates WHERE name = 'Statutory Audit' LIMIT 1), 'Vouch major expense and income transactions', 3),
((SELECT id FROM task_templates WHERE name = 'Statutory Audit' LIMIT 1), 'Verify bank reconciliations and confirmations', 4),
((SELECT id FROM task_templates WHERE name = 'Statutory Audit' LIMIT 1), 'Verify fixed assets and depreciation', 5),
((SELECT id FROM task_templates WHERE name = 'Statutory Audit' LIMIT 1), 'Verify debtors/creditors with confirmations', 6),
((SELECT id FROM task_templates WHERE name = 'Statutory Audit' LIMIT 1), 'Review statutory compliances (GST, TDS, PF/ESI)', 7),
((SELECT id FROM task_templates WHERE name = 'Statutory Audit' LIMIT 1), 'Draft financial statements and notes', 8),
((SELECT id FROM task_templates WHERE name = 'Statutory Audit' LIMIT 1), 'Prepare audit report and get partner review', 9);

-- 7. Tax Audit (3CA/3CB-3CD)
INSERT INTO task_templates (name, category, keyword) VALUES
('Tax Audit (3CA/3CB-3CD)', 'Audit', '3CA, 3CB, 3CD');

INSERT INTO template_subtasks (template_id, text, sort_order) VALUES
((SELECT id FROM task_templates WHERE name = 'Tax Audit (3CA/3CB-3CD)' LIMIT 1), 'Verify applicability and turnover threshold', 1),
((SELECT id FROM task_templates WHERE name = 'Tax Audit (3CA/3CB-3CD)' LIMIT 1), 'Reconcile books with GST and TDS returns', 2),
((SELECT id FROM task_templates WHERE name = 'Tax Audit (3CA/3CB-3CD)' LIMIT 1), 'Verify Clause 44 GST expense breakup', 3),
((SELECT id FROM task_templates WHERE name = 'Tax Audit (3CA/3CB-3CD)' LIMIT 1), 'Prepare Form 3CD particulars', 4),
((SELECT id FROM task_templates WHERE name = 'Tax Audit (3CA/3CB-3CD)' LIMIT 1), 'Verify depreciation as per Income Tax Act', 5),
((SELECT id FROM task_templates WHERE name = 'Tax Audit (3CA/3CB-3CD)' LIMIT 1), 'Report disallowances (40A(3), 43B, etc.)', 6),
((SELECT id FROM task_templates WHERE name = 'Tax Audit (3CA/3CB-3CD)' LIMIT 1), 'Partner review of 3CD', 7),
((SELECT id FROM task_templates WHERE name = 'Tax Audit (3CA/3CB-3CD)' LIMIT 1), 'Upload and file audit report on portal', 8);

-- 8. ROC Annual Filing - AOC-4
INSERT INTO task_templates (name, category, keyword) VALUES
('ROC Annual Filing - AOC-4', 'ROC/Compliance', 'AOC-4');

INSERT INTO template_subtasks (template_id, text, sort_order) VALUES
((SELECT id FROM task_templates WHERE name = 'ROC Annual Filing - AOC-4' LIMIT 1), 'Obtain audited financial statements and board report', 1),
((SELECT id FROM task_templates WHERE name = 'ROC Annual Filing - AOC-4' LIMIT 1), 'Verify financials are signed and adopted in AGM', 2),
((SELECT id FROM task_templates WHERE name = 'ROC Annual Filing - AOC-4' LIMIT 1), 'Prepare AOC-4 form with financial data', 3),
((SELECT id FROM task_templates WHERE name = 'ROC Annual Filing - AOC-4' LIMIT 1), 'Attach board report, auditor report, AGM notice', 4),
((SELECT id FROM task_templates WHERE name = 'ROC Annual Filing - AOC-4' LIMIT 1), 'Get form certified by director and professional', 5),
((SELECT id FROM task_templates WHERE name = 'ROC Annual Filing - AOC-4' LIMIT 1), 'Upload and pay fees on MCA portal', 6),
((SELECT id FROM task_templates WHERE name = 'ROC Annual Filing - AOC-4' LIMIT 1), 'Save SRN and challan', 7);

-- 9. ROC Annual Filing - MGT-7 / 7A
INSERT INTO task_templates (name, category, keyword) VALUES
('ROC Annual Filing - MGT-7 / 7A', 'ROC/Compliance', 'MGT-7, MGT-7A');

INSERT INTO template_subtasks (template_id, text, sort_order) VALUES
((SELECT id FROM task_templates WHERE name = 'ROC Annual Filing - MGT-7 / 7A' LIMIT 1), 'Prepare list of shareholders and changes', 1),
((SELECT id FROM task_templates WHERE name = 'ROC Annual Filing - MGT-7 / 7A' LIMIT 1), 'Compile directors and KMP details', 2),
((SELECT id FROM task_templates WHERE name = 'ROC Annual Filing - MGT-7 / 7A' LIMIT 1), 'Capture shareholding pattern as on year-end', 3),
((SELECT id FROM task_templates WHERE name = 'ROC Annual Filing - MGT-7 / 7A' LIMIT 1), 'Prepare MGT-7 / 7A annual return', 4),
((SELECT id FROM task_templates WHERE name = 'ROC Annual Filing - MGT-7 / 7A' LIMIT 1), 'Cross-check with AOC-4 financials', 5),
((SELECT id FROM task_templates WHERE name = 'ROC Annual Filing - MGT-7 / 7A' LIMIT 1), 'Get director and professional certification', 6),
((SELECT id FROM task_templates WHERE name = 'ROC Annual Filing - MGT-7 / 7A' LIMIT 1), 'File on MCA portal and save SRN', 7);

-- 10. DIR-3 KYC (Director KYC)
INSERT INTO task_templates (name, category, keyword) VALUES
('DIR-3 KYC (Director KYC)', 'ROC/Compliance', 'DIR-3, KYC');

INSERT INTO template_subtasks (template_id, text, sort_order) VALUES
((SELECT id FROM task_templates WHERE name = 'DIR-3 KYC (Director KYC)' LIMIT 1), 'Collect director DIN, PAN, mobile, and email', 1),
((SELECT id FROM task_templates WHERE name = 'DIR-3 KYC (Director KYC)' LIMIT 1), 'Verify OTP-linked mobile and email', 2),
((SELECT id FROM task_templates WHERE name = 'DIR-3 KYC (Director KYC)' LIMIT 1), 'Confirm no change vs last filing (or use web KYC)', 3),
((SELECT id FROM task_templates WHERE name = 'DIR-3 KYC (Director KYC)' LIMIT 1), 'Prepare DIR-3 KYC form', 4),
((SELECT id FROM task_templates WHERE name = 'DIR-3 KYC (Director KYC)' LIMIT 1), 'Get DSC affixed and professional certification', 5),
((SELECT id FROM task_templates WHERE name = 'DIR-3 KYC (Director KYC)' LIMIT 1), 'File on portal before due date', 6),
((SELECT id FROM task_templates WHERE name = 'DIR-3 KYC (Director KYC)' LIMIT 1), 'Save acknowledgement', 7);

-- 11. DPT-3 (Return of Deposits)
INSERT INTO task_templates (name, category, keyword) VALUES
('DPT-3 (Return of Deposits)', 'ROC/Compliance', 'DPT-3');

INSERT INTO template_subtasks (template_id, text, sort_order) VALUES
((SELECT id FROM task_templates WHERE name = 'DPT-3 (Return of Deposits)' LIMIT 1), 'Identify outstanding loans and deposits as on 31 March', 1),
((SELECT id FROM task_templates WHERE name = 'DPT-3 (Return of Deposits)' LIMIT 1), 'Classify amounts as deposit / not-deposit', 2),
((SELECT id FROM task_templates WHERE name = 'DPT-3 (Return of Deposits)' LIMIT 1), 'Obtain auditor certificate where required', 3),
((SELECT id FROM task_templates WHERE name = 'DPT-3 (Return of Deposits)' LIMIT 1), 'Prepare DPT-3 return', 4),
((SELECT id FROM task_templates WHERE name = 'DPT-3 (Return of Deposits)' LIMIT 1), 'Get director and professional certification', 5),
((SELECT id FROM task_templates WHERE name = 'DPT-3 (Return of Deposits)' LIMIT 1), 'File on MCA portal', 6),
((SELECT id FROM task_templates WHERE name = 'DPT-3 (Return of Deposits)' LIMIT 1), 'Archive filed form and SRN', 7);

-- 12. ADT-1 (Auditor Appointment)
INSERT INTO task_templates (name, category, keyword) VALUES
('ADT-1 (Auditor Appointment)', 'ROC/Compliance', 'ADT-1');

INSERT INTO template_subtasks (template_id, text, sort_order) VALUES
((SELECT id FROM task_templates WHERE name = 'ADT-1 (Auditor Appointment)' LIMIT 1), 'Obtain auditor consent and eligibility certificate', 1),
((SELECT id FROM task_templates WHERE name = 'ADT-1 (Auditor Appointment)' LIMIT 1), 'Verify AGM resolution appointing auditor', 2),
((SELECT id FROM task_templates WHERE name = 'ADT-1 (Auditor Appointment)' LIMIT 1), 'Prepare ADT-1 form', 3),
((SELECT id FROM task_templates WHERE name = 'ADT-1 (Auditor Appointment)' LIMIT 1), 'Attach consent, resolution, and intimation letter', 4),
((SELECT id FROM task_templates WHERE name = 'ADT-1 (Auditor Appointment)' LIMIT 1), 'Get professional certification', 5),
((SELECT id FROM task_templates WHERE name = 'ADT-1 (Auditor Appointment)' LIMIT 1), 'File on MCA portal within 15 days of AGM', 6),
((SELECT id FROM task_templates WHERE name = 'ADT-1 (Auditor Appointment)' LIMIT 1), 'Save SRN and share with auditor', 7);

-- Verify templates were created
SELECT 'Template Count:' AS metric, COUNT(*) AS value FROM task_templates;
SELECT 'Total Subtasks:' AS metric, COUNT(*) AS value FROM template_subtasks;
