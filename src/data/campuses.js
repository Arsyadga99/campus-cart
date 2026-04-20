export const CAMPUSES = [
  {
    id: 'hcmut-main',
    name: 'HCMUT Main Campus',
    district: 'District 10',
    launchPhase: 'Phase 1',
    studentPopulation: 22000,
  },
  {
    id: 'hcmut-dormitory',
    name: 'HCMUT Dormitory Zone',
    district: 'Thu Duc City',
    launchPhase: 'Phase 2',
    studentPopulation: 8000,
  },
  {
    id: 'ussh-linh-trung',
    name: 'USSH Linh Trung',
    district: 'Thu Duc City',
    launchPhase: 'Phase 2',
    studentPopulation: 12000,
  },
  {
    id: 'uit-linh-trung',
    name: 'UIT Linh Trung',
    district: 'Thu Duc City',
    launchPhase: 'Phase 2',
    studentPopulation: 10000,
  },
  {
    id: 'hcmus-nguyen-van-cu',
    name: 'HCMUS Nguyen Van Cu',
    district: 'District 5',
    launchPhase: 'Phase 3',
    studentPopulation: 18000,
  },
  {
    id: 'ueh-nguyen-trai',
    name: 'UEH Nguyen Trai',
    district: 'District 3',
    launchPhase: 'Phase 3',
    studentPopulation: 14000,
  },
  {
    id: 'ftu2-binh-thanh',
    name: 'FTU2 Binh Thanh',
    district: 'Binh Thanh',
    launchPhase: 'Phase 3',
    studentPopulation: 9000,
  },
  {
    id: 'huflit-phu-nhuan',
    name: 'HUFLIT Phu Nhuan',
    district: 'Phu Nhuan',
    launchPhase: 'Phase 4',
    studentPopulation: 11000,
  },
  {
    id: 'hutech-binh-thanh',
    name: 'HUTECH Binh Thanh',
    district: 'Binh Thanh',
    launchPhase: 'Phase 4',
    studentPopulation: 26000,
  },
  {
    id: 'ton-duc-thang-d7',
    name: 'TDTU District 7',
    district: 'District 7',
    launchPhase: 'Phase 4',
    studentPopulation: 24000,
  },
];

export const CAMPUS_BY_ID = Object.fromEntries(
  CAMPUSES.map((campus) => [campus.id, campus])
);
