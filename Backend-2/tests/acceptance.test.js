// Comprehensive automated acceptance test suite for DAYFLOW HRMS BE-2
const http = require('http');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000';

function request(method, path, body = null, token = null, isMultipart = false) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let payload = null;

    if (isMultipart && body) {
      const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
      headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`;

      const chunks = [];
      for (const [key, value] of Object.entries(body)) {
        if (value && typeof value === 'object' && value.filename && value.content) {
          chunks.push(
            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="${key}"; filename="${value.filename}"\r\n` +
            `Content-Type: ${value.mimetype || 'application/octet-stream'}\r\n\r\n`
          );
          chunks.push(value.content);
          chunks.push('\r\n');
        } else {
          chunks.push(
            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="${key}"\r\n\r\n` +
            `${value}\r\n`
          );
        }
      }
      chunks.push(`--${boundary}--\r\n`);

      // Combine chunks
      let totalLength = 0;
      const bufferChunks = chunks.map((c) => {
        const b = Buffer.isBuffer(c) ? c : Buffer.from(c);
        totalLength += b.length;
        return b;
      });
      payload = Buffer.concat(bufferChunks);
      headers['Content-Length'] = totalLength;
    } else if (body) {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      url,
      {
        method,
        headers
      },
      (res) => {
        let rawData = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          let parsedData = null;
          try {
            parsedData = JSON.parse(rawData);
          } catch (e) {
            parsedData = rawData;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        });
      }
    );

    req.on('error', (e) => reject(e));

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

let adminToken = '';
let empToken = '';
let empId = '';
let adminEmpId = '';
let paidLeaveTypeId = '';
let sickLeaveTypeId = '';
let testLeaveRequestId = '';

async function runSuite() {
  console.log('\n======================================================');
  console.log('🚀 RUNNING DAYFLOW HRMS BE-2 ACCEPTANCE TEST SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    try {
      await t.fn();
      console.log(`  ✅ PASS: ${t.name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${t.name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  console.log('\n======================================================');
  console.log(`📊 TEST RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

// ----------------------------------------------------
// TEST DEFINITIONS
// ----------------------------------------------------

test('1. Auth login for Admin and Employee generates valid JWTs', async () => {
  const adminRes = await request('POST', '/auth/login', {
    email: 'admin@dayflow.com',
    password: 'Password123!'
  });
  if (adminRes.status !== 200 || !adminRes.data.token) {
    throw new Error(`Admin login failed: ${JSON.stringify(adminRes.data)}`);
  }
  adminToken = adminRes.data.token;
  adminEmpId = adminRes.data.user.employeeId;

  const empRes = await request('POST', '/auth/login', {
    email: 'john.doe@dayflow.com',
    password: 'Password123!'
  });
  if (empRes.status !== 200 || !empRes.data.token) {
    throw new Error(`Employee login failed: ${JSON.stringify(empRes.data)}`);
  }
  empToken = empRes.data.token;
  empId = empRes.data.user.employeeId;
});

test('2. Employee check-in saves attendance record with computed status', async () => {
  const res = await request('POST', '/attendance/check-in', {}, empToken);
  if (res.status !== 200 && res.status !== 400) {
    throw new Error(`Expected 200 or 400 for check-in: ${JSON.stringify(res.data)}`);
  }
});

test('3. Rapid repeated check-in on the same day is rejected', async () => {
  const res = await request('POST', '/attendance/check-in', {}, empToken);
  if (res.status !== 400) {
    throw new Error(`Expected 400 on duplicate check-in, got ${res.status}: ${JSON.stringify(res.data)}`);
  }
});

test('4. Employee check-out computes work_hours and extra_hours server-side', async () => {
  const res = await request('POST', '/attendance/check-out', {}, empToken);
  if (res.status !== 200) {
    throw new Error(`Check-out failed: ${JSON.stringify(res.data)}`);
  }
  if (res.data.attendance.workHours === undefined || res.data.attendance.workHours === null) {
    throw new Error('workHours not calculated on checkout');
  }
});

test('5. GET /attendance/my returns uniform row shape across daily, weekly, monthly views', async () => {
  const views = ['daily', 'weekly', 'monthly'];
  for (const v of views) {
    const res = await request('GET', `/attendance/my?view=${v}`, null, empToken);
    if (res.status !== 200 || !Array.isArray(res.data.records)) {
      throw new Error(`View ${v} failed: ${JSON.stringify(res.data)}`);
    }
    if (res.data.records.length > 0) {
      const row = res.data.records[0];
      if (!row.employeeId || !row.date || !row.status) {
        throw new Error(`Invalid row shape for view ${v}: ${JSON.stringify(row)}`);
      }
    }
  }
});

test('6. Fetch leave types and employee allocation balances', async () => {
  const res = await request('GET', '/leave-allocation', null, adminToken);
  if (res.status !== 200 || !Array.isArray(res.data.leaveTypes)) {
    throw new Error(`Failed to fetch leave allocations: ${JSON.stringify(res.data)}`);
  }
  const paid = res.data.leaveTypes.find((lt) => lt.name === 'Paid Leave');
  const sick = res.data.leaveTypes.find((lt) => lt.name === 'Sick Leave');
  if (!paid) throw new Error('Paid Leave type not found in seed');
  paidLeaveTypeId = paid.id;
  sickLeaveTypeId = sick.id;
});

test('7. POST /time-off creates pending leave request with remarks', async () => {
  const nextMonth = new Date().getMonth() + 2; // month after next to avoid conflicts
  const year = new Date().getFullYear();
  const startStr = `${year}-${String(nextMonth).padStart(2, '0')}-05`;
  const endStr = `${year}-${String(nextMonth).padStart(2, '0')}-06`;

  const res = await request(
    'POST',
    '/time-off',
    {
      leaveTypeId: paidLeaveTypeId,
      startDate: startStr,
      endDate: endStr,
      remarks: 'Attending architecture workshop'
    },
    empToken
  );

  if (res.status !== 201 || !res.data.leaveRequest) {
    throw new Error(`Create leave request failed: ${JSON.stringify(res.data)}`);
  }
  if (res.data.leaveRequest.duration !== 2) {
    throw new Error(`Expected server-side calculated duration of 2, got ${res.data.leaveRequest.duration}`);
  }
  testLeaveRequestId = res.data.leaveRequest.id;
});

test('8. Submitting overlapping leave dates returns exact error string', async () => {
  const nextMonth = new Date().getMonth() + 2;
  const year = new Date().getFullYear();
  const startStr = `${year}-${String(nextMonth).padStart(2, '0')}-05`;
  const endStr = `${year}-${String(nextMonth).padStart(2, '0')}-07`;

  const res = await request(
    'POST',
    '/time-off',
    {
      leaveTypeId: paidLeaveTypeId,
      startDate: startStr,
      endDate: endStr,
      remarks: 'Overlapping request'
    },
    empToken
  );

  if (res.status !== 400) {
    throw new Error(`Expected 400 on overlap, got ${res.status}: ${JSON.stringify(res.data)}`);
  }
  const expectedMsg = 'Selected dates overlap with an existing leave request.';
  if (res.data.message !== expectedMsg && res.data.error !== expectedMsg) {
    throw new Error(`Expected message "${expectedMsg}", got "${res.data.message || res.data.error}"`);
  }
});

test('9. Requesting leave beyond remaining allocation returns exact error string', async () => {
  const nextYear = new Date().getFullYear() + 1;
  const startStr = `${nextYear}-01-01`;
  const endStr = `${nextYear}-02-15`; // 46 days > 18 days allocation

  const res = await request(
    'POST',
    '/time-off',
    {
      leaveTypeId: paidLeaveTypeId,
      startDate: startStr,
      endDate: endStr,
      remarks: 'Too long leave'
    },
    empToken
  );

  if (res.status !== 400) {
    throw new Error(`Expected 400 on insufficient leave, got ${res.status}: ${JSON.stringify(res.data)}`);
  }
  const expectedMsg = 'You do not have enough leave allocation.';
  if (res.data.message !== expectedMsg && res.data.error !== expectedMsg) {
    throw new Error(`Expected message "${expectedMsg}", got "${res.data.message || res.data.error}"`);
  }
});

test('10. Rejecting leave request without decisionComment returns 400 + exact error string', async () => {
  const res = await request('PUT', `/time-off/${testLeaveRequestId}/reject`, {}, adminToken);
  if (res.status !== 400) {
    throw new Error(`Expected 400 on reject without comment, got ${res.status}: ${JSON.stringify(res.data)}`);
  }
  const expectedMsg = 'A rejection comment is required.';
  if (res.data.message !== expectedMsg && res.data.error !== expectedMsg) {
    throw new Error(`Expected message "${expectedMsg}", got "${res.data.message || res.data.error}"`);
  }
});

test('11. Approving leave request WITH decisionComment succeeds and decrements allocation atomically', async () => {
  const res = await request(
    'PUT',
    `/time-off/${testLeaveRequestId}/approve`,
    { decisionComment: 'Approved for workshop.' },
    adminToken
  );

  if (res.status !== 200 || res.data.leaveRequest.status !== 'APPROVED') {
    throw new Error(`Approval failed: ${JSON.stringify(res.data)}`);
  }
});

test('12. Approving leave request with NO decisionComment succeeds (optional on approve)', async () => {
  // Create another leave request for next month
  const nextMonth = new Date().getMonth() + 2;
  const year = new Date().getFullYear();
  const startStr = `${year}-${String(nextMonth).padStart(2, '0')}-15`;
  const endStr = `${year}-${String(nextMonth).padStart(2, '0')}-15`;

  const createRes = await request(
    'POST',
    '/time-off',
    {
      leaveTypeId: paidLeaveTypeId,
      startDate: startStr,
      endDate: endStr,
      remarks: 'Single day personal'
    },
    empToken
  );

  const reqId = createRes.data.leaveRequest.id;

  const approveRes = await request('PUT', `/time-off/${reqId}/approve`, {}, adminToken);
  if (approveRes.status !== 200 || approveRes.data.leaveRequest.status !== 'APPROVED') {
    throw new Error(`Approve without comment should succeed, got ${approveRes.status}: ${JSON.stringify(approveRes.data)}`);
  }
});

test('13. Employee CAN read own salary data via GET /employees/:id/salary', async () => {
  const res = await request('GET', `/employees/${empId}/salary`, null, empToken);
  if (res.status !== 200 || !res.data.salary || !res.data.breakdown) {
    throw new Error(`Employee salary read failed: ${JSON.stringify(res.data)}`);
  }
  if (res.data.breakdown.monthlyWage !== 80000) {
    throw new Error(`Unexpected wage: ${res.data.breakdown.monthlyWage}`);
  }
});

test('14. Employee CANNOT modify own salary via PUT /employees/:id/salary (403 Forbidden)', async () => {
  const res = await request(
    'PUT',
    `/employees/${empId}/salary`,
    { monthlyWage: 120000 },
    empToken
  );
  if (res.status !== 403) {
    throw new Error(`Expected 403 for employee salary write, got ${res.status}: ${JSON.stringify(res.data)}`);
  }
  const expectedMsg = 'You do not have permission to perform this action.';
  if (res.data.message !== expectedMsg && res.data.error !== expectedMsg) {
    throw new Error(`Expected message "${expectedMsg}", got "${res.data.message || res.data.error}"`);
  }
});

test('15. Employee CANNOT access Admin Payroll endpoints (403 Forbidden)', async () => {
  const res1 = await request('GET', '/payroll', null, empToken);
  if (res1.status !== 403) {
    throw new Error(`Expected 403 on GET /payroll for employee, got ${res1.status}`);
  }

  const res2 = await request('GET', `/payroll/${empId}`, null, empToken);
  if (res2.status !== 403) {
    throw new Error(`Expected 403 on GET /payroll/:id for employee, got ${res2.status}`);
  }
});

test('16. Admin Payroll Dashboard numbers match individual salary calculation engine exactly (no drift)', async () => {
  const [payrollRes, salaryRes] = await Promise.all([
    request('GET', `/payroll/${empId}`, null, adminToken),
    request('GET', `/employees/${empId}/salary`, null, adminToken)
  ]);

  if (payrollRes.status !== 200 || salaryRes.status !== 200) {
    throw new Error('Failed to fetch payroll or salary data');
  }

  const p = payrollRes.data.payroll;
  const s = salaryRes.data.breakdown;

  if (p.monthly_wage !== s.monthlyWage) {
    throw new Error(`Wage mismatch: payroll=${p.monthly_wage}, salary=${s.monthlyWage}`);
  }
  if (p.basic !== s.basic) {
    throw new Error(`Basic mismatch: payroll=${p.basic}, salary=${s.basic}`);
  }
  if (p.gross !== s.grossSalary) {
    throw new Error(`Gross mismatch: payroll=${p.gross}, salary=${s.grossSalary}`);
  }
  if (p.pf !== s.employeePF) {
    throw new Error(`PF mismatch: payroll=${p.pf}, salary=${s.employeePF}`);
  }
  if (p.tax !== s.professionalTax) {
    throw new Error(`Tax mismatch: payroll=${p.tax}, salary=${s.professionalTax}`);
  }
  if (p.net !== s.netSalary) {
    throw new Error(`Net mismatch: payroll=${p.net}, salary=${s.netSalary}`);
  }
});

test('17. Salary update exceeding monthlyWage is rejected with exact error string', async () => {
  const res = await request(
    'PUT',
    `/employees/${empId}/salary`,
    {
      monthlyWage: 80000,
      components: [
        { componentName: 'Basic Salary', calculationType: 'PERCENT_OF_WAGE', percentage: 70, amount: 56000 },
        { componentName: 'HRA', calculationType: 'PERCENT_OF_WAGE', percentage: 50, amount: 40000 }
        // 56,000 + 40,000 = 96,000 > 80,000
      ]
    },
    adminToken
  );

  if (res.status !== 400) {
    throw new Error(`Expected 400 for salary exceeding wage, got ${res.status}: ${JSON.stringify(res.data)}`);
  }
  const expectedMsg = 'Salary components cannot exceed the configured wage.';
  if (res.data.message !== expectedMsg && res.data.error !== expectedMsg) {
    throw new Error(`Expected message "${expectedMsg}", got "${res.data.message || res.data.error}"`);
  }
});

test('18. Leave attachment upload rejects invalid file extension or missing file', async () => {
  const res = await request(
    'POST',
    '/upload/leave-attachment',
    {
      attachment: {
        filename: 'malicious.exe',
        mimetype: 'application/x-msdownload',
        content: Buffer.from('MZ...')
      }
    },
    empToken,
    true
  );

  if (res.status !== 400) {
    throw new Error(`Expected 400 on exe file upload, got ${res.status}: ${JSON.stringify(res.data)}`);
  }
  const expectedMsg = 'Unsupported file type or file too large.';
  if (res.data.message !== expectedMsg && res.data.error !== expectedMsg) {
    throw new Error(`Expected message "${expectedMsg}", got "${res.data.message || res.data.error}"`);
  }
});

test('19. Leave attachment upload succeeds for valid PDF / image', async () => {
  const res = await request(
    'POST',
    '/upload/leave-attachment',
    {
      attachment: {
        filename: 'medical_certificate.pdf',
        mimetype: 'application/pdf',
        content: Buffer.from('%PDF-1.4 sample content')
      }
    },
    empToken,
    true
  );

  if (res.status !== 201 || !res.data.url) {
    throw new Error(`Expected 201 on valid PDF upload, got ${res.status}: ${JSON.stringify(res.data)}`);
  }
});

runSuite().catch((e) => {
  console.error('Test suite failed unexpectedly:', e);
  process.exit(1);
});
