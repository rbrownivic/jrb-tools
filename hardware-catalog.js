// Curated starter catalogue for static planning use.
// Validate final hardware selections against current HPE QuickSpecs before procurement.

const cpuProfiles = {
  intelDualSocketGen9: [
    { id: "2xe5-2620-v4", label: "2 x Intel Xeon E5-2620 v4", totalCores: 16 },
    { id: "2xe5-2640-v4", label: "2 x Intel Xeon E5-2640 v4", totalCores: 20 },
    { id: "2xe5-2660-v4", label: "2 x Intel Xeon E5-2660 v4", totalCores: 28 },
    { id: "2xe5-2697a-v4", label: "2 x Intel Xeon E5-2697A v4", totalCores: 32 },
    { id: "2xe5-2699-v4", label: "2 x Intel Xeon E5-2699 v4", totalCores: 44 },
  ],
  intelDualSocketGen10: [
    { id: "2xsilver-4114", label: "2 x Intel Xeon Silver 4114", totalCores: 20 },
    { id: "2xgold-5118", label: "2 x Intel Xeon Gold 5118", totalCores: 24 },
    { id: "2xgold-6130", label: "2 x Intel Xeon Gold 6130", totalCores: 32 },
    { id: "2xgold-6248", label: "2 x Intel Xeon Gold 6248", totalCores: 40 },
    { id: "2xplatinum-8280", label: "2 x Intel Xeon Platinum 8280", totalCores: 56 },
  ],
  intelDualSocketGen10Plus: [
    { id: "2xsilver-4314", label: "2 x Intel Xeon Silver 4314", totalCores: 32 },
    { id: "2xgold-5318y", label: "2 x Intel Xeon Gold 5318Y", totalCores: 48 },
    { id: "2xgold-6330", label: "2 x Intel Xeon Gold 6330", totalCores: 56 },
    { id: "2xgold-6348", label: "2 x Intel Xeon Gold 6348", totalCores: 56 },
    { id: "2xplatinum-8380", label: "2 x Intel Xeon Platinum 8380", totalCores: 80 },
  ],
  intelDualSocketGen11: [
    { id: "2xsilver-4410y", label: "2 x Intel Xeon Silver 4410Y", totalCores: 24 },
    { id: "2xgold-5418y", label: "2 x Intel Xeon Gold 5418Y", totalCores: 48 },
    { id: "2xgold-6430", label: "2 x Intel Xeon Gold 6430", totalCores: 64 },
    { id: "2xplatinum-8468", label: "2 x Intel Xeon Platinum 8468", totalCores: 96 },
    { id: "2xplatinum-8592-plus", label: "2 x Intel Xeon Platinum 8592+", totalCores: 128 },
  ],
  amdSingleSocketGen10: [
    { id: "1xepyc-7232p", label: "1 x AMD EPYC 7232P", totalCores: 8 },
    { id: "1xepyc-7302p", label: "1 x AMD EPYC 7302P", totalCores: 16 },
    { id: "1xepyc-7402p", label: "1 x AMD EPYC 7402P", totalCores: 24 },
    { id: "1xepyc-7502p", label: "1 x AMD EPYC 7502P", totalCores: 32 },
    { id: "1xepyc-7702p", label: "1 x AMD EPYC 7702P", totalCores: 64 },
  ],
  amdSingleSocketGen10Plus: [
    { id: "1xepyc-7313p", label: "1 x AMD EPYC 7313P", totalCores: 16 },
    { id: "1xepyc-7443p", label: "1 x AMD EPYC 7443P", totalCores: 24 },
    { id: "1xepyc-7543p", label: "1 x AMD EPYC 7543P", totalCores: 32 },
    { id: "1xepyc-7643p", label: "1 x AMD EPYC 7643P", totalCores: 48 },
    { id: "1xepyc-7713p", label: "1 x AMD EPYC 7713P", totalCores: 64 },
  ],
  amdSingleSocketGen11: [
    { id: "1xepyc-9124", label: "1 x AMD EPYC 9124", totalCores: 16 },
    { id: "1xepyc-9254", label: "1 x AMD EPYC 9254", totalCores: 24 },
    { id: "1xepyc-9354", label: "1 x AMD EPYC 9354", totalCores: 32 },
    { id: "1xepyc-9554", label: "1 x AMD EPYC 9554", totalCores: 64 },
    { id: "1xepyc-9845", label: "1 x AMD EPYC 9845", totalCores: 160 },
  ],
  amdDualSocketGen10: [
    { id: "2xepyc-7282", label: "2 x AMD EPYC 7282", totalCores: 32 },
    { id: "2xepyc-7352", label: "2 x AMD EPYC 7352", totalCores: 48 },
    { id: "2xepyc-7452", label: "2 x AMD EPYC 7452", totalCores: 64 },
    { id: "2xepyc-7702", label: "2 x AMD EPYC 7702", totalCores: 128 },
  ],
  amdDualSocketGen10Plus: [
    { id: "2xepyc-7313", label: "2 x AMD EPYC 7313", totalCores: 32 },
    { id: "2xepyc-7443", label: "2 x AMD EPYC 7443", totalCores: 48 },
    { id: "2xepyc-7543", label: "2 x AMD EPYC 7543", totalCores: 64 },
    { id: "2xepyc-7713", label: "2 x AMD EPYC 7713", totalCores: 128 },
  ],
  amdDualSocketGen11: [
    { id: "2xepyc-9124", label: "2 x AMD EPYC 9124", totalCores: 32 },
    { id: "2xepyc-9354", label: "2 x AMD EPYC 9354", totalCores: 64 },
    { id: "2xepyc-9554", label: "2 x AMD EPYC 9554", totalCores: 128 },
    { id: "2xepyc-9754", label: "2 x AMD EPYC 9754", totalCores: 256 },
  ],
  intelQuadSocketDl580Gen9: [
    { id: "4xe7-4809-v4", label: "4 x Intel Xeon E7-4809 v4", totalCores: 32 },
    { id: "4xe7-4830-v4", label: "4 x Intel Xeon E7-4830 v4", totalCores: 56 },
    { id: "4xe7-8870-v4", label: "4 x Intel Xeon E7-8870 v4", totalCores: 80 },
    { id: "4xe7-8890-v4", label: "4 x Intel Xeon E7-8890 v4", totalCores: 96 },
  ],
  intelQuadSocketGen10: [
    { id: "4xgold-5120", label: "4 x Intel Xeon Gold 5120", totalCores: 56 },
    { id: "4xgold-6130", label: "4 x Intel Xeon Gold 6130", totalCores: 64 },
    { id: "4xgold-6254", label: "4 x Intel Xeon Gold 6254", totalCores: 72 },
    { id: "4xplatinum-8280", label: "4 x Intel Xeon Platinum 8280", totalCores: 112 },
  ],
  intelQuadSocketGen11: [
    { id: "4xgold-5418y", label: "4 x Intel Xeon Gold 5418Y", totalCores: 96 },
    { id: "4xgold-6430", label: "4 x Intel Xeon Gold 6430", totalCores: 128 },
    { id: "4xplatinum-8460h", label: "4 x Intel Xeon Platinum 8460H", totalCores: 160 },
    { id: "4xplatinum-8490h", label: "4 x Intel Xeon Platinum 8490H", totalCores: 240 },
  ],
  microServerGen10Plus: [
    { id: "1xpentium-g5420", label: "1 x Intel Pentium Gold G5420", totalCores: 2 },
    { id: "1xxeon-e2224", label: "1 x Intel Xeon E-2224", totalCores: 4 },
    { id: "1xxeon-e2236", label: "1 x Intel Xeon E-2236", totalCores: 6 },
  ],
  microServerGen11: [
    { id: "1xpentium-g7400", label: "1 x Intel Pentium Gold G7400", totalCores: 2 },
    { id: "1xxeon-e2414", label: "1 x Intel Xeon E-2414", totalCores: 4 },
    { id: "1xxeon-e2436", label: "1 x Intel Xeon E-2436", totalCores: 6 },
    { id: "1xxeon-6354p", label: "1 x Intel Xeon 6354P", totalCores: 8 },
  ],
};

