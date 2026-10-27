require('dotenv').config();
const { getDb } = require('./schema');
const { getPostgresPool } = require('./postgres');
const bcrypt = require('bcryptjs');

const defaultPasswordHash = bcrypt.hashSync('Admin@Secure2026', 10);
const facultyPasswordHash = bcrypt.hashSync('Faculty@2026', 10);
const studentPasswordHash = bcrypt.hashSync('Student@2026', 10);

// ==========================================
// 1. DATA DEFINITIONS (2+ Admins, 20+ Staff, 20+ Students)
// ==========================================

const INDIAN_ADMINS = [
  {
    username: 'admin.rajeshwar',
    email: 'rajeshwar.sharma@delhischool.edu.in',
    phone: '9811023456',
    firstName: 'Dr. Rajeshwar',
    lastName: 'Sharma',
    campusName: 'Main Campus - Chanakyapuri, New Delhi',
    managedClasses: 'Classes 6 to 12 (CBSE Secondary & Senior Wing)',
    branchCode: 'DEL-SEC-01',
    designation: 'Director & Principal (Senior Wing)',
    notes: 'Senior Educationist with 24 years of experience in CBSE school governance, secondary education, and curriculum development.'
  },
  {
    username: 'admin.meenakshi',
    email: 'meenakshi.sundaram@delhischool.edu.in',
    phone: '9840156789',
    firstName: 'Mrs. Meenakshi',
    lastName: 'Sundaram',
    campusName: 'North Campus - Civil Lines, New Delhi',
    managedClasses: 'Classes 1 to 5 (Foundational & Primary Wing)',
    branchCode: 'DEL-PRI-02',
    designation: 'Headmistress (Primary & Foundational Wing)',
    notes: 'Early childhood education specialist leading holistic primary STEM modules, foundational literacy, and activity-based learning.'
  },
  {
    username: 'admin.alok',
    email: 'alok.mukherjee@delhischool.edu.in',
    phone: '9830234567',
    firstName: 'Mr. Alok',
    lastName: 'Mukherjee',
    campusName: 'Main Campus - Chanakyapuri, New Delhi',
    managedClasses: 'Classes 9 to 12 (Board Examination Directorate)',
    branchCode: 'DEL-EXM-03',
    designation: 'Vice Principal & Controller of Examinations',
    notes: 'In charge of CBSE board examination conduct, academic audits, teacher appraisals, and laboratory accreditation.'
  }
];

