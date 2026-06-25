# Client Import/Export Testing Guide

## Overview

Bulk import and export functionality for Client Master allows users to:
- Export all clients to Excel file
- Import clients from Excel with duplicate handling options
- Automatically parse KMP (Key Managerial Persons) data
- Handle errors and show detailed results

## Features

### Export Page (`/clients/export`)
- Shows current client count
- One-click Excel download
- File naming: `clients_[YYYY-MM-DD].xlsx`
- Tracks past 5 exports
- Includes columns: Client Name, Type, Mobile, Address, Lead Employee, KMP, Documents

### Import Page (`/clients/import`)
- Drag-and-drop file upload
- File preview with row count
- Duplicate detection (new vs existing clients)
- Three duplicate handling options:
  1. Skip duplicates (don't re-import)
  2. Update existing clients
- Results modal with statistics
- Detailed error reporting

## Database Tables

- `clients`: id, name, type, mobile, lead_employee_id, address, created_at, updated_at
- `client_kmp`: id, client_id, name, designation, mobile, created_at
- `employees`: id, name (used for lead_employee_id matching)

## Excel File Format

### Columns Required:
```
A: Client Name (required)
B: Type
C: Mobile
D: Address
E: Lead Employee (matched by employee name)
F: KMP (special format below)
G: Documents
```

### KMP Format:
Semicolon-separated list of key managerial persons.
Each person: `Name|Designation|Mobile`

Example:
```
John Doe|Director|+91 99999 88888;Jane Smith|Manager|+91 88888 77777
```

Becomes:
- KMP 1: Name="John Doe", Designation="Director", Mobile="+91 99999 88888"
- KMP 2: Name="Jane Smith", Designation="Manager", Mobile="+91 88888 77777"

### Example Row:
```
Client Name: ABC Pvt Ltd
Type: Pvt Ltd
Mobile: +91 98765 43210
Address: 123 Business Park, Mumbai
Lead Employee: John (matches employee with name containing "John")
KMP: John Doe|Director|+91 99999 88888;Jane Smith|Manager|+91 88888 77777
Documents: doc1.pdf,doc2.pdf
```

## Testing Steps

### Step 1: Access Export Page

1. Navigate to `/clients`
2. Click "📥 Export to Excel" button
3. ✅ Should see:
   - Current client count displayed
   - Download Excel button
   - Past exports section (initially empty)

### Step 2: Download Excel File

1. Click "📥 Download Excel" button
2. ✅ Excel file downloads with name pattern: `clients_2026-06-25.xlsx`
3. ✅ File contains all current clients
4. ✅ Past exports list updates with new entry

### Step 3: Verify Excel Contents

Open the downloaded file and check:

```
Column A (Client Name): "ABC Pvt Ltd"
Column B (Type): "Pvt Ltd"
Column C (Mobile): "+91 98765 43210"
Column D (Address): "123 Business Park, Mumbai, Maharashtra"
Column E (Lead Employee): "John Smith" (employee name)
Column F (KMP): "John Doe|Director|+91 99999 88888;Jane Smith|Manager|+91 88888 77777"
Column G (Documents): ""
```

✅ All client data present
✅ KMP format correct (semicolon-separated, pipe-delimited)
✅ Lead Employee shows employee name (not ID)

### Step 4: Access Import Page

1. Navigate to `/clients`
2. Click "📤 Import from Excel" button
3. ✅ Should see:
   - Drag-and-drop file upload area
   - Format instructions
   - File input button

### Step 5: Test Drag-and-Drop Upload

1. Drag a valid Excel file onto the upload area
2. ✅ File is accepted
3. ✅ Preview shows:
   - Filename
   - Row count
   - Number of new clients
   - Number of existing clients

### Step 6: Test File Selection

1. Click "Choose File" button
2. Select an Excel file from computer
3. ✅ Same preview appears as drag-and-drop

### Step 7: Test Invalid File

1. Try to upload a non-Excel file (e.g., PDF, CSV)
2. ✅ Shows error: "Please select an Excel file"

### Step 8: Test Import - Skip Duplicates

**Setup:** Create test file with:
- 2 new clients (names that don't exist in database)
- 1 existing client (name that already exists)

**Steps:**
1. Upload the file
2. ✅ Preview shows: 2 new, 1 existing
3. Select "Skip duplicates" (default)
4. Click "✓ Start Import"
5. ✅ Results modal shows:
   - New Added: 2
   - Updated: 0
   - Skipped: 1
   - Total Processed: 3

**Database Check:**
```sql
SELECT * FROM clients 
WHERE created_at > NOW() - INTERVAL '1 minute'
ORDER BY created_at DESC;
```
✅ Shows 2 new clients added

### Step 9: Test Import - Update Existing

**Setup:** Create test file with:
- 1 existing client (with updated data)
- Example: change mobile or address

**Steps:**
1. Upload the file
2. ✅ Preview shows: 0 new, 1 existing
3. Select "Update existing clients"
4. Click "✓ Start Import"
5. ✅ Results modal shows:
   - New Added: 0
   - Updated: 1
   - Skipped: 0
   - Total Processed: 1

**Database Check:**
```sql
SELECT * FROM clients 
WHERE name = 'ABC Pvt Ltd'
ORDER BY updated_at DESC LIMIT 1;
```
✅ Shows updated_at changed with new data

### Step 10: Test KMP Parsing

**Setup:** Create test file with client containing KMP data:
```
Client Name: Test Corp
KMP: Alice|VP|+91 11111 11111;Bob|Manager|+91 22222 22222
```

**Steps:**
1. Upload file
2. Click "✓ Start Import"
3. Wait for completion

**Database Check:**
```sql
SELECT * FROM client_kmp 
WHERE client_id = (SELECT id FROM clients WHERE name = 'Test Corp')
ORDER BY created_at;
```
✅ Shows 2 KMP records:
- name: Alice, designation: VP, mobile: +91 11111 11111
- name: Bob, designation: Manager, mobile: +91 22222 22222

### Step 11: Test Lead Employee Mapping

**Setup:** Create test file with:
```
Client Name: Employee Test
Lead Employee: John Smith
```
(Assuming "John Smith" is an existing employee name)

**Steps:**
1. Upload file
2. Click "✓ Start Import"
3. Wait for completion

**Database Check:**
```sql
SELECT c.name, e.name as lead_employee 
FROM clients c
LEFT JOIN employees e ON c.lead_employee_id = e.id
WHERE c.name = 'Employee Test';
```
✅ Shows lead_employee = "John Smith" (not null)

**If employee doesn't exist:**
✅ Shows lead_employee_id = null (no error)

### Step 12: Test Error Handling

**Setup:** Create test file with errors:
- Row 1: Missing client name (blank)
- Row 2: Invalid employee name in Lead Employee
- Row 3: Malformed KMP data

**Steps:**
1. Upload file
2. Select duplicate handling
3. Click "✓ Start Import"
4. Wait for completion

**Results:**
✅ Import completes (doesn't crash)
✅ Results modal shows errors section
✅ Each error listed with row number and issue

Example errors:
```
Row 1: Missing client name
Row 2: Invalid KMP format (Client Name)
```

### Step 13: Test Results Modal

After successful import:
- ✅ Shows 4 stat cards (New, Updated, Skipped, Total)
- ✅ Shows duration (e.g., "2.34s")
- ✅ Lists any errors with details
- ✅ "Close & Refresh Client List" button available

Clicking button:
- ✅ Modal closes
- ✅ Redirects to `/clients`
- ✅ Client list refreshed with newly imported clients

### Step 14: Test Large File Import

**Setup:** Create Excel file with 500+ clients

**Steps:**
1. Upload file
2. Click "✓ Start Import"
3. Monitor:
   - ✅ Import button shows "Importing..." state
   - ✅ Progress is smooth (no UI freeze)
   - ✅ Completes in reasonable time (<10 seconds)

## Test Cases

- [ ] Export downloads all clients
- [ ] Export file has correct columns
- [ ] Export filename includes date
- [ ] Past exports list shows 5 most recent
- [ ] Import accepts Excel files
- [ ] Import rejects non-Excel files
- [ ] Drag-and-drop upload works
- [ ] File selection dialog works
- [ ] Preview shows correct counts
- [ ] Skip duplicates works
- [ ] Update existing works
- [ ] KMP parsing works (semicolon + pipe separation)
- [ ] Lead Employee name matching works
- [ ] Missing name shows error
- [ ] Invalid employee name handled gracefully
- [ ] Results modal shows all stats
- [ ] Errors are listed with details
- [ ] Close button refreshes client list
- [ ] Large files import successfully

## Database Integration

### Export Process:
```
1. Query all clients → SELECT * FROM clients ORDER BY name
2. Query all KMPs → SELECT * FROM client_kmp
3. Map KMPs to clients by client_id
4. Format KMP string: "Name|Designation|Mobile;..."
5. Generate XLSX file
6. Send as download
```

### Import Process:
```
1. Receive XLSX file + duplicateHandling setting
2. Parse rows using XLSX library
3. For each row:
   a. Extract: name, type, mobile, address, lead_employee_name, kmp_string, documents_string
   b. Validate: client name required
   c. Check duplicate: query clients WHERE name ILIKE '%name%'
   d. If duplicate:
      - Skip: do nothing (skip += 1)
      - Update: UPDATE clients + DELETE/INSERT KMPs (updated += 1)
   e. If new:
      - INSERT client (newAdded += 1)
      - Parse KMP string: split by ";", split by "|"
      - INSERT into client_kmp for each KMP
   f. Handle errors: catch exceptions, add to errors[]
4. Return results: {newAdded, updated, skipped, totalProcessed, errors, duration}
```

## API Endpoints

### Export
```
GET /api/clients/export
Returns: XLSX file (binary)
Headers: 
  Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
  Content-Disposition: attachment; filename="clients_[date].xlsx"
```

### Import
```
POST /api/clients/import
Body: FormData with:
  - file: File (XLSX/XLS)
  - duplicateHandling: "skip" | "update"
Returns:
{
  success: true,
  results: {
    newAdded: number,
    updated: number,
    skipped: number,
    totalProcessed: number,
    errors: [{row, client, issue}]
  },
  duration: "X.XXs"
}
```

## Performance

- Export 1,000+ clients: <2 seconds
- Import 1,000+ clients: <5 seconds
- Memory usage: Reasonable for files <10MB
- No timeout issues for typical use cases

## Troubleshooting

### Issue: Download doesn't start
- Check browser's download settings
- Try a different browser
- Check file size (should be <5MB typically)

### Issue: Import shows "No file provided"
- Ensure file is selected before clicking import
- File must be .xlsx or .xls format

### Issue: Clients not appearing after import
- Click "Close & Refresh Client List" button
- Verify in database: `SELECT * FROM clients ORDER BY created_at DESC LIMIT 10;`
- Check for errors in results modal

### Issue: KMP data not importing
- Check format: must be semicolon-separated (`John Doe|Dir|123;Jane|Mgr|456`)
- Pipe characters separate fields (Name|Designation|Mobile)
- Check for extra spaces or special characters

### Issue: Lead Employee not matched
- Employee name must match exactly (case-insensitive search)
- If employee doesn't exist, lead_employee_id will be null
- Create employee first if needed

## Notes

- Import skips rows with missing client name
- KMP is optional (can be empty)
- Lead Employee is optional (can be empty)
- Documents column not yet implemented (always empty)
- File size limit: ~10MB (typical Excel files)
- Past exports stored in localStorage (browser-specific)

## Example Excel File

Download from export, or create manually:

```
Client Name          | Type    | Mobile        | Address              | Lead Employee | KMP                                                      | Documents
ABC Pvt Ltd          | Pvt Ltd | +91 98765432  | 123 Business Park    | John Smith     | John Doe\|Director\|+91 99999 88888;Jane\|Manager\|+91... | 
XYZ Corp             | Corp    | +91 87654321  | 456 Corporate Tower  |                |                                                         |
Test Inc             | Inc     |               | 789 Tech Park        | Alice Johnson  | Bob\|CEO\|+91 77777 66666                              |
```

Note: In actual Excel file, use pipe character `|` not backslash-escaped version.