const generationProfiles = {
  intelDualSocketGen9: {
    sockets: 2,
    totalDimmSlots: 24,
    maxMemoryGB: 3072,
    dimmSizesGB: [16, 32, 64, 128],
    memoryPopulationCounts: [2, 4, 8, 12, 16, 24],
    cpuOptions: cpuProfiles.intelDualSocketGen9,
  },
  intelDualSocketGen10: {
    sockets: 2,
    totalDimmSlots: 24,
    maxMemoryGB: 3072,
    dimmSizesGB: [16, 32, 64, 128],
    memoryPopulationCounts: [2, 4, 8, 12, 16, 24],
    cpuOptions: cpuProfiles.intelDualSocketGen10,
  },
  intelDualSocketGen10Plus: {
    sockets: 2,
    totalDimmSlots: 32,
    maxMemoryGB: 8192,
    dimmSizesGB: [16, 32, 64, 128, 256],
    memoryPopulationCounts: [2, 4, 8, 12, 16, 24, 32],
    cpuOptions: cpuProfiles.intelDualSocketGen10Plus,
  },
  intelDualSocketGen11: {
    sockets: 2,
    totalDimmSlots: 32,
    maxMemoryGB: 8192,
    dimmSizesGB: [16, 32, 64, 128, 256],
    memoryPopulationCounts: [2, 4, 8, 12, 16, 24, 32],
    cpuOptions: cpuProfiles.intelDualSocketGen11,
  },
  amdSingleSocketGen10: {
    sockets: 1,
    totalDimmSlots: 16,
    maxMemoryGB: 2048,
    dimmSizesGB: [16, 32, 64, 128],
    memoryPopulationCounts: [1, 2, 4, 6, 8, 12, 16],
    cpuOptions: cpuProfiles.amdSingleSocketGen10,
  },
  amdSingleSocketGen10Plus: {
    sockets: 1,
    totalDimmSlots: 16,
    maxMemoryGB: 4096,
    dimmSizesGB: [16, 32, 64, 128, 256],
    memoryPopulationCounts: [1, 2, 4, 6, 8, 12, 16],
    cpuOptions: cpuProfiles.amdSingleSocketGen10Plus,
  },
  amdSingleSocketGen11: {
    sockets: 1,
    totalDimmSlots: 12,
    maxMemoryGB: 3072,
    dimmSizesGB: [16, 32, 64, 128, 256],
    memoryPopulationCounts: [1, 2, 4, 6, 8, 10, 12],
    cpuOptions: cpuProfiles.amdSingleSocketGen11,
  },
  amdDualSocketGen10: {
    sockets: 2,
    totalDimmSlots: 32,
    maxMemoryGB: 4096,
    dimmSizesGB: [16, 32, 64, 128],
    memoryPopulationCounts: [2, 4, 8, 12, 16, 24, 32],
    cpuOptions: cpuProfiles.amdDualSocketGen10,
  },
  amdDualSocketGen10Plus: {
    sockets: 2,
    totalDimmSlots: 32,
    maxMemoryGB: 8192,
    dimmSizesGB: [16, 32, 64, 128, 256],
    memoryPopulationCounts: [2, 4, 8, 12, 16, 24, 32],
    cpuOptions: cpuProfiles.amdDualSocketGen10Plus,
  },
  amdDualSocketGen11: {
    sockets: 2,
    totalDimmSlots: 24,
    maxMemoryGB: 6144,
    dimmSizesGB: [16, 32, 64, 128, 256],
    memoryPopulationCounts: [2, 4, 8, 12, 16, 24],
    cpuOptions: cpuProfiles.amdDualSocketGen11,
  },
  intelQuadSocketDl560Gen9: {
    sockets: 4,
    totalDimmSlots: 48,
    maxMemoryGB: 6144,
    dimmSizesGB: [16, 32, 64, 128],
    memoryPopulationCounts: [4, 8, 16, 24, 32, 48],
    cpuOptions: cpuProfiles.intelDualSocketGen9.map((cpu) => ({
      id: `quad-${cpu.id}`,
      label: cpu.label.replace("2 x", "4 x"),
      totalCores: cpu.totalCores * 2,
    })),
  },
  intelQuadSocketDl580Gen9: {
    sockets: 4,
    totalDimmSlots: 96,
    maxMemoryGB: 12288,
    dimmSizesGB: [16, 32, 64, 128],
    memoryPopulationCounts: [4, 8, 16, 24, 32, 48, 64, 96],
    cpuOptions: cpuProfiles.intelQuadSocketDl580Gen9,
  },
  intelQuadSocketGen10: {
    sockets: 4,
    totalDimmSlots: 48,
    maxMemoryGB: 6144,
    dimmSizesGB: [16, 32, 64, 128],
    memoryPopulationCounts: [4, 8, 16, 24, 32, 48],
    cpuOptions: cpuProfiles.intelQuadSocketGen10,
  },
  intelQuadSocketGen11: {
    sockets: 4,
    totalDimmSlots: 64,
    maxMemoryGB: 16384,
    dimmSizesGB: [16, 32, 64, 128, 256],
    memoryPopulationCounts: [4, 8, 16, 24, 32, 48, 64],
    cpuOptions: cpuProfiles.intelQuadSocketGen11,
  },
  microServerGen10Plus: {
    sockets: 1,
    totalDimmSlots: 2,
    maxMemoryGB: 32,
    dimmSizesGB: [8, 16],
    memoryPopulationCounts: [1, 2],
    cpuOptions: cpuProfiles.microServerGen10Plus,
  },
  microServerGen11: {
    sockets: 1,
    totalDimmSlots: 4,
    maxMemoryGB: 128,
    dimmSizesGB: [16, 32],
    memoryPopulationCounts: [1, 2, 4],
    cpuOptions: cpuProfiles.microServerGen11,
  },
};

