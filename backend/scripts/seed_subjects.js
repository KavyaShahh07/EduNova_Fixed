const prisma = require('../config/db');

const universalSubjects = [
  // School - Class 9
  { id: 'sch_math_9', name: 'Mathematics (Class 9)', category: 'Mathematics', educationType: 'SCHOOL', class: '9', board: 'CBSE' },
  { id: 'sch_sci_9', name: 'Science (Class 9)', category: 'Science', educationType: 'SCHOOL', class: '9', board: 'CBSE' },
  { id: 'sch_eng_9', name: 'English (Class 9)', category: 'Languages', educationType: 'SCHOOL', class: '9', board: 'CBSE' },
  { id: 'sch_sst_9', name: 'Social Science (Class 9)', category: 'Humanities', educationType: 'SCHOOL', class: '9', board: 'CBSE' },

  // School - Class 10
  { id: 'sch_math_10', name: 'Mathematics', category: 'Mathematics', educationType: 'SCHOOL', class: '10', board: 'CBSE' },
  { id: 'sch_physics_10', name: 'Physics (Science)', category: 'Science', educationType: 'SCHOOL', class: '10', board: 'CBSE' },
  { id: 'sch_chem_10', name: 'Chemistry (Science)', category: 'Science', educationType: 'SCHOOL', class: '10', board: 'CBSE' },
  { id: 'sch_bio_10', name: 'Biology (Science)', category: 'Science', educationType: 'SCHOOL', class: '10', board: 'CBSE' },
  { id: 'sch_eng_10', name: 'English Language & Literature', category: 'Languages', educationType: 'SCHOOL', class: '10', board: 'CBSE' },
  { id: 'sch_sst_10', name: 'Social Science', category: 'Humanities', educationType: 'SCHOOL', class: '10', board: 'CBSE' },
  { id: 'sch_cs_10', name: 'Computer Applications', category: 'Computer Science', educationType: 'SCHOOL', class: '10', board: 'CBSE' },

  // School - Class 11 & 12
  { id: 'sch_math_11', name: 'Mathematics (Class 11)', category: 'Mathematics', educationType: 'SCHOOL', class: '11', board: 'CBSE' },
  { id: 'sch_physics_11', name: 'Physics (Class 11)', category: 'Science', educationType: 'SCHOOL', class: '11', board: 'CBSE' },
  { id: 'sch_chem_11', name: 'Chemistry (Class 11)', category: 'Science', educationType: 'SCHOOL', class: '11', board: 'CBSE' },
  { id: 'sch_bio_11', name: 'Biology (Class 11)', category: 'Science', educationType: 'SCHOOL', class: '11', board: 'CBSE' },
  { id: 'sch_cs_11', name: 'Computer Science (Python)', category: 'Computer Science', educationType: 'SCHOOL', class: '11', board: 'CBSE' },

  { id: 'sch_math_12', name: 'Mathematics (Class 12)', category: 'Mathematics', educationType: 'SCHOOL', class: '12', board: 'CBSE' },
  { id: 'sch_physics_12', name: 'Physics (Class 12)', category: 'Science', educationType: 'SCHOOL', class: '12', board: 'CBSE' },
  { id: 'sch_chem_12', name: 'Chemistry (Class 12)', category: 'Science', educationType: 'SCHOOL', class: '12', board: 'CBSE' },
  { id: 'sch_bio_12', name: 'Biology (Class 12)', category: 'Science', educationType: 'SCHOOL', class: '12', board: 'CBSE' },

  // College - Sem 1 to 6
  { id: 'col_c_sem1', name: 'C Programming & Problem Solving', category: 'Computer Science', educationType: 'COLLEGE', degree: 'B.Tech', semester: '1' },
  { id: 'col_math_sem1', name: 'Engineering Mathematics I', category: 'Mathematics', educationType: 'COLLEGE', degree: 'B.Tech', semester: '1' },
  { id: 'col_dsa_sem3', name: 'Data Structures & Algorithms', category: 'Computer Science', educationType: 'COLLEGE', degree: 'B.Tech', semester: '3' },
  { id: 'col_oop_sem3', name: 'Object Oriented Programming (Java/C++)', category: 'Computer Science', educationType: 'COLLEGE', degree: 'B.Tech', semester: '3' },
  { id: 'col_dbms_sem5', name: 'Database Management Systems', category: 'Computer Science', educationType: 'COLLEGE', degree: 'B.Tech', semester: '5' },
  { id: 'col_os_sem5', name: 'Operating Systems', category: 'Computer Science', educationType: 'COLLEGE', degree: 'B.Tech', semester: '5' },
  { id: 'col_cn_sem5', name: 'Computer Networks', category: 'Computer Science', educationType: 'COLLEGE', degree: 'B.Tech', semester: '5' },
  { id: 'col_web_sem5', name: 'Web Engineering & Technologies', category: 'Computer Science', educationType: 'COLLEGE', degree: 'B.Tech', semester: '5' },
  { id: 'col_se_sem5', name: 'Software Engineering', category: 'Computer Science', educationType: 'COLLEGE', degree: 'B.Tech', semester: '5' },

  // Exam
  { id: 'exm_jee_phys', name: 'JEE Physics Mechanics & Electrodynamics', category: 'Science', educationType: 'EXAM', exam: 'JEE Mains' },
  { id: 'exm_jee_chem', name: 'JEE Organic & Physical Chemistry', category: 'Science', educationType: 'EXAM', exam: 'JEE Mains' },
  { id: 'exm_jee_math', name: 'JEE Calculus & Algebra', category: 'Mathematics', educationType: 'EXAM', exam: 'JEE Mains' },
  { id: 'exm_neet_bio', name: 'NEET Botany & Zoology', category: 'Biology', educationType: 'EXAM', exam: 'NEET' },
  { id: 'exm_quant', name: 'Quantitative Aptitude', category: 'Aptitude', educationType: 'EXAM', exam: 'CAT' },
  { id: 'exm_reasoning', name: 'Logical Reasoning & Data Interpretation', category: 'Logical Reasoning', educationType: 'EXAM', exam: 'CAT' },
  { id: 'exm_english', name: 'Verbal Ability & English', category: 'Verbal Ability', educationType: 'EXAM', exam: 'CAT' },
  { id: 'exm_gk', name: 'General Awareness & Current Affairs', category: 'General Knowledge', educationType: 'EXAM', exam: 'UPSC' },

  // Skill
  { id: 'skl_fullstack', name: 'Full Stack Web Development', category: 'Development', educationType: 'SKILLS' },
  { id: 'skl_uiux', name: 'UI/UX Design & User Experience', category: 'Design', educationType: 'SKILLS' },
  { id: 'skl_backend', name: 'Backend Systems & Architecture', category: 'Engineering', educationType: 'SKILLS' },
  { id: 'skl_devops', name: 'DevOps & Cloud Engineering', category: 'DevOps', educationType: 'SKILLS' },
  { id: 'skl_aiml', name: 'AI & Machine Learning Foundations', category: 'Artificial Intelligence', educationType: 'SKILLS' },
  { id: 'skl_datasci', name: 'Data Science & Analytics with Python', category: 'Data Science', educationType: 'SKILLS' },
];