const INDIAN_STAFF = [
  { staffId: 'TCH0101', first: 'Dr. Arvind', last: 'Swaminathan', dept: 'Science', desig: 'HOD Physics & Senior PGT Faculty', type: 'Teaching', gender: 'Male', phone: '9811234501', email: 'arvind.swami@delhischool.edu.in', qual: 'M.Sc. Physics, Ph.D. (Delhi Univ)', date: '2016-07-01' },
  { staffId: 'TCH0102', first: 'Mrs. Sunita', last: 'Deshmukh', dept: 'Mathematics', desig: 'Senior PGT Mathematics Teacher', type: 'Teaching', gender: 'Female', phone: '9811234502', email: 'sunita.deshmukh@delhischool.edu.in', qual: 'M.Sc. Applied Mathematics, B.Ed', date: '2017-06-15' },
  { staffId: 'TCH0103', first: 'Mr. Vikramaditya', last: 'Rathore', dept: 'Science', desig: 'PGT Chemistry Faculty', type: 'Teaching', gender: 'Male', phone: '9811234503', email: 'vikram.rathore@delhischool.edu.in', qual: 'M.Sc. Organic Chemistry, B.Ed', date: '2018-04-10' },
  { staffId: 'TCH0104', first: 'Ms. Ananya', last: 'Sengupta', dept: 'English', desig: 'HOD English & Literature Teacher', type: 'Teaching', gender: 'Female', phone: '9811234504', email: 'ananya.sengupta@delhischool.edu.in', qual: 'M.A. English Literature (JNU), B.Ed', date: '2017-08-01' },
  { staffId: 'TCH0105', first: 'Mr. Pradeep Kumar', last: 'Nair', dept: 'Computer Science', desig: 'PGT Computer Science & AI Incharge', type: 'Teaching', gender: 'Male', phone: '9811234505', email: 'pradeep.nair@delhischool.edu.in', qual: 'M.Tech Computer Science, MCA', date: '2019-01-15' },
  { staffId: 'TCH0106', first: 'Mrs. Shobha', last: 'Kulkarni', dept: 'Science', desig: 'TGT Biology & Life Sciences Teacher', type: 'Teaching', gender: 'Female', phone: '9811234506', email: 'shobha.kulkarni@delhischool.edu.in', qual: 'M.Sc. Botany, B.Ed', date: '2018-07-01' },
  { staffId: 'TCH0107', first: 'Mr. Harpreet Singh', last: 'Sodhi', dept: 'Social Studies', desig: 'TGT History & Political Science Teacher', type: 'Teaching', gender: 'Male', phone: '9811234507', email: 'harpreet.sodhi@delhischool.edu.in', qual: 'M.A. History, B.Ed', date: '2019-03-20' },
  { staffId: 'TCH0108', first: 'Mrs. Kavita', last: 'Iyer', dept: 'English', desig: 'TGT Hindi & Sanskrit Teacher', type: 'Teaching', gender: 'Female', phone: '9811234508', email: 'kavita.iyer@delhischool.edu.in', qual: 'M.A. Hindi, M.A. Sanskrit, B.Ed', date: '2016-11-01' },
  { staffId: 'TCH0109', first: 'Mr. Manoj', last: 'Verma', dept: 'Mathematics', desig: 'TGT Mathematics Faculty', type: 'Teaching', gender: 'Male', phone: '9811234509', email: 'manoj.verma@delhischool.edu.in', qual: 'M.Sc. Mathematics, B.Ed', date: '2020-02-15' },
  { staffId: 'TCH0110', first: 'Ms. Ritu', last: 'Choudhury', dept: 'Social Studies', desig: 'TGT Geography & Economics Teacher', type: 'Teaching', gender: 'Female', phone: '9811234510', email: 'ritu.choudhury@delhischool.edu.in', qual: 'M.Sc. Geography, B.Ed', date: '2020-07-01' },
  { staffId: 'TCH0111', first: 'Mr. Gurpreet Singh', last: 'Sandhu', dept: 'Physical Education', desig: 'Director of Physical Education & Sports', type: 'Teaching', gender: 'Male', phone: '9811234511', email: 'gurpreet.sandhu@delhischool.edu.in', qual: 'M.P.Ed, NIS Certified Athletics Coach', date: '2015-08-10' },
  { staffId: 'TCH0112', first: 'Mrs. Deepa', last: 'Bhattacharya', dept: 'Science', desig: 'Senior PRT Head Teacher & EVS Incharge', type: 'Teaching', gender: 'Female', phone: '9811234512', email: 'deepa.bhatt@delhischool.edu.in', qual: 'B.Sc. Environmental Science, B.Ed', date: '2016-04-01' },
  { staffId: 'TCH0113', first: 'Ms. Sneha', last: 'Reddy', dept: 'English', desig: 'PRT English & Creative Writing Teacher', type: 'Teaching', gender: 'Female', phone: '9811234513', email: 'sneha.reddy@delhischool.edu.in', qual: 'B.A. English (Hons), B.Ed', date: '2021-06-01' },
  { staffId: 'TCH0114', first: 'Mr. Amitav', last: 'Ghosh', dept: 'Arts', desig: 'Senior Visual Arts & Painting Faculty', type: 'Teaching', gender: 'Male', phone: '9811234514', email: 'amitav.ghosh@delhischool.edu.in', qual: 'Master of Fine Arts (Santiniketan)', date: '2017-09-01' },
  { staffId: 'TCH0115', first: 'Mrs. Vasundhara', last: 'Pillai', dept: 'Arts', desig: 'Classical Music & Performing Arts Faculty', type: 'Teaching', gender: 'Female', phone: '9811234515', email: 'vasundhara.pillai@delhischool.edu.in', qual: 'Sangeet Visharad, M.A. Music', date: '2018-08-15' },
  { staffId: 'ACC0101', first: 'Mr. Suresh Chandra', last: 'Patel', dept: 'Accounts', desig: 'Chief School Bursar & Financial Controller', type: 'Non-Teaching', gender: 'Male', phone: '9811234516', email: 'suresh.patel@delhischool.edu.in', qual: 'M.Com, Chartered Financial Associate', date: '2015-03-01' },
  { staffId: 'LIB0101', first: 'Mrs. Radhika', last: 'Venkataraman', dept: 'Library', desig: 'Chief Librarian & Information Specialist', type: 'Non-Teaching', gender: 'Female', phone: '9811234517', email: 'radhika.venkat@delhischool.edu.in', qual: 'M.Lib.Sc., Digital Archival Specialist', date: '2016-05-15' },
  { staffId: 'ADM0101', first: 'Mr. Dinesh Kumar', last: 'Mishra', dept: 'Administration', desig: 'Senior Registrar & Admissions Incharge', type: 'Non-Teaching', gender: 'Male', phone: '9811234518', email: 'dinesh.mishra@delhischool.edu.in', qual: 'MBA Educational Management', date: '2016-01-10' },
  { staffId: 'LAB0101', first: 'Mr. Chetan', last: 'Joshi', dept: 'Science', desig: 'Senior Science & Robotics Lab Superintendent', type: 'Non-Teaching', gender: 'Male', phone: '9811234519', email: 'chetan.joshi@delhischool.edu.in', qual: 'B.Sc. Electronics, Instrumentation Diploma', date: '2019-09-01' },
  { staffId: 'ACC0102', first: 'Mrs. Geeta', last: 'Aggarwal', dept: 'Accounts', desig: 'Deputy Accounts Officer & Fee Incharge', type: 'Non-Teaching', gender: 'Female', phone: '9811234520', email: 'geeta.aggarwal@delhischool.edu.in', qual: 'B.Com (Hons), Tally & ERP Certified', date: '2020-11-01' }
];

