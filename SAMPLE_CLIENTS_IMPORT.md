# Sample Excel File for Import Testing

## How to Create Test Excel File

To test the import functionality, you need to create an Excel file with the following format:

### Quick Start: Download Template

1. Go to `http://localhost:3000/clients`
2. Click "📥 Export to Excel" button
3. This will download a current `clients_[date].xlsx` file
4. Use this as a template and edit it to test import

## Manual Excel Creation

If creating manually, follow this format:

### Column Headers (Row 1)
```
A1: Client Name
B1: Type
C1: Mobile
D1: Address
E1: Lead Employee
F1: KMP
G1: Documents
```

### Sample Data (Rows 2+)

```
Row 2:
A2: ABC Pvt Ltd
B2: Pvt Ltd
C2: +91 98765 43210
D2: 123 Business Park, Mumbai
E2: (Leave empty or put employee name if exists)
F2: John Doe|Director|+91 99999 88888;Jane Smith|Manager|+91 88888 77777
G2: (Leave empty)

Row 3:
A3: XYZ Corporation
B3: Corp
C3: +91 87654 32109
D3: 456 Corporate Tower, Delhi
E3: (Leave empty)
F3: Robert Brown|Partner|+91 77777 66666
G3: (Leave empty)

Row 4:
A4: Test Industries
B4: Pvt Ltd
C4: (Leave empty)
D4: 789 Technology Park, Bangalore
E4: (Leave empty)
F4: (Leave empty - no KMP)
G4: (Leave empty)
```

## KMP Format Details

### Correct Format
```
Name|Designation|Mobile;Name2|Designation2|Mobile2
```

### Examples

**Single KMP:**
```
John Doe|Director|+91 99999 88888
```

**Multiple KMPs:**
```
John Doe|Director|+91 99999 88888;Jane Smith|Manager|+91 88888 77777;Bob Johnson|CFO|+91 66666 55555
```

**With Empty Designation:**
```
John Doe||+91 99999 88888
```

**With Empty Mobile:**
```
John Doe|Director|
```

### What NOT to Do
❌ Don't use commas to separate KMPs: `John|Dir|123, Jane|Mgr|456`
❌ Don't use different delimiter: `John-Director-123;Jane-Manager-456`
❌ Don't include extra spaces: `John | Director | 123` (trim them)

## Lead Employee Matching

The Lead Employee column should contain the **full name** of an existing employee.

### How It Works:
1. System searches for employee with matching name
2. If found, sets that employee as lead_employee_id
3. If not found, leaves field empty (no error)

### Example:
If you have employees:
- John Smith
- Alice Johnson
- Bob Wilson

Then in the Excel file:
```
E2: John Smith      → Matches employee, lead_employee_id set
E3: Alice Johnson   → Matches employee, lead_employee_id set
E4: Unknown Person  → Not found, lead_employee_id is null (no error)
E5: (blank)         → left empty, lead_employee_id is null
```

## Test Scenarios

### Scenario 1: New Clients Only
**File Contents:**
```
Client Name     | Type    | Mobile      | Lead Employee
New Client A    | Pvt Ltd | +91 11111   | 
New Client B    | Corp    | +91 22222   | 
New Client C    | Inc     |             | 
```

**Expected Result:**
- New Added: 3
- Updated: 0
- Skipped: 0
- Total: 3

### Scenario 2: Mix of New and Existing
**Setup:** Before import, add a client with name "ABC Pvt Ltd"

**File Contents:**
```
Client Name     | Type    | Mobile      
ABC Pvt Ltd     | Pvt Ltd | +91 11111   (existing, will be skipped)
New Client X    | Corp    | +91 22222   (new, will be added)
New Client Y    | Inc     |             (new, will be added)
```

**Expected Result (Skip Duplicates):**
- New Added: 2
- Updated: 0
- Skipped: 1
- Total: 3

**Expected Result (Update Existing):**
- New Added: 2
- Updated: 1
- Skipped: 0
- Total: 3

### Scenario 3: KMP Testing
**File Contents:**
```
Client Name  | Type   | KMP
KMP Test 1   | Corp   | John|Director|+91 11111;Jane|Manager|+91 22222
KMP Test 2   | Inc    | Solo|CEO|+91 33333
KMP Test 3   | Ltd    | (blank - no KMP)
```

**Expected Result:**
- New Added: 3
- Total KMPs created: 3 (2 for first, 1 for second, 0 for third)

### Scenario 4: Error Handling
**File Contents:**
```
Client Name  | Type   | Mobile
(blank)      | Corp   | +91 11111    (Error: missing name)
Valid Client | Ltd    | +91 22222    (Valid)
Another One  | Inc    | +91 33333    (Valid)
```