async function seed() {
  console.log('Seeding universal subjects...');
  
  // Find creator admin user
  const creator = await prisma.user.findFirst({ where: { role: { in: ['ADMIN', 'INSTRUCTOR'] } } });
  const createdById = creator ? creator.id : (await prisma.user.findFirst())?.id;

  if (!createdById) {
    console.error('No user available for createdById.');
    process.exit(1);
  }

  for (const s of universalSubjects) {
    const existing = await prisma.subject.findFirst({
      where: {
        OR: [
          { id: s.id },
          { name: s.name }
        ]
      }
    });

    if (!existing) {
      await prisma.subject.create({
        data: {
          id: s.id,
          name: s.name,
          category: s.category,
          educationType: s.educationType,
          class: s.class || null,
          board: s.board || null,
          degree: s.degree || null,
          semester: s.semester || null,
          exam: s.exam || null,
          createdById,
        }
      });
      console.log(`Created subject: ${s.name} (${s.id})`);
    } else {
      console.log(`Subject already exists: ${existing.name} (${existing.id})`);
    }
  }

  console.log('✅ Universal subjects seeding completed.');
  await prisma.$disconnect();
}

seed().catch((err) => {
  console.error('Error seeding subjects:', err);
  prisma.$disconnect();
  process.exit(1);
});