const INDIAN_STUDENTS = [
  { studentId: 'STU202501', admNo: 'ADM-2025-001', first: 'Aarav', last: 'Sharma', gender: 'Male', classNum: 10, sec: 'A', roll: 1, blood: 'O+', fName: 'Vikas Sharma', mName: 'Sunita Sharma', occ: 'Senior Software Architect', phone: '9810123401', address: 'B-4/12, Safdarjung Enclave, New Delhi', dob: '2010-04-14' },
  { studentId: 'STU202502', admNo: 'ADM-2025-002', first: 'Ananya', last: 'Patel', gender: 'Female', classNum: 10, sec: 'A', roll: 2, blood: 'B+', fName: 'Sanjay Patel', mName: 'Meena Patel', occ: 'Business Director', phone: '9810123402', address: 'Flat 302, Palm Grove, Vasant Kunj, New Delhi', dob: '2010-07-22' },
  { studentId: 'STU202503', admNo: 'ADM-2025-003', first: 'Rohan', last: 'Verma', gender: 'Male', classNum: 10, sec: 'A', roll: 3, blood: 'A+', fName: 'Ajay Verma', mName: 'Kavita Verma', occ: 'Civil Engineer', phone: '9810123403', address: 'C-18, Green Park Extension, New Delhi', dob: '2010-09-05' },
  { studentId: 'STU202504', admNo: 'ADM-2025-004', first: 'Ishita', last: 'Gupta', gender: 'Female', classNum: 10, sec: 'A', roll: 4, blood: 'AB+', fName: 'Manish Gupta', mName: 'Pooja Gupta', occ: 'Advocate, Delhi High Court', phone: '9810123404', address: 'D-55, Hauz Khas, New Delhi', dob: '2010-02-18' },
  { studentId: 'STU202505', admNo: 'ADM-2025-005', first: 'Kabir', last: 'Singh', gender: 'Male', classNum: 10, sec: 'A', roll: 5, blood: 'O-', fName: 'Harpreet Singh', mName: 'Simran Singh', occ: 'Corporate Banker', phone: '9810123405', address: 'J-12, Lajpat Nagar III, New Delhi', dob: '2010-05-30' },
  { studentId: 'STU202506', admNo: 'ADM-2025-006', first: 'Diya', last: 'Menon', gender: 'Female', classNum: 10, sec: 'A', roll: 6, blood: 'B-', fName: 'Ramesh Menon', mName: 'Lakshmi Menon', occ: 'Scientist, CSIR', phone: '9810123406', address: 'A-22, Chittaranjan Park, New Delhi', dob: '2010-08-12' },
  { studentId: 'STU202507', admNo: 'ADM-2025-007', first: 'Vihaan', last: 'Reddy', gender: 'Male', classNum: 10, sec: 'A', roll: 7, blood: 'A-', fName: 'Kiran Reddy', mName: 'Shanti Reddy', occ: 'Surgeon, AIIMS', phone: '9810123407', address: 'House 45, Gulmohar Park, New Delhi', dob: '2010-03-25' },
  { studentId: 'STU202508', admNo: 'ADM-2025-008', first: 'Sara', last: 'Khan', gender: 'Female', classNum: 10, sec: 'A', roll: 8, blood: 'O+', fName: 'Tariq Khan', mName: 'Zoya Khan', occ: 'Aeronautical Engineer', phone: '9810123408', address: 'B-101, Jamia Nagar, New Delhi', dob: '2010-11-19' },
  { studentId: 'STU202509', admNo: 'ADM-2025-009', first: 'Reyansh', last: 'Joshi', gender: 'Male', classNum: 10, sec: 'A', roll: 9, blood: 'B+', fName: 'Prakash Joshi', mName: 'Geeta Joshi', occ: 'Financial Analyst', phone: '9810123409', address: 'Pocket A-1, Mayur Vihar Phase 1, New Delhi', dob: '2010-06-14' },
  { studentId: 'STU202510', admNo: 'ADM-2025-010', first: 'Aditi', last: 'Nair', gender: 'Female', classNum: 10, sec: 'A', roll: 10, blood: 'O+', fName: 'Gopal Nair', mName: 'Radha Nair', occ: 'General Manager, BHEL', phone: '9810123410', address: 'E-8, Saket, New Delhi', dob: '2010-12-08' },
  { studentId: 'STU202511', admNo: 'ADM-2025-011', first: 'Arjun', last: 'Mehta', gender: 'Male', classNum: 10, sec: 'A', roll: 11, blood: 'AB-', fName: 'Nitin Mehta', mName: 'Anita Mehta', occ: 'Managing Director', phone: '9810123411', address: 'Villa 7, Shanti Niketan, New Delhi', dob: '2010-01-24' },
  { studentId: 'STU202512', admNo: 'ADM-2025-012', first: 'Tanvi', last: 'Kulkarni', gender: 'Female', classNum: 10, sec: 'A', roll: 12, blood: 'A+', fName: 'Makarand Kulkarni', mName: 'Swati Kulkarni', occ: 'Software VP', phone: '9810123412', address: 'Flat 504, Aspen Heights, Dwarka Sector 10, New Delhi', dob: '2010-10-10' },
  { studentId: 'STU202513', admNo: 'ADM-2025-013', first: 'Pranav', last: 'Banerjee', gender: 'Male', classNum: 10, sec: 'A', roll: 13, blood: 'B+', fName: 'Sourav Banerjee', mName: 'Moumita Banerjee', occ: 'Senior Journalist', phone: '9810123413', address: 'K-78, Chittaranjan Park, New Delhi', dob: '2010-04-16' },
  { studentId: 'STU202514', admNo: 'ADM-2025-014', first: 'Saanvi', last: 'Deshmukh', gender: 'Female', classNum: 10, sec: 'A', roll: 14, blood: 'O+', fName: 'Anand Deshmukh', mName: 'Priya Deshmukh', occ: 'IAS Officer', phone: '9810123414', address: 'Bungalow 14, Chanakyapuri, New Delhi', dob: '2010-09-02' },
  { studentId: 'STU202515', admNo: 'ADM-2025-015', first: 'Aryan', last: 'Mishra', gender: 'Male', classNum: 10, sec: 'A', roll: 15, blood: 'AB+', fName: 'Rakesh Mishra', mName: 'Vandana Mishra', occ: 'Professor of Physics, DU', phone: '9810123415', address: 'Staff Quarter 12, Delhi University Enclave, New Delhi', dob: '2010-05-11' },
  { studentId: 'STU202516', admNo: 'ADM-2025-016', first: 'Kavya', last: 'Pillai', gender: 'Female', classNum: 10, sec: 'A', roll: 16, blood: 'O+', fName: 'Narayanan Pillai', mName: 'Sarala Pillai', occ: 'Naval Commander', phone: '9810123416', address: 'INS India Enclave, Chanakyapuri, New Delhi', dob: '2010-02-28' },
  { studentId: 'STU202517', admNo: 'ADM-2025-017', first: 'Vivaan', last: 'Choudhury', gender: 'Male', classNum: 10, sec: 'A', roll: 17, blood: 'A+', fName: 'Debabrata Choudhury', mName: 'Sharmila Choudhury', occ: 'IT Director', phone: '9810123417', address: 'M-14, Greater Kailash II, New Delhi', dob: '2010-08-20' },
  { studentId: 'STU202518', admNo: 'ADM-2025-018', first: 'Aadhya', last: 'Chauhan', gender: 'Female', classNum: 10, sec: 'A', roll: 18, blood: 'B+', fName: 'Vikram Singh Chauhan', mName: 'Renu Chauhan', occ: 'Army Major', phone: '9810123418', address: 'Delhi Cantonment, New Delhi', dob: '2010-03-15' },
  { studentId: 'STU202519', admNo: 'ADM-2025-019', first: 'Sai Shaurya', last: 'Iyer', gender: 'Male', classNum: 10, sec: 'A', roll: 19, blood: 'O+', fName: 'K. S. Iyer', mName: 'Padma Iyer', occ: 'Senior Executive, TCS', phone: '9810123419', address: 'Flat 202, Kaveri Apartments, Alaknanda, New Delhi', dob: '2010-10-05' },
  { studentId: 'STU202520', admNo: 'ADM-2025-020', first: 'Sneha', last: 'Mukherjee', gender: 'Female', classNum: 10, sec: 'A', roll: 20, blood: 'AB-', fName: 'Subhash Mukherjee', mName: 'Arundhati Mukherjee', occ: 'Director of Research', phone: '9810123420', address: 'S-32, Panchsheel Park, New Delhi', dob: '2010-06-17' }
];

