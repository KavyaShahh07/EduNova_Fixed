const prisma = require('../config/db');

async function fixQuizOptions() {
  const thermoOptions = [
    ['Conservation of Momentum', 'Conservation of Energy', 'Conservation of Mass', 'Second Law of Entropy'],
    ['Temperature', 'Pressure', 'Volume', 'Internal Energy'],
    ['Isobaric Process', 'Isochoric Process', 'Adiabatic Process', 'Isothermal Process']
  ];
  const thermoQs = await prisma.quizQuestion.findMany({ where: { fingerprint: { in: ['fp_thermo_q1', 'fp_thermo_q2', 'fp_thermo_q3'] } } });
  for (const q of thermoQs) {
    const idx = q.fingerprint === 'fp_thermo_q1' ? 0 : q.fingerprint === 'fp_thermo_q2' ? 1 : 2;
    await prisma.quizQuestion.update({ where: { id: q.id }, data: { options: thermoOptions[idx] } });
  }

  const electroOptions = [
    ['C² N⁻¹ m⁻²', 'N C⁻¹ m²', 'Farad per meter', 'Volt meter'],
    ['Net force only', 'Torque and linear acceleration', 'Torque only (zero net force)', 'Neither force nor torque'],
    ['Proportional to charge', 'Always Zero', 'Depends on distance', 'Infinite'],
    ['Increases by K', 'Decreases to zero', 'Decreases by 1/K', 'Remains unchanged']
  ];
  const electroQs = await prisma.quizQuestion.findMany({ where: { fingerprint: { in: ['fp_phy_01', 'fp_phy_02', 'fp_phy_03', 'fp_phy_04'] } } });
  for (const q of electroQs) {
    const idx = parseInt(q.fingerprint.slice(-1), 10) - 1;
    if (electroOptions[idx]) {
      await prisma.quizQuestion.update({ where: { id: q.id }, data: { options: electroOptions[idx] } });
    }
  }

  const mathOptions = [
    ['sec(x)', 'tan(x)', 'sec(x)tan(x)', 'cos(x)'],
    ['π', 'π/2', 'π/4', '0'],
    ['Order: 2, Degree: 1', 'Order: 1, Degree: 3', 'Order: 2, Degree: 3', 'Order: 3, Degree: 2']
  ];
  const mathQs = await prisma.quizQuestion.findMany({ where: { fingerprint: { in: ['fp_math_01', 'fp_math_02', 'fp_math_03'] } } });
  for (const q of mathQs) {
    const idx = parseInt(q.fingerprint.slice(-1), 10) - 1;
    if (mathOptions[idx]) {
      await prisma.quizQuestion.update({ where: { id: q.id }, data: { options: mathOptions[idx] } });
    }
  }

  const webOptions = [
    ['Timers Queue', 'Check Queue', 'Poll Queue', 'Close Callbacks'],
    ['SameSite Attribute', 'Access-Control-Allow-Origin', 'X-Frame-Options', 'Content-Security-Policy']
  ];
  const webQs = await prisma.quizQuestion.findMany({ where: { fingerprint: { in: ['fp_web_01', 'fp_web_02'] } } });
  for (const q of webQs) {
    const idx = parseInt(q.fingerprint.slice(-1), 10) - 1;
    if (webOptions[idx]) {
      await prisma.quizQuestion.update({ where: { id: q.id }, data: { options: webOptions[idx] } });
    }
  }

  console.log('✅ Successfully fixed and populated all quiz options in PostgreSQL!');
}

fixQuizOptions().catch(console.error).finally(() => process.exit(0));
