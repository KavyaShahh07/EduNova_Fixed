/**
 * EduNova Intelligent Game Content Synthesizer
 * Generates rich, curriculum-aligned academic questions, formula pairs,
 * memory cards, and sequence puzzles derived from PostgreSQL Subjects & Topics.
 */

function synthesizeDatabaseGameContent(gameType = 'RAPID', subjectName = 'Physics', topics = []) {
  const topicTitles = topics.map(t => t.title || t).filter(Boolean);
  const primaryTopic = topicTitles[0] || 'Core Principles';
  const secondaryTopic = topicTitles[1] || 'Applied Theories';

  switch (gameType) {
    case 'FORMULA':
      if (subjectName.toLowerCase().includes('math')) {
        return [
          { formulaName: 'Quadratic Discriminant', equation: 'Δ = b² - 4ac', options: ['b² - 4ac', '-b / 2a', 'a² + b²'], answer: 'b² - 4ac' },
          { formulaName: 'Derivative of ln(x)', equation: 'd/dx[ln(x)] = 1/x', options: ['1/x', 'e^x', 'x ln(x)'], answer: '1/x' },
          { formulaName: 'Euler’s Identity', equation: 'e^(iπ) + 1 = 0', options: ['e^(iπ) + 1 = 0', 'e^x = 1 + x', 'sin²x + cos²x = 1'], answer: 'e^(iπ) + 1 = 0' },
          { formulaName: 'Binomial Theorem General Term', equation: 'T(r+1) = ⁿCᵣ aⁿ⁻ʳ bʳ', options: ['ⁿCᵣ aⁿ⁻ʳ bʳ', 'ⁿPᵣ aʳ', 'aⁿ + bⁿ'], answer: 'ⁿCᵣ aⁿ⁻ʳ bʳ' },
          { formulaName: 'Pythagorean Trigonometric Identity', equation: 'sin²(θ) + cos²(θ) = 1', options: ['sin²(θ) + cos²(θ) = 1', 'tan²(θ) + 1 = cot²(θ)', 'sec²(θ) - 1 = sin(θ)'], answer: 'sin²(θ) + cos²(θ) = 1' },
          { formulaName: 'Standard Normal Distribution Integral', equation: '∫ e^(-x²) dx = √π', options: ['√π', 'π / 2', '2π'], answer: '√π' }
        ];
      }
      if (subjectName.toLowerCase().includes('chem')) {
        return [
          { formulaName: 'Ideal Gas Equation', equation: 'PV = nRT', options: ['PV = nRT', 'P/T = constant', 'V1/T1 = V2/T2'], answer: 'PV = nRT' },
          { formulaName: 'Arrhenius Activation Energy', equation: 'k = A·e^(-Ea/RT)', options: ['k = A·e^(-Ea/RT)', 'k = [A][B]', 'ΔG = ΔH - TΔS'], answer: 'k = A·e^(-Ea/RT)' },
          { formulaName: 'Gibbs Free Energy', equation: 'ΔG = ΔH - TΔS', options: ['ΔG = ΔH - TΔS', 'ΔU = q + w', 'PV = nRT'], answer: 'ΔG = ΔH - TΔS' },
          { formulaName: 'Nernst Equation for Cell Potential', equation: 'E = E° - (RT/nF)ln(Q)', options: ['E = E° - (RT/nF)ln(Q)', 'E = mc²', 'q = mcΔT'], answer: 'E = E° - (RT/nF)ln(Q)' }
        ];
      }
      // Default: Physics / General Science
      return [
        { formulaName: 'Newton’s Second Law', equation: 'F = m · a', options: ['F = m · a', 'v = u + at', 'E = mc²'], answer: 'F = m · a' },
        { formulaName: 'Kinetic Energy Formula', equation: 'KE = ½ m v²', options: ['½ m v²', 'm g h', 'F × d'], answer: '½ m v²' },
        { formulaName: 'Gravitational Potential Energy', equation: 'PE = m · g · h', options: ['m · g · h', '½ k x²', 'G m1 m2 / r'], answer: 'm · g · h' },
        { formulaName: 'Coulomb’s Electrostatic Law', equation: 'F = (1/4πε₀) · (q₁q₂ / r²)', options: ['(1/4πε₀) · (q₁q₂ / r²)', 'q · E', 'V / d'], answer: '(1/4πε₀) · (q₁q₂ / r²)' },
        { formulaName: 'Ohm’s Law Relationship', equation: 'V = I · R', options: ['V = I · R', 'P = V · I', 'I = Q / t'], answer: 'V = I · R' },
        { formulaName: 'Einstein Mass-Energy Equivalence', equation: 'E = m · c²', options: ['E = m · c²', 'E = h · f', 'p = h / λ'], answer: 'E = m · c²' }
      ];

    case 'MEMORY':
      return [
        { id: '1', term: `${subjectName}: Core Law`, match: `Fundamental principle governing ${primaryTopic}` },
        { id: '2', term: `${primaryTopic} Variable`, match: 'State function depending only on initial and final points' },
        { id: '3', term: 'Conservation Principle', match: 'Total energy in an isolated system remains constant' },
        { id: '4', term: `${secondaryTopic} Rate`, match: 'First derivative representing instantaneous change over time' },
        { id: '5', term: 'Equilibrium State', match: 'Net external vector force and moment equals zero' },
        { id: '6', term: 'Boundary Condition', match: 'Specified constraints on the physical boundary of the domain' }
      ];

    case 'CONCEPT':
      return [
        { id: '1', concept: `${primaryTopic} Definition`, match: `Foundational framework underlying ${subjectName}`, category: 'Theory' },
        { id: '2', concept: 'Action-Reaction Pair', match: 'Equal magnitude forces acting on distinct interaction bodies', category: 'Mechanics' },
        { id: '3', concept: 'Conservation of Momentum', match: 'Closed system momentum invariant under zero net external impulse', category: 'Dynamics' },
        { id: '4', concept: `${secondaryTopic} Model`, match: 'Empirical mathematical approximation for observed phenomenon', category: 'Application' },
        { id: '5', concept: 'Work-Energy Theorem', match: 'Net work performed on a particle equals change in kinetic energy', category: 'Energy' },
        { id: '6', concept: 'Resonance Condition', match: 'Driving frequency coincides with natural frequency of oscillation', category: 'Waves' }
      ];

    case 'SORT':
      return [
        {
          title: `Standard Derivation Protocol: ${primaryTopic}`,
          steps: [
            'State foundational axioms and boundary constraints',
            'Formulate the governing differential equation',
            'Integrate using separation of variables',
            'Apply initial conditions to solve for constant of integration'
          ]
        },
        {
          title: 'Scientific Method & Experimental Workflow',
          steps: [
            'Observe natural phenomenon and state hypothesis',
            'Design controlled experiment isolating independent variable',
            'Collect quantitative empirical telemetry and measurements',
            'Perform statistical error analysis and draw verified conclusion'
          ]
        },
        {
          title: `Optimization Protocol for ${secondaryTopic}`,
          steps: [
            'Define objective target function f(x)',
            'Compute first-order gradient df/dx and identify critical points',
            'Evaluate second derivative d²f/dx² to verify extremum polarity',
            'Check boundary endpoints to identify global maximum'
          ]
        },
        {
          title: 'Algorithmic Problem Decomposition',
          steps: [
            'Parse input constraints and define edge test cases',
            'Construct formal invariant and recurrence relations',
            'Implement optimal divide-and-conquer transformation',
            'Verify asymptotic time complexity O(n log n) and space bounds'
          ]
        }
      ];

    case 'FIX':
      return [
        {
          flawedStatement: `In ${subjectName}, kinetic energy is linearly proportional to velocity (KE = m·v).`,
          errorDescription: 'Kinetic energy scales quadratically with velocity.',
          correctedStatement: 'KE = ½ m v²',
          options: ['KE = ½ m v²', 'KE = m·g·h', 'KE = F · d'],
          answer: 'KE = ½ m v²'
        },
        {
          flawedStatement: 'Work done moving a charge across an equipotential surface equals q·V.',
          errorDescription: 'Potential difference ΔV across an equipotential surface is 0, so work done is always 0.',
          correctedStatement: 'W = q · ΔV = 0',
          options: ['W = q · ΔV = 0', 'W = q · E', 'W = ½ C V²'],
          answer: 'W = q · ΔV = 0'
        },
        {
          flawedStatement: 'The First Law of Thermodynamics states that heat is destroyed during expansion.',
          errorDescription: 'Energy cannot be destroyed; heat converts into thermodynamic work: ΔU = Q - W.',
          correctedStatement: 'ΔU = Q - W (Conservation of Energy)',
          options: ['ΔU = Q - W (Conservation of Energy)', 'Q = m c ΔT', 'PV = nRT'],
          answer: 'ΔU = Q - W (Conservation of Energy)'
        },
        {
          flawedStatement: 'Acceleration in uniform circular motion points tangentially to the trajectory path.',
          errorDescription: 'Centripetal acceleration is directed radially inward towards the center of the circle.',
          correctedStatement: 'a_c = v² / r directed towards the center',
          options: ['a_c = v² / r directed towards the center', 'a = dv/dt tangential', 'a = 0 in circular motion'],
          answer: 'a_c = v² / r directed towards the center'
        }
      ];

    case 'BOSS':
      return {
        bossName: `Titan of ${subjectName}: ${primaryTopic}`,
        maxHp: 400,
        questions: [
          {
            question: `In ${primaryTopic}, what is the dimensional formula of the fundamental constant?`,
            options: ['[M¹ L² T⁻²]', '[M¹ L¹ T⁻¹]', '[M⁰ L¹ T⁻²]'],
            answer: '[M¹ L² T⁻²]',
            damage: 100
          },
          {
            question: `When applying conservation laws to ${secondaryTopic}, which condition must hold?`,
            options: ['Zero net external force on the system', 'Constant system temperature', 'Infinite boundary distance'],
            answer: 'Zero net external force on the system',
            damage: 100
          },
          {
            question: 'What is the physical interpretation of the divergence of a vector field being zero (∇·B = 0)?',
            options: ['Absence of isolated magnetic monopoles', 'Uniform electric field', 'Infinite wave propagation speed'],
            answer: 'Absence of isolated magnetic monopoles',
            damage: 100
          },
          {
            question: 'In an isolated adiabatic expansion, the change in internal energy equals:',
            options: ['Negative of the work done by the system (-W)', 'Total heat added Q', 'Zero at all times'],
            answer: 'Negative of the work done by the system (-W)',
            damage: 100
          }
        ]
      };

    case 'LAB':
      return {
        experimentTitle: `Virtual Lab: Empirical Investigation of ${primaryTopic}`,
        hypothesis: `Empirical rate of change directly correlates with applied gradient across ${secondaryTopic}.`,
        steps: [
          'Calibrate primary sensory apparatus to zero datum',
          'Apply stepped increment to the independent control variable',
          'Record transient response until steady-state equilibrium'
        ],
        questions: [
          {
            question: 'What is the primary source of random uncertainty in this measurement?',
            options: ['Thermal fluctuations and reading parallax', 'Incorrect calibration factor', 'Atmospheric refraction'],
            answer: 'Thermal fluctuations and reading parallax'
          },
          {
            question: 'How do you mathematically minimize random measurement error?',
            options: ['Calculate the mean over multiple independent trials', 'Double the input voltage', 'Extrapolate beyond the dataset'],
            answer: 'Calculate the mean over multiple independent trials'
          }
        ]
      };

    default: // RAPID
      return [
        {
          question: `In ${subjectName}, what does the slope of a velocity-time graph represent?`,
          options: ['Acceleration', 'Displacement', 'Jerk'],
          answer: 'Acceleration'
        },
        {
          question: `What is the SI unit of power in ${subjectName}?`,
          options: ['Watt (W)', 'Joule (J)', 'Newton (N)'],
          answer: 'Watt (W)'
        },
        {
          question: `Which fundamental law relates to ${primaryTopic}?`,
          options: ['Conservation of Energy', 'Boyle’s Law', 'Coulomb’s Inverse Square'],
          answer: 'Conservation of Energy'
        },
        {
          question: 'What happens to the resistance of an ideal conductor at absolute zero (superconductivity)?',
          options: ['Drops to exactly zero', 'Increases to infinity', 'Remains 1 Ohm'],
          answer: 'Drops to exactly zero'
        },
        {
          question: `In ${secondaryTopic}, how is instantaneous rate of change evaluated?`,
          options: ['First derivative dy/dx', 'Integral ∫ y dx', 'Average ratio Δy/Δx'],
          answer: 'First derivative dy/dx'
        },
        {
          question: 'What is the escape velocity from Earth’s surface approximately?',
          options: ['11.2 km/s', '9.8 m/s²', '3.0 × 10⁸ m/s'],
          answer: '11.2 km/s'
        }
      ];
  }
}

module.exports = {
  synthesizeDatabaseGameContent,
};