function createGeneration(id, name, profileKey, note) {
  return {
    id,
    name,
    note,
    ...generationProfiles[profileKey],
  };
}

const hardwareCatalog = [
  {
    id: "dl360",
    name: "HPE ProLiant DL360",
    formFactor: "1U rack",
    generations: [
      createGeneration("gen9", "Gen9", "intelDualSocketGen9", "Two-socket Intel rack node."),
      createGeneration("gen10", "Gen10", "intelDualSocketGen10", "First and second generation Intel Xeon Scalable era."),
      createGeneration("gen10plus", "Gen10 Plus", "intelDualSocketGen10Plus", "Third generation Intel Xeon Scalable era."),
      createGeneration("gen11", "Gen11", "intelDualSocketGen11", "Fourth and fifth generation Intel Xeon Scalable era."),
    ],
  },
  {
    id: "dl380",
    name: "HPE ProLiant DL380",
    formFactor: "2U rack",
    generations: [
      createGeneration("gen9", "Gen9", "intelDualSocketGen9", "Two-socket Intel rack node."),
      createGeneration("gen10", "Gen10", "intelDualSocketGen10", "First and second generation Intel Xeon Scalable era."),
      createGeneration("gen10plus", "Gen10 Plus", "intelDualSocketGen10Plus", "Third generation Intel Xeon Scalable era."),
      createGeneration("gen11", "Gen11", "intelDualSocketGen11", "Fourth and fifth generation Intel Xeon Scalable era."),
    ],
  },
  {
    id: "dl325",
    name: "HPE ProLiant DL325",
    formFactor: "1U rack",
    generations: [
      createGeneration("gen10", "Gen10", "amdSingleSocketGen10", "Single-socket AMD EPYC platform."),
      createGeneration("gen10plus", "Gen10 Plus", "amdSingleSocketGen10Plus", "Single-socket AMD EPYC 7003 capable platform."),
      createGeneration("gen11", "Gen11", "amdSingleSocketGen11", "Single-socket AMD EPYC 9004 and 9005 platform."),
    ],
  },
  {
    id: "dl385",
    name: "HPE ProLiant DL385",
    formFactor: "2U rack",
    generations: [
      createGeneration("gen10", "Gen10", "amdDualSocketGen10", "Dual-socket AMD EPYC platform."),
      createGeneration("gen10plus", "Gen10 Plus", "amdDualSocketGen10Plus", "Dual-socket AMD EPYC 7003 capable platform."),
      createGeneration("gen11", "Gen11", "amdDualSocketGen11", "Dual-socket AMD EPYC 9004 and 9005 platform."),
    ],
  },
  {
    id: "synergy",
    name: "HPE Synergy",
    formFactor: "Compute module",
    generations: [
      createGeneration("gen10", "480 Gen10", "intelDualSocketGen10", "Half-height compute module."),
      createGeneration("gen10plus", "480 Gen10 Plus", "intelDualSocketGen10Plus", "Half-height compute module with third generation Xeon support."),
      createGeneration("gen11", "480 Gen11", "intelDualSocketGen11", "Half-height compute module with fourth and fifth generation Xeon support."),
    ],
  },
  {
    id: "dl560",
    name: "HPE ProLiant DL560",
    formFactor: "2U rack",
    generations: [
      createGeneration("gen9", "Gen9", "intelQuadSocketDl560Gen9", "Four-socket Intel platform."),
      createGeneration("gen10", "Gen10", "intelQuadSocketGen10", "Four-socket Intel Xeon Scalable platform."),
      createGeneration("gen11", "Gen11", "intelQuadSocketGen11", "Four-socket Intel Xeon Scalable platform with DDR5."),
    ],
  },
  {
    id: "dl580",
    name: "HPE ProLiant DL580",
    formFactor: "4U rack",
    generations: [
      createGeneration("gen9", "Gen9", "intelQuadSocketDl580Gen9", "Four-socket high-memory platform."),
      createGeneration("gen10", "Gen10", "intelQuadSocketGen10", "Four-socket Intel Xeon Scalable platform."),
    ],
  },
  {
    id: "microserver",
    name: "HPE ProLiant MicroServer",
    formFactor: "Tower",
    generations: [
      createGeneration("gen10plus", "Gen10 Plus", "microServerGen10Plus", "Compact branch and edge form factor."),
      createGeneration("gen11", "Gen11", "microServerGen11", "Compact tower form factor with expanded memory ceiling."),
    ],
  },
];

window.hardwareCatalog = hardwareCatalog;