**Expected Result:**
- New Added: 2
- Total Processed: 3
- Errors: 1
- Error Details: Row 1 - Missing client name

## Creating Excel File Steps

### Using Microsoft Excel/LibreOffice Calc:

1. Create new spreadsheet
2. Add headers in row 1
3. Add sample data in rows 2-10
4. Save as `.xlsx` format
5. Name it something like `test_clients.xlsx`
6. Go to http://localhost:3000/clients/import
7. Drag and drop or select the file
8. Review preview
9. Choose duplicate handling
10. Click "Start Import"
11. Check results

### Using Google Sheets:

1. Create new spreadsheet
2. Add headers and data
3. File → Download → Microsoft Excel
4. Follow steps 6-11 above

### Using Command Line (Python):

```python
import openpyxl
from openpyxl import Workbook

wb = Workbook()
ws = wb.active

# Headers
headers = ["Client Name", "Type", "Mobile", "Address", "Lead Employee", "KMP", "Documents"]
ws.append(headers)

# Data
ws.append(["ABC Pvt Ltd", "Pvt Ltd", "+91 98765 43210", "123 Business Park", "", "John Doe|Director|+91 99999 88888", ""])
ws.append(["XYZ Corp", "Corp", "+91 87654 32109", "456 Tower", "", "Robert Brown|Partner|+91 77777 66666", ""])
ws.append(["Test Inc", "Inc", "", "789 Park", "", "", ""])

wb.save("test_clients.xlsx")
```

## What Happens During Import

1. **File Processing:**
   - Reads Excel file row by row
   - Extracts data from each column
   - Validates required fields (Client Name)

2. **Duplicate Detection:**
   - Compares Client Name with existing clients
   - Case-insensitive comparison
   - Full or partial name match

3. **Handling Rules:**
   - **Skip:** Ignore existing clients, only add new ones
   - **Update:** Replace data for existing clients

4. **KMP Processing:**
   - Splits by semicolon (;)
   - For each KMP, splits by pipe (|)
   - Creates separate client_kmp record for each
   - Handles missing designation or mobile gracefully

5. **Employee Matching:**
   - Searches for employee by Lead Employee name
   - Case-insensitive search
   - Sets employee ID if found
   - Leaves null if not found (no error)

6. **Results:**
   - Shows statistics
   - Lists any errors with row numbers
   - Displays processing time

## Troubleshooting

### "Please select an Excel file"
- File format is not .xlsx or .xls
- Solution: Save as Excel format

### Preview shows wrong row count
- Extra blank rows at bottom
- Solution: Delete empty rows before import

### Cells appear empty in preview but have data
- Column width too narrow to display
- Solution: Widen column in Excel before export

### KMP data not imported
- Wrong separator used (e.g., comma instead of pipe)
- Solution: Use correct format `Name|Designation|Mobile`

### Lead Employee not matched
- Employee name doesn't match exactly
- Solution: Check exact name in employees list
- System does case-insensitive search but must match the name

### Import completes but shows errors
- Check "Issues Found" section in results modal
- Each error shows row number and issue
- Some rows may succeed while others fail

## Sample Complete File Content

Here's a complete ready-to-use example (copy values exactly):

```
A1: Client Name        B1: Type           C1: Mobile           D1: Address                        E1: Lead Employee    F1: KMP                                           G1: Documents
A2: ABC Pvt Ltd        B2: Pvt Ltd        C2: +91 98765 43210  D2: 123 Business Park, Mumbai     E2:                  F2: John Doe|Director|+91 99999 88888              G2:
A3: XYZ Corporation    B3: Corp           C3: +91 87654 32109  D3: 456 Corporate Tower, Delhi   E3:                  F3: Robert Brown|Partner|+91 77777 66666           G3:
A4: Test Industries    B4: Pvt Ltd        C4: (blank)          D4: 789 Technology Park           E4:                  F4: (blank)                                       G4:
A5: Multi KMP Inc      B5: Inc            C5: +91 11111 11111  D5: 101 Business District        E5:                  F5: Alice|CEO|+91 22222 22222;Bob|CFO|+91 33333  G5:
```

Note: Make sure to:
- Use actual pipe character | (not escaped)
- Use actual semicolon ; (not escaped)
- Trim extra spaces
- Save as .xlsx format

---

**Ready to test?** 
1. Create file using above template
2. Visit http://localhost:3000/clients
3. Click "📤 Import from Excel"
4. Upload your file
5. Watch it process!