const NOTIFICATIONS = [
  { title: 'Annual Inter-School Science & Robotics Exhibition 2026', message: 'Students from Classes 6 through 12 are invited to submit their innovative working models and science project abstracts by November 15th.', category: 'Academic' },
  { title: 'CBSE Secondary & Senior Secondary Term-1 Date Sheet Released', message: 'The finalized examination time-table for Board batches (Classes 10 & 12) is published on the portal. Hall tickets will be issued next week.', category: 'Examination' },
  { title: 'Parent-Teacher Interaction Meeting (PTM) Scheduled', message: 'Term progress PTM for foundational and primary classes will be held on Saturday from 8:30 AM to 1:00 PM in the auditorium.', category: 'Announcement' },
  { title: 'Independence Day & National Cultural Fest Auditions', message: 'Auditions for the school choir, classical dance contingent, and brass band will commence tomorrow in the Cultural Amphitheatre.', category: 'General' },
  { title: 'Quarter-3 Fee Payment Window Opening', message: 'Parents are requested to clear Quarter-3 academic tuition and transport fees online before the 10th of next month to avoid late charges.', category: 'Fee' }
];

// ==========================================
// 2. SEED FUNCTION FOR POSTGRESQL & SQLITE
// ==========================================

async function seedToPostgres() {
  const pool = getPostgresPool();
  console.log('🐘 Seeding authentic Indian datasets to PostgreSQL...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Roles
    const roleMap = {};
    const roleRows = (await client.query('SELECT id, name FROM roles')).rows;
    roleRows.forEach(r => roleMap[r.name] = r.id);

    // 2. Academic Year
    const yearRow = (await client.query('SELECT id FROM academic_years WHERE is_current = 1 LIMIT 1')).rows[0];
    const yearId = yearRow?.id || 1;

    // 3. Departments
    const deptMap = {};
    const deptRows = (await client.query('SELECT id, name FROM departments')).rows;
    deptRows.forEach(d => deptMap[d.name] = d.id);

    // 4. Classes & Sections
    const classMap = {};
    const classRows = (await client.query('SELECT id, numeric_value FROM classes')).rows;
    classRows.forEach(c => classMap[c.numeric_value] = c.id);

    const secRows = (await client.query('SELECT id, class_id, name FROM sections')).rows;
    const getSecId = (classId, name) => secRows.find(s => s.class_id === classId && s.name === name)?.id;

    // 5. Subjects
    const subjRows = (await client.query('SELECT id, code FROM subjects')).rows;
    const getSubjId = (code) => subjRows.find(s => s.code === code)?.id;

    // 6. Insert Indian Admins
    console.log('  -> Inserting Indian School Admins...');
    for (const adm of INDIAN_ADMINS) {
      let u = (await client.query('SELECT id FROM users WHERE username = $1', [adm.username])).rows[0];
      if (!u) {
        const uRes = await client.query(
          `INSERT INTO users (username, email, phone, password_hash, role_id, first_name, last_name, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 1) RETURNING id`,
          [adm.username, adm.email, adm.phone, defaultPasswordHash, roleMap['admin'], adm.firstName, adm.lastName]
        );
        u = uRes.rows[0];
      }
      await client.query(
        `INSERT INTO school_admins (user_id, campus_name, managed_classes, branch_code, designation, notes)
         VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (user_id) DO UPDATE 
         SET campus_name = $2, managed_classes = $3, branch_code = $4, designation = $5, notes = $6`,
        [u.id, adm.campusName, adm.managedClasses, adm.branchCode, adm.designation, adm.notes]
      );
    }

    // 7. Insert Indian Staff (20)
    console.log('  -> Inserting 20 Indian Faculty & Staff Members...');
    const insertedStaff = [];
    for (const st of INDIAN_STAFF) {
      let u = (await client.query('SELECT id FROM users WHERE username = $1', [st.staffId.toLowerCase()])).rows[0];
      if (!u) {
        const uRes = await client.query(
          `INSERT INTO users (username, email, phone, password_hash, role_id, first_name, last_name, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 1) RETURNING id`,
          [st.staffId.toLowerCase(), st.email, st.phone, facultyPasswordHash, st.type === 'Teaching' ? roleMap['teacher'] : roleMap['staff'], st.first, st.last]
        );
        u = uRes.rows[0];
      }
      let s = (await client.query('SELECT id FROM staff WHERE staff_id = $1', [st.staffId])).rows[0];
      if (!s) {
        const sRes = await client.query(
          `INSERT INTO staff (staff_id, user_id, first_name, last_name, email, phone, gender, department_id, designation, staff_type, qualification, joining_date, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 1) RETURNING id`,
          [st.staffId, u.id, st.first, st.last, st.email, st.phone, st.gender, deptMap[st.dept] || 1, st.desig, st.type, st.qual, st.date]
        );
        s = sRes.rows[0];
      }
      insertedStaff.push({ ...st, dbId: s.id, userId: u.id });
    }

    // 8. Teacher Assignments
    console.log('  -> Assigning Indian Faculty to Classes & Subjects...');
    const mathSubj = getSubjId('MATH');
    const sciSubj = getSubjId('SCI');
    const engSubj = getSubjId('ENG');
    const sstSubj = getSubjId('SST');
    const csSubj = getSubjId('CS');
    const phySubj = getSubjId('PHY');

    const assignments = [
      { staffIdx: 0, classNum: 10, sec: 'A', subjId: phySubj },
      { staffIdx: 1, classNum: 10, sec: 'A', subjId: mathSubj },
      { staffIdx: 2, classNum: 10, sec: 'B', subjId: sciSubj },
      { staffIdx: 3, classNum: 10, sec: 'A', subjId: engSubj },
      { staffIdx: 4, classNum: 10, sec: 'A', subjId: csSubj },
      { staffIdx: 5, classNum: 9, sec: 'A', subjId: sciSubj },
      { staffIdx: 6, classNum: 9, sec: 'A', subjId: sstSubj },
      { staffIdx: 7, classNum: 9, sec: 'B', subjId: engSubj },
      { staffIdx: 8, classNum: 8, sec: 'A', subjId: mathSubj },
      { staffIdx: 9, classNum: 8, sec: 'A', subjId: sstSubj }
    ];

    for (const a of assignments) {
      const clsId = classMap[a.classNum];
      const secId = getSecId(clsId, a.sec);
      const stf = insertedStaff[a.staffIdx];
      if (clsId && secId && a.subjId && stf) {
        await client.query(
          `INSERT INTO teacher_assignments (staff_id, class_id, section_id, subject_id, academic_year_id, is_active)
           VALUES ($1, $2, $3, $4, $5, 1) ON CONFLICT (staff_id, class_id, section_id, subject_id, academic_year_id) DO NOTHING`,
          [stf.dbId, clsId, secId, a.subjId, yearId]
        );
      }
    }

    // 9. Insert Indian Students & Parents (20)
    console.log('  -> Inserting 20 Indian Students, Guardians, & Academic Enrollments...');
    const insertedStudents = [];
    for (const st of INDIAN_STUDENTS) {
      const uName = st.studentId.toLowerCase();
      let u = (await client.query('SELECT id FROM users WHERE username = $1', [uName])).rows[0];
      if (!u) {
        const uRes = await client.query(
          `INSERT INTO users (username, email, phone, password_hash, role_id, first_name, last_name, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 1) RETURNING id`,
          [uName, `${uName}@delhischool.edu.in`, st.phone, studentPasswordHash, roleMap['student'], st.first, st.last]
        );
        u = uRes.rows[0];
      }

      let s = (await client.query('SELECT id FROM students WHERE student_id = $1', [st.studentId])).rows[0];
      if (!s) {
        const sRes = await client.query(
          `INSERT INTO students (student_id, admission_number, user_id, first_name, last_name, date_of_birth, gender, blood_group, address, admission_date, emergency_contact, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, '2025-04-01', $10, 1) RETURNING id`,
          [st.studentId, st.admNo, u.id, st.first, st.last, st.dob, st.gender, st.blood, st.address, st.phone]
        );
        s = sRes.rows[0];
      }

      // Parent User
      const pUName = `parent.${uName}`;
      const parentPhone = st.phone.replace(/^9810/, '9820');
      let pu = (await client.query('SELECT id FROM users WHERE username = $1', [pUName])).rows[0];
      if (!pu) {
        const puRes = await client.query(
          `INSERT INTO users (username, email, phone, password_hash, role_id, first_name, last_name, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 1) RETURNING id`,
          [pUName, `parent.${uName}@delhischool.edu.in`, parentPhone, studentPasswordHash, roleMap['parent'], st.fName.split(' ')[0], st.fName.split(' ').slice(1).join(' ')]
        );
        pu = puRes.rows[0];
      }

      // Parent profile
      let p = (await client.query('SELECT id FROM parents WHERE user_id = $1', [pu.id])).rows[0];
      if (!p) {
        const pRes = await client.query(
          `INSERT INTO parents (user_id, father_name, mother_name, primary_contact, father_phone, address, occupation, is_active)
           VALUES ($1, $2, $3, 'Father', $4, $5, $6, 1) RETURNING id`,
          [pu.id, st.fName, st.mName, st.phone, st.address, st.occ]
        );
        p = pRes.rows[0];
      }

      // Link student_parents
      await client.query(
        `INSERT INTO student_parents (student_id, parent_id, relation, is_primary)
         VALUES ($1, $2, 'Father', 1) ON CONFLICT (student_id, parent_id) DO NOTHING`,
        [s.id, p.id]
      );

      // Student Enrollment
      const clsId = classMap[st.classNum];
      const secId = getSecId(clsId, st.sec);
      if (clsId && secId) {
        await client.query(
          `INSERT INTO student_enrollments (student_id, class_id, section_id, academic_year_id, roll_number, status)
           VALUES ($1, $2, $3, $4, $5, 'Active') ON CONFLICT (student_id, academic_year_id) DO UPDATE
           SET class_id = $2, section_id = $3, roll_number = $5`,
          [s.id, clsId, secId, yearId, st.roll]
        );
      }

      insertedStudents.push({ ...st, dbId: s.id, userId: u.id, classId: clsId, sectionId: secId });
    }

    // 10. Student & Staff Attendance
    console.log('  -> Generating Daily Attendance Records...');
    const today = new Date().toISOString().split('T')[0];
    for (let i = 0; i < insertedStudents.length; i++) {
      const st = insertedStudents[i];
      const status = i === 3 ? 'Absent' : i === 7 ? 'Late' : 'Present';
      await client.query(
        `INSERT INTO student_attendance (student_id, class_id, section_id, academic_year_id, attendance_date, status, marked_by)
         VALUES ($1, $2, $3, $4, $5, $6, 1) ON CONFLICT (student_id, attendance_date, academic_year_id) DO UPDATE
         SET status = $6`,
        [st.dbId, st.classId, st.sectionId, yearId, today, status]
      );
    }

    for (let i = 0; i < insertedStaff.length; i++) {
      const sf = insertedStaff[i];
      const status = i === 5 ? 'Late' : 'Present';
      await client.query(
        `INSERT INTO staff_attendance (staff_id, attendance_date, status, marked_by)
         VALUES ($1, $2, $3, 1) ON CONFLICT (staff_id, attendance_date) DO UPDATE
         SET status = $3`,
        [sf.dbId, today, status]
      );
    }

    // 11. Examinations & Marks
    console.log('  -> Creating Midterm Examination & Marks Ledger...');
    const examType = (await client.query("SELECT id FROM examination_types WHERE name = 'Midterm Examination'")).rows[0] || { id: 1 };
    const class10Id = classMap[10];
    let exam = (await client.query("SELECT id FROM examinations WHERE name = 'CBSE Midterm Examination 2025-26'")).rows[0];
    if (!exam && class10Id) {
      const exRes = await client.query(
        `INSERT INTO examinations (name, exam_type_id, academic_year_id, class_id, start_date, end_date, is_active)
         VALUES ('CBSE Midterm Examination 2025-26', $1, $2, $3, '2025-09-15', '2025-09-30', 1) RETURNING id`,
        [examType.id, yearId, class10Id]
      );
      exam = exRes.rows[0];
    }

    if (exam && mathSubj) {
      let exSubj = (await client.query("SELECT id FROM examination_subjects WHERE examination_id = $1 AND subject_id = $2", [exam.id, mathSubj])).rows[0];
      if (!exSubj) {
        const esRes = await client.query(
          `INSERT INTO examination_subjects (examination_id, subject_id, exam_date, max_marks, passing_marks)
           VALUES ($1, $2, '2025-09-18', 100, 33) RETURNING id`,
          [exam.id, mathSubj]
        );
        exSubj = esRes.rows[0];
      }

      // Enter marks for Class 10 students
      const class10Students = insertedStudents.filter(s => s.classNum === 10);
      const marksSample = [96.5, 92.0, 88.5, 95.0, 89.0];
      for (let i = 0; i < class10Students.length; i++) {
        const st = class10Students[i];
        const marks = marksSample[i % marksSample.length];
        await client.query(
          `INSERT INTO examination_marks (examination_id, exam_subject_id, student_id, obtained_marks, is_absent, remarks, entered_by)
           VALUES ($1, $2, $3, $4, 0, 'Excellent mathematical aptitude and conceptual clarity', 1)
           ON CONFLICT (examination_id, exam_subject_id, student_id) DO UPDATE SET obtained_marks = $4`,
          [exam.id, exSubj.id, st.dbId, marks]
        );
      }
    }

    // 12. Indian Fee Categories & Payments
    console.log('  -> Setting up Fee Structures & Issuing Fee Receipts...');
    const tuitionCat = (await client.query("SELECT id FROM fee_categories WHERE name = 'Tuition Fee'")).rows[0] || { id: 1 };
    let feeStruct = (await client.query("SELECT id FROM fee_structures WHERE class_id = $1 AND fee_category_id = $2", [class10Id, tuitionCat.id])).rows[0];
    if (!feeStruct && class10Id) {
      const fsRes = await client.query(
        `INSERT INTO fee_structures (academic_year_id, class_id, fee_category_id, amount, due_date, frequency, is_active)
         VALUES ($1, $2, $3, 45000, '2025-05-15', 'Quarterly', 1) RETURNING id`,
        [yearId, class10Id, tuitionCat.id]
      );
      feeStruct = fsRes.rows[0];
    }

    if (feeStruct) {
      for (let i = 0; i < insertedStudents.length; i++) {
        const st = insertedStudents[i];
        const status = i < 10 ? 'Paid' : 'Pending';
        const paid = i < 10 ? 45000 : 0;
        const sfRes = await client.query(
          `INSERT INTO student_fees (student_id, fee_structure_id, academic_year_id, total_amount, discount_amount, net_amount, paid_amount, status)
           VALUES ($1, $2, $3, 45000, 0, 45000, $4, $5) RETURNING id`,
          [st.dbId, feeStruct.id, yearId, paid, status]
        );

        if (status === 'Paid') {
          const recNum = `REC-2025-DEL-${String(i + 1).padStart(3, '0')}`;
          await client.query(
            `INSERT INTO fee_payments (student_fee_id, student_id, receipt_number, amount, payment_date, payment_mode, transaction_reference, collected_by, remarks)
             VALUES ($1, $2, $3, 45000, $4, 'UPI / NetBanking', 'HDFC982348271', 1, 'Quarter-1 Comprehensive Fee Cleared')
             ON CONFLICT (receipt_number) DO NOTHING`,
            [sfRes.rows[0].id, st.dbId, recNum, today]
          );
        }
      }
    }

    // 13. Institutional Notifications
    console.log('  -> Publishing Official School Notices...');
    for (const n of NOTIFICATIONS) {
      await client.query(
        `INSERT INTO notifications (title, message, category, created_by, target_role, is_active)
         VALUES ($1, $2, $3, 1, 'all', 1)`,
        [n.title, n.message, n.category]
      );
    }

    await client.query('COMMIT');
    console.log('🎉 PostgreSQL database populated with 2+ Admins, 20+ Staff, 20+ Students and complete Indian institutional records!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding PostgreSQL:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Also seed into SQLite so frontend is instantly populated in both databases
function seedToSqlite() {
  const db = getDb();
  console.log('📦 Seeding authentic Indian datasets to SQLite local fallback...');
  db.exec("PRAGMA foreign_keys = OFF;");

  const superAdminRole = db.prepare("SELECT id FROM roles WHERE name = 'superadmin'").get() || { id: 1 };
  const adminRole = db.prepare("SELECT id FROM roles WHERE name = 'admin'").get() || { id: 2 };
  const teacherRole = db.prepare("SELECT id FROM roles WHERE name = 'teacher'").get() || { id: 3 };
  const studentRole = db.prepare("SELECT id FROM roles WHERE name = 'student'").get() || { id: 4 };
  const parentRole = db.prepare("SELECT id FROM roles WHERE name = 'parent'").get() || { id: 5 };
  const staffRole = db.prepare("SELECT id FROM roles WHERE name = 'staff'").get() || { id: 7 };

  const curYear = db.prepare('SELECT id FROM academic_years WHERE is_current = 1').get() || { id: 1 };
  const yearId = curYear.id;

  // Insert Admins
  for (const adm of INDIAN_ADMINS) {
    let u = db.prepare('SELECT id FROM users WHERE username = ?').get(adm.username);
    if (!u) {
      const res = db.prepare(`
        INSERT INTO users (username, email, phone, password_hash, role_id, first_name, last_name, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `).run(adm.username, adm.email, adm.phone, defaultPasswordHash, adminRole.id, adm.firstName, adm.lastName);
      u = { id: res.lastInsertRowid };
    }
    db.prepare(`
      INSERT OR REPLACE INTO school_admins (user_id, campus_name, managed_classes, branch_code, designation, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(u.id, adm.campusName, adm.managedClasses, adm.branchCode, adm.designation, adm.notes);
  }

  // Insert Staff
  const deptMap = {};
  db.prepare('SELECT id, name FROM departments').all().forEach(d => deptMap[d.name] = d.id);

  const insertedStaff = [];
  for (const st of INDIAN_STAFF) {
    let u = db.prepare('SELECT id FROM users WHERE username = ?').get(st.staffId.toLowerCase());
    if (!u) {
      const res = db.prepare(`
        INSERT INTO users (username, email, phone, password_hash, role_id, first_name, last_name, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `).run(st.staffId.toLowerCase(), st.email, st.phone, facultyPasswordHash, st.type === 'Teaching' ? teacherRole.id : staffRole.id, st.first, st.last);
      u = { id: res.lastInsertRowid };
    }

    let s = db.prepare('SELECT id FROM staff WHERE staff_id = ?').get(st.staffId);
    if (!s) {
      const sRes = db.prepare(`
        INSERT INTO staff (staff_id, user_id, first_name, last_name, email, phone, gender, department_id, designation, staff_type, qualification, joining_date, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).run(st.staffId, u.id, st.first, st.last, st.email, st.phone, st.gender, deptMap[st.dept] || 1, st.desig, st.type, st.qual, st.date);
      s = { id: sRes.lastInsertRowid };
    }
    insertedStaff.push({ ...st, dbId: s.id });
  }

  // Insert Students
  const classMap = {};
  db.prepare('SELECT id, numeric_value FROM classes').all().forEach(c => classMap[c.numeric_value] = c.id);

  const insertedStudents = [];
  for (const st of INDIAN_STUDENTS) {
    const uName = st.studentId.toLowerCase();
    let u = db.prepare('SELECT id FROM users WHERE username = ?').get(uName);
    if (!u) {
      const res = db.prepare(`
        INSERT INTO users (username, email, phone, password_hash, role_id, first_name, last_name, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `).run(uName, `${uName}@delhischool.edu.in`, st.phone, studentPasswordHash, studentRole.id, st.first, st.last);
      u = { id: res.lastInsertRowid };
    }

    let s = db.prepare('SELECT id FROM students WHERE student_id = ?').get(st.studentId);
    if (!s) {
      const sRes = db.prepare(`
        INSERT INTO students (student_id, admission_number, user_id, first_name, last_name, date_of_birth, gender, blood_group, address, admission_date, emergency_contact, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '2025-04-01', ?, 1)
      `).run(st.studentId, st.admNo, u.id, st.first, st.last, st.dob, st.gender, st.blood, st.address, st.phone);
      s = { id: sRes.lastInsertRowid };
    }

    // Parent
    const pUName = `parent.${uName}`;
    const parentPhone = st.phone.replace(/^9810/, '9820');
    let pu = db.prepare('SELECT id FROM users WHERE username = ?').get(pUName);
    if (!pu) {
      const puRes = db.prepare(`
        INSERT INTO users (username, email, phone, password_hash, role_id, first_name, last_name, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `).run(pUName, `parent.${uName}@delhischool.edu.in`, parentPhone, studentPasswordHash, parentRole.id, st.fName.split(' ')[0], st.fName.split(' ').slice(1).join(' '));
      pu = { id: puRes.lastInsertRowid };
    }

    let p = db.prepare('SELECT id FROM parents WHERE user_id = ?').get(pu.id);
    if (!p) {
      const pRes = db.prepare(`
        INSERT INTO parents (user_id, father_name, mother_name, primary_contact, father_phone, address, occupation, is_active)
        VALUES (?, ?, ?, 'Father', ?, ?, ?, 1)
      `).run(pu.id, st.fName, st.mName, st.phone, st.address, st.occ);
      p = { id: pRes.lastInsertRowid };
    }

    db.prepare(`
      INSERT OR IGNORE INTO student_parents (student_id, parent_id, relation, is_primary)
      VALUES (?, ?, 'Father', 1)
    `).run(s.id, p.id);

    const clsId = classMap[st.classNum];
    const sec = db.prepare('SELECT id FROM sections WHERE class_id = ? AND name = ?').get(clsId, st.sec);
    if (clsId && sec) {
      db.prepare(`
        INSERT OR REPLACE INTO student_enrollments (student_id, class_id, section_id, academic_year_id, roll_number, status)
        VALUES (?, ?, ?, ?, ?, 'Active')
      `).run(s.id, clsId, sec.id, yearId, st.roll);
    }

    insertedStudents.push({ ...st, dbId: s.id, classId: clsId, sectionId: sec?.id });
  }

  // Attendance
  const today = new Date().toISOString().split('T')[0];
  for (let i = 0; i < insertedStudents.length; i++) {
    const st = insertedStudents[i];
    const status = i === 3 ? 'Absent' : i === 7 ? 'Late' : 'Present';
    if (st.classId && st.sectionId) {
      db.prepare(`
        INSERT OR REPLACE INTO student_attendance (student_id, class_id, section_id, academic_year_id, attendance_date, status, marked_by)
        VALUES (?, ?, ?, ?, ?, ?, 1)
      `).run(st.dbId, st.classId, st.sectionId, yearId, today, status);
    }
  }

  for (let i = 0; i < insertedStaff.length; i++) {
    const sf = insertedStaff[i];
    const status = i === 5 ? 'Late' : 'Present';
    db.prepare(`
      INSERT OR REPLACE INTO staff_attendance (staff_id, attendance_date, status, marked_by)
      VALUES (?, ?, ?, 1)
    `).run(sf.dbId, today, status);
  }

  // Notifications
  for (const n of NOTIFICATIONS) {
    db.prepare(`
      INSERT INTO notifications (title, message, category, created_by, target_role, is_active)
      VALUES (?, ?, ?, 1, 'all', 1)
    `).run(n.title, n.message, n.category);
  }

  db.exec("PRAGMA foreign_keys = ON;");
  console.log('✅ SQLite local database seeded with authentic Indian records!');
}

async function run() {
  try {
    seedToSqlite();
    await seedToPostgres();
    console.log('\n🚀 ALL INDIAN DATASETS (2+ Admins, 20+ Staff, 20+ Students) SEEDED SUCCESSFULLY TO BOTH DATABASES!');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

run();
