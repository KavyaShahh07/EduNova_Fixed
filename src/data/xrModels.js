/**
 * EduNova Educational 3D & XR Model Registry
 * Reusable scientifically accurate multi-domain model configurations for School, College, Exam Prep, and Skills & Career.
 */

export const XR_MODELS = [
  // ==================== SCHOOL MODELS ====================
  {
    id: 'human-heart',
    name: 'Human Heart 3D Anatomy & Hemodynamics',
    category: 'Biology & Physiology',
    educationTypes: ['school'],
    subjects: ['Biology', 'Anatomy & Physiology', 'Science'],
    topic: 'Circulatory System & Cardiac Cycle',
    description: 'Muscular four-chambered cardiac pump supplying oxygenated blood through systemic and pulmonary circulation.',
    hasExplodedView: true,
    hasXrayView: true,
    formula: 'CO = HR \\times SV \\quad (\\text{Cardiac Output} = \\text{Heart Rate} \\times \\text{Stroke Volume})',
    parameters: [
      { name: 'Heart Rate', unit: 'BPM', min: 40, max: 180, default: 72, step: 1 },
      { name: 'Stroke Volume', unit: 'mL', min: 50, max: 120, default: 70, step: 5 }
    ],
    hotspots: [
      { id: 'aorta', name: 'Aorta', description: 'Main systemic artery delivering oxygenated blood at ~120 mmHg arterial pressure.', x: 50, y: 22, importance: 'High' },
      { id: 'left-ventricle', name: 'Left Ventricle', description: 'Thickest muscular chamber producing systemic pumping pressure against total peripheral resistance.', x: 64, y: 60, importance: 'High' },
      { id: 'right-atrium', name: 'Right Atrium', description: 'Receives deoxygenated venous return from Superior & Inferior Vena Cava.', x: 32, y: 44, importance: 'Medium' },
      { id: 'pulmonary-artery', name: 'Pulmonary Artery', description: 'Carries deoxygenated venous blood from right ventricle to alveolar capillaries in the lungs.', x: 40, y: 28, importance: 'High' },
      { id: 'mitral-valve', name: 'Bicuspid (Mitral) Valve', description: 'Atrioventricular valve preventing backflow into the left atrium during ventricular systole.', x: 58, y: 48, importance: 'High' }
    ]
  },
  {
    id: 'convex-lens-optics',
    name: 'Convex Lens & Ray Optics Refraction',
    category: 'Physics',
    educationTypes: ['school', 'exam'],
    subjects: ['Physics', 'Science'],
    topic: 'Light - Refraction & Ray Tracing',
    description: 'Converging optical biconvex lens demonstrating real inverted vs virtual erect image formation and focal geometry.',
    hasExplodedView: false,
    hasXrayView: true,
    formula: '\\frac{1}{f} = \\frac{1}{v} - \\frac{1}{u}, \\quad m = \\frac{v}{u}',
    parameters: [
      { name: 'Focal Length (f)', unit: 'cm', min: 5, max: 30, default: 15, step: 1 },
      { name: 'Object Distance (u)', unit: 'cm', min: 10, max: 60, default: 30, step: 1 },
      { name: 'Refractive Index (n)', unit: '', min: 1.0, max: 2.5, default: 1.5, step: 0.1 }
    ],
    hotspots: [
      { id: 'optical-center', name: 'Optical Center (O)', description: 'Central point of lens where light rays pass straight without suffering angular refraction.', x: 50, y: 50, importance: 'High' },
      { id: 'principal-focus', name: 'Principal Focus (F)', description: 'Point on the principal axis where incident parallel light rays converge after refraction.', x: 74, y: 50, importance: 'High' },
      { id: 'center-curvature', name: 'Center of Curvature (2F)', description: 'Point at distance 2f where an object placed yields a real image of identical magnification.', x: 88, y: 50, importance: 'Medium' }
    ]
  },
  {
    id: 'atom-bohr-model',
    name: 'Bohr Carbon Atom & Quantum Shells',
    category: 'Chemistry',
    educationTypes: ['school', 'college'],
    subjects: ['Chemistry', 'Science'],
    topic: 'Atomic Structure & Quantum Orbitals',
    description: 'Quantum planetary atomic model featuring nucleus with 6 protons/neutrons and K & L principal electron energy shells.',
    hasExplodedView: true,
    hasXrayView: true,
    formula: 'E_n = -\\frac{13.6 \\times Z^2}{n^2} \\text{ eV}, \\quad r_n = 0.529 \\frac{n^2}{Z} \\text{ \\AA}',
    parameters: [
      { name: 'Atomic Number (Z)', unit: '', min: 1, max: 10, default: 6, step: 1 },
      { name: 'Quantum Shell (n)', unit: '', min: 1, max: 4, default: 2, step: 1 }
    ],
    hotspots: [
      { id: 'nucleus', name: 'Atomic Nucleus', description: 'Dense central core containing 6 protons and 6 neutrons bound by strong nuclear force.', x: 50, y: 50, importance: 'High' },
      { id: 'k-shell', name: 'K Inner Shell (n=1)', description: 'Innermost principal energy level holding up to 2 paired electrons with lowest orbital energy.', x: 42, y: 40, importance: 'Medium' },
      { id: 'valence-shell', name: 'Valence Shell (n=2)', description: 'Outer L shell containing 4 valence electrons responsible for tetrahedral covalent bonding.', x: 76, y: 32, importance: 'High' }
    ]
  },
  {
    id: 'solenoid-electromagnet',
    name: 'Solenoid Electromagnetic Induction Field',
    category: 'Physics',
    educationTypes: ['school', 'exam'],
    subjects: ['Physics', 'Science'],
    topic: 'Magnetism & Electromagnetism',
    description: 'Helical copper coil generating uniform axial magnetic dipole field proportional to electric current density.',
    hasExplodedView: true,
    hasXrayView: true,
    formula: 'B = \\mu_0 n I = \\mu_0 \\frac{N}{L} I, \\quad \\mathcal{E} = -N \\frac{d\\Phi_B}{dt}',
    parameters: [
      { name: 'Current (I)', unit: 'A', min: 0.5, max: 10, default: 3.5, step: 0.5 },
      { name: 'Turns Count (N)', unit: '', min: 50, max: 500, default: 200, step: 25 }
    ],
    hotspots: [
      { id: 'coil-core', name: 'Ferromagnetic Soft Iron Core', description: 'High permeability core concentrating magnetic field lines and multiplying magnetic flux B by relative permeability mu_r.', x: 50, y: 50, importance: 'High' },
      { id: 'flux-lines', name: 'Uniform Magnetic Flux Lines', description: 'Parallel magnetic flux density vector field lines inside the core showing uniform B-field intensity.', x: 68, y: 35, importance: 'High' }
    ]
  },

  // ==================== COLLEGE / UNIVERSITY MODELS ====================
  {
    id: 'cpu-pipeline-arch',
    name: 'RISC-V Superscalar CPU Pipeline 3D',
    category: 'Computer Science & Engineering',
    educationTypes: ['college'],
    subjects: ['Computer Architecture', 'Computer Science', 'Hardware Systems'],
    topic: 'Pipelining, ALU Execution & Stalls',
    description: '5-stage RISC instruction pipeline: Fetch (IF), Decode (ID), Execute (EX), Memory (MEM), Writeback (WB) with hazard control.',
    hasExplodedView: true,
    hasXrayView: true,
    formula: '\\text{CPI} = 1 + \\text{Data Stalls} + \\text{Control Stalls}, \\quad \\text{Execution Time} = \\text{IC} \\times \\text{CPI} \\times \\tau',
    parameters: [
      { name: 'Clock Speed (f)', unit: 'GHz', min: 1.0, max: 5.0, default: 3.2, step: 0.1 },
      { name: 'Pipeline Stages', unit: '', min: 3, max: 14, default: 5, step: 1 }
    ],
    hotspots: [
      { id: 'alu-core', name: 'Arithmetic Logic Unit (ALU)', description: 'High-speed 64-bit execution core performing arithmetic, bitwise shifts, and branch evaluation.', x: 50, y: 56, importance: 'High' },
      { id: 'l1-cache', name: 'L1 Data SRAM Cache', description: 'Ultra-low latency (1-2 cycle) on-chip cache storing hot data blocks for fast memory access.', x: 74, y: 32, importance: 'High' },
      { id: 'branch-predictor', name: 'Branch Target Buffer (BTB)', description: '2-bit saturating counter branch predictor mitigating control hazard pipeline flushes.', x: 28, y: 32, importance: 'High' },
      { id: 'register-file', name: 'General Purpose Register File (R0-R31)', description: 'Dual read port, single write port 32-register bank delivering operands to EX stage.', x: 38, y: 56, importance: 'Medium' }
    ]
  },
  {
    id: 'binary-search-tree',
    name: '3D AVL & Red-Black Balanced Binary Search Tree',
    category: 'Computer Science',
    educationTypes: ['college', 'skills'],
    subjects: ['Data Structures & Algorithms', 'Computer Science'],
    topic: 'Self-Balancing Trees & Graph Traversal',
    description: 'Dynamic key node hierarchy demonstrating BST property, in-order traversal, and AVL rotation balance factors.',
    hasExplodedView: true,
    hasXrayView: false,
    formula: '\\text{Height} = O(\\log_2 N), \\quad \\text{Balance Factor } BF = h_{\\text{left}} - h_{\\text{right}} \\in \\{-1, 0, +1\\}',
    parameters: [
      { name: 'Node Count (N)', unit: '', min: 3, max: 31, default: 7, step: 2 },
      { name: 'Tree Height (h)', unit: '', min: 2, max: 6, default: 3, step: 1 }
    ],
    hotspots: [
      { id: 'root-node', name: 'Root Key Node (50)', description: 'Topmost parent node from which binary decision branching and search paths originate.', x: 50, y: 15, importance: 'High' },
      { id: 'left-subtree', name: 'Left Subtree (Keys < 50)', description: 'Ordered left branch containing strictly smaller node values guaranteeing BST ordering property.', x: 30, y: 38, importance: 'High' },
      { id: 'right-subtree', name: 'Right Subtree (Keys > 50)', description: 'Ordered right branch containing strictly greater node values (75, 62, 87).', x: 70, y: 38, importance: 'High' },
      { id: 'rotation-pivot', name: 'AVL Single/Double Rotation Pivot', description: 'Self-balancing rotation trigger re-balancing height difference when |BF| > 1.', x: 50, y: 45, importance: 'High' }
    ]
  },
  {
    id: 'dbms-btree-architecture',
    name: 'Database Relational B+ Tree Index Architecture',
    category: 'Computer Science',
    educationTypes: ['college', 'skills'],
    subjects: ['Database Management Systems', 'Software Engineering'],
    topic: 'Database Indexing & Disk Block IO',
    description: 'Multi-level node index hierarchy reducing secondary storage disk I/O seek costs from O(N) scan to O(log_B N).',
    hasExplodedView: true,
    hasXrayView: true,
    formula: '\\text{IO Cost} = O(\\log_B N), \\quad B = \\text{Fanout Factor } (\\approx 100-500)',
    parameters: [
      { name: 'Page Size', unit: 'KB', min: 4, max: 64, default: 16, step: 4 },
      { name: 'Fanout (B)', unit: '', min: 10, max: 500, default: 100, step: 10 }
    ],
    hotspots: [
      { id: 'index-root', name: 'Root Index Page Block', description: 'In-memory root page storing high-level key ranges for query routing.', x: 50, y: 20, importance: 'High' },
      { id: 'internal-pointers', name: 'Internal Routing Pointer Nodes', description: 'Non-leaf nodes directing search binary key ranges to lower-level index pages.', x: 50, y: 45, importance: 'Medium' },
      { id: 'leaf-pages', name: 'Clustered Leaf Data Pages', description: 'Bottom-level disk pages linked via doubly linked list storing actual row records or tuple IDs.', x: 30, y: 72, importance: 'High' }
    ]
  },
  {
    id: 'quantum-bloch-sphere',
    name: 'Quantum Qubit & Bloch Sphere Geometry',
    category: 'Quantum Physics & Computing',
    educationTypes: ['college'],
    subjects: ['Quantum Computing', 'Physics', 'Mathematics'],
    topic: 'Qubit Superposition & Gate Rotations',
    description: '3D unit sphere representation of a single qubit state vector in 2D Hilbert space with Hadamard and Pauli rotation gates.',
    hasExplodedView: false,
    hasXrayView: true,
    formula: '|\\psi\\rangle = \\cos\\left(\\frac{\\theta}{2}\\right)|0\\rangle + e^{i\\phi}\\sin\\left(\\frac{\\theta}{2}\\right)|1\\rangle',
    parameters: [
      { name: 'Theta (θ)', unit: 'deg', min: 0, max: 180, default: 90, step: 5 },
      { name: 'Phi (φ)', unit: 'deg', min: 0, max: 360, default: 45, step: 5 }
    ],
    hotspots: [
      { id: 'state-vector', name: 'State Vector Pointer |ψ⟩', description: 'Pure state unit vector pointing on the 3D Bloch sphere surface indicating superposition coefficients.', x: 58, y: 38, importance: 'High' },
      { id: 'basis-zero', name: 'North Pole |0⟩ State', description: 'Eigenstate corresponding to Z-basis computational 0 bit with theta = 0.', x: 50, y: 15, importance: 'High' },
      { id: 'basis-one', name: 'South Pole |1⟩ State', description: 'Eigenstate corresponding to Z-basis computational 1 bit with theta = 180 deg.', x: 50, y: 85, importance: 'High' }
    ]
  },

  // ==================== EXAM PREP MODELS ====================
  {
    id: 'wave-optics-double-slit',
    name: 'Young Double Slit Interference & Wavefronts',
    category: 'Physics',
    educationTypes: ['exam', 'school'],
    subjects: ['Physics', 'Competitive Exams'],
    topic: 'Wave Optics & Interference Fringes',
    description: 'Coherent monochromatic wave diffraction producing alternating bright constructive and dark destructive interference fringes.',
    hasExplodedView: true,
    hasXrayView: true,
    formula: '\\beta = \\frac{\\lambda D}{d}, \\quad \\text{Constructive: } \\Delta x = m\\lambda, \\quad \\text{Destructive: } \\Delta x = (m + \\frac{1}{2})\\lambda',
    parameters: [
      { name: 'Wavelength (λ)', unit: 'nm', min: 400, max: 700, default: 550, step: 10 },
      { name: 'Slit Separation (d)', unit: 'mm', min: 0.1, max: 2.0, default: 0.5, step: 0.1 },
      { name: 'Screen Distance (D)', unit: 'm', min: 0.5, max: 3.0, default: 1.5, step: 0.1 }
    ],
    hotspots: [
      { id: 'double-slits', name: 'Coherent Double Slits (S1, S2)', description: 'Narrow apertures acting as secondary wave sources with constant phase difference delta phi.', x: 30, y: 50, importance: 'High' },
      { id: 'central-maxima', name: 'Central Bright Fringe (m=0)', description: 'Point of zero path difference (delta x = 0) where waves arrive in phase yielding maximum light intensity I_max = 4I_0.', x: 75, y: 50, importance: 'High' },
      { id: 'dark-fringe', name: 'First Dark Minima (m=1)', description: 'Point of half-wavelength path difference (lambda/2) causing complete destructive interference phase cancellation.', x: 75, y: 38, importance: 'High' }
    ]
  },
  {
    id: 'hybridization-orbitals',
    name: 'sp³ / sp² / sp Organic Orbital Hybridization',
    category: 'Chemistry',
    educationTypes: ['exam', 'college'],
    subjects: ['Chemistry', 'Organic Chemistry', 'Competitive Exams'],
    topic: 'Chemical Bonding & Molecular Geometry',
    description: 'Mixing of s and p atomic wavefunctions creating degenerate hybrid orbitals (Tetrahedral 109.5°, Trigonal 120°, Linear 180°).',
    hasExplodedView: true,
    hasXrayView: true,
    formula: '\\psi_{sp^3} = \\frac{1}{2}\\left(\\psi_s + \\psi_{px} + \\psi_{py} + \\psi_{pz}\\right), \\quad \\theta = 109.5^\\circ',
    parameters: [
      { name: 'Bond Angle (θ)', unit: 'deg', min: 90, max: 180, default: 109.5, step: 0.5 },
      { name: 's-Character', unit: '%', min: 25, max: 50, default: 25, step: 8.33 }
    ],
    hotspots: [
      { id: 'hybrid-lobes', name: 'Equivalent sp³ Hybrid Lobes', description: 'Four asymmetric degenerate electron probability lobes directed towards vertices of a regular tetrahedron.', x: 50, y: 50, importance: 'High' },
      { id: 'sigma-bond', name: 'Head-On Sigma (σ) Overlap', description: 'Strong axial end-to-end atomic orbital overlap yielding symmetric covalent single bond density.', x: 72, y: 40, importance: 'High' },
      { id: 'pi-bond', name: 'Sideways Pi (π) Overlap', description: 'Lateral parallel p-orbital overlap forming pi cloud density above and below inter-nuclear axis.', x: 50, y: 22, importance: 'Medium' }
    ]
  },

  // ==================== SKILLS & CAREER MODELS ====================
  {
    id: 'microservices-system-design',
    name: 'Microservices & Cloud API Gateway System Design',
    category: 'Software Engineering & Cloud Architecture',
    educationTypes: ['skills', 'college'],
    subjects: ['System Design', 'Software Engineering', 'Cloud & DevOps'],
    topic: 'Distributed Systems, Caching & Load Balancing',
    description: 'Resilient cloud architecture featuring NGINX Load Balancer, API Gateway Ingress, Redis In-Memory Cache, Microservices, and DB Read-Replicas.',
    hasExplodedView: true,
    hasXrayView: false,
    formula: 'QPS = \\frac{\\text{Total Requests}}{\\text{Latency (s)}}, \\quad \\text{Availability} = \\frac{\\text{MTBF}}{\\text{MTBF} + \\text{MTTR}} \\times 100\\%',
    parameters: [
      { name: 'Request Rate (QPS)', unit: 'req/s', min: 100, max: 10000, default: 2500, step: 500 },
      { name: 'Cache Hit Ratio', unit: '%', min: 50, max: 99, default: 92, step: 1 }
    ],
    hotspots: [
      { id: 'load-balancer', name: 'NGINX Ingress Load Balancer', description: 'Layer-7 reverse proxy distributing incoming HTTPS HTTP/2 requests using Round-Robin and Least-Connections algorithms.', x: 22, y: 50, importance: 'High' },
      { id: 'api-gateway', name: 'API Gateway Ingress Router', description: 'Single entry point performing JWT authentication, token-bucket rate limiting, TLS termination, and service discovery routing.', x: 44, y: 50, importance: 'High' },
      { id: 'redis-cache', name: 'Redis In-Memory Cache Cluster', description: 'Distributed RAM key-value cache layer serving hot queries with sub-2 millisecond latency to alleviate database pressure.', x: 68, y: 28, importance: 'High' },
      { id: 'microservice-auth', name: 'Auth & User Microservice', description: 'Stateless Node.js/Go container instance managing session validation and RBAC authorization.', x: 68, y: 72, importance: 'High' },
      { id: 'db-replicas', name: 'PostgreSQL Primary / Read-Replicas', description: 'Relational database cluster with async WAL replication for read scalability and fault-tolerant failover.', x: 88, y: 50, importance: 'High' }
    ]
  },
  {
    id: 'robotic-arm-kinematics',
    name: '6-DOF Industrial Robotic Arm Forward Kinematics',
    category: 'Robotics & Automation',
    educationTypes: ['skills', 'college'],
    subjects: ['Robotics', 'Automation Engineering', 'Computer Science'],
    topic: 'Kinematics, Servo Joints & DH Matrices',
    description: 'Multi-joint articulated robotic manipulator showing joint rotation angles (theta_1 to theta_6) and end-effector position transformation.',
    hasExplodedView: true,
    hasXrayView: true,
    formula: 'T_{0}^{6} = A_1(\\theta_1) \\cdot A_2(\\theta_2) \\cdot A_3(\\theta_3) \\cdot A_4(\\theta_4) \\cdot A_5(\\theta_5) \\cdot A_6(\\theta_6)',
    parameters: [
      { name: 'Joint Angle θ1', unit: 'deg', min: -180, max: 180, default: 45, step: 5 },
      { name: 'Joint Angle θ2', unit: 'deg', min: -90, max: 90, default: 30, step: 5 },
      { name: 'End Effector Speed', unit: 'm/s', min: 0.1, max: 2.0, default: 0.5, step: 0.1 }
    ],
    hotspots: [
      { id: 'base-servo', name: 'Base Rotation Joint (J1)', description: 'Heavy-duty harmonic drive servo motor providing 360-degree waist rotation in the XY plane.', x: 50, y: 82, importance: 'High' },
      { id: 'elbow-joint', name: 'Pitch Elbow Joint (J3)', description: 'Articulated joint determining vertical reach and payload leverage.', x: 42, y: 44, importance: 'High' },
      { id: 'end-effector', name: 'End Effector Tool / Gripper', description: 'Precision manipulator wrist executing pick-and-place, welding, or assembly commands in 3D cartesian coordinates (X, Y, Z).', x: 74, y: 25, importance: 'High' }
    ]
  }
];

export const getModelsByContext = (context = {}) => {
  const { educationType = 'school', subject = '' } = context;

  let filtered = XR_MODELS.filter(m => m.educationTypes.includes(educationType));
  if (filtered.length === 0) {
    filtered = XR_MODELS.filter(m => educationType === 'school' ? true : m.id !== 'human-heart');
  }

  // Explicitly ensure human-heart is ONLY shown for school students
  if (educationType !== 'school') {
    filtered = filtered.filter(m => m.id !== 'human-heart');
  }

  if (subject) {
    const matched = filtered.filter(m => m.subjects.some(s => s.toLowerCase().includes(subject.toLowerCase())));
    if (matched.length > 0) return matched;
  }

  return filtered;
};

export default {
  XR_MODELS,
  getModelsByContext
};
