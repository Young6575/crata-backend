export const CATEGORIES_DATA = [
  // ----------------------------------------------------
  // Level 1: Root (2. 행동방식유형검사)
  // ----------------------------------------------------
  { id: 'CAT_ROOT', parentId: null, name: '행동방식유형검사', code: 'BEHAVIOR_ROOT' },

  // ----------------------------------------------------
  // Level 2: 최상위 구분 (개인, 집단, 조직 행동)
  // ----------------------------------------------------
  { id: 'CAT_PERSONAL', parentId: 'CAT_ROOT', name: '개인행동방식', code: 'PERSONAL_BEHAVIOR' },
  { id: 'CAT_GROUP_BEHAVIOR', parentId: 'CAT_ROOT', name: '집단행동', code: 'GROUP_BEHAVIOR' },
  { id: 'CAT_ORGANIZATION', parentId: 'CAT_ROOT', name: '조직행동', code: 'ORGANIZATION_BEHAVIOR' },

  // ----------------------------------------------------
  // Level 3: 개인행동방식 하위
  // ----------------------------------------------------
  { id: 'CAT_MOTIV_LOC', parentId: 'CAT_PERSONAL', name: '행동의 동기위치', code: 'MOTIV_POS' },
  { id: 'CAT_MOTIV_ORIENT', parentId: 'CAT_PERSONAL', name: '행동의 동기욕구유형', code: 'MOTIV_ORIENT' },

  // ----------------------------------------------------
  // Level 4: 동기위치 하위 (내적/외적)
  // ----------------------------------------------------
  { id: 'CAT_INTERNAL STIMULATION', parentId: 'CAT_MOTIV_LOC', name: '내적자극형', code: 'Internal stimulation' },
  { id: 'CAT_EXTERNAL STIMULATION', parentId: 'CAT_MOTIV_LOC', name: '외적자극형', code: 'External stimulation' },

  // ----------------------------------------------------
  // Level 4: 동기부여성향 하위 (성장, 발산, 균형, 수확, 축적)
  // ----------------------------------------------------
  { id: 'CAT_GROWTH', parentId: 'CAT_MOTIV_ORIENT', name: '성장형', code: 'Growth Type'},
  { id: 'CAT_DIVERGENCE', parentId: 'CAT_MOTIV_ORIENT', name: '발산형', code: 'Divergent Type'},
  { id: 'CAT_BALANCE', parentId: 'CAT_MOTIV_ORIENT', name: '균형형', code: 'Balance Type'},
  { id: 'CAT_HARVEST', parentId: 'CAT_MOTIV_ORIENT', name: '수확형', code: 'Harvest Type'},
  { id: 'CAT_ACCUMULATION', parentId: 'CAT_MOTIV_ORIENT', name: '축적형', code: 'Accumulation Type'},

  // ----------------------------------------------------
  // Level 3: 집단행동 하위
  // ----------------------------------------------------
  { id: 'CAT_SELF_DETERMINATION', parentId: 'CAT_GROUP_BEHAVIOR', name: '자기의사결정방식', code: 'Self_Determination Approch'},
  { id: 'CAT_SELF_IMPROVEMENT', parentId: 'CAT_GROUP_BEHAVIOR', name: '자가향상 행동방식', code: 'Self_Improvement behavioral pattern'},

  // ----------------------------------------------------
  // Level 4: 자기의사결정방식 하위
  // ----------------------------------------------------
  { id: 'CAT_STAND_ALONE', parentId: 'CAT_SELF_DETERMINATION', name: '혼자형', code: 'Stand-alone Type' },
  { id: 'CAT_GROUP', parentId: 'CAT_SELF_DETERMINATION', name: '그룹형', code: 'Group Type' },

  // ----------------------------------------------------
  // Level 4: 자가향상방식 하위
  // ----------------------------------------------------
  { id: 'CAT_RIVAL', parentId: 'CAT_SELF_IMPROVEMENT', name: '경쟁형', code: 'Rival Type' },
  { id: 'CAT_COMPARATIVE', parentId: 'CAT_SELF_IMPROVEMENT', name: '비교형', code: 'Comparative Type' },
  { id: 'CAT_SELF_IMPROVEMENT_POTENTIAL', parentId: 'CAT_SELF_IMPROVEMENT', name: '잠재역량', code: 'SELF_IMPROVEMENT_POTENTIAL' },

  // ----------------------------------------------------
  // Level 3: 조직행동 하위
  // ----------------------------------------------------
  { id: 'CAT_ORG_STRUCTURE', parentId: 'CAT_ORGANIZATION', name: '조직구조방식', code: 'ORG_STRUCTURE' },
  { id: 'CAT_WORK_STYLE', parentId: 'CAT_ORGANIZATION', name: '업무방식', code: 'WORK_STYLE' },

  // ----------------------------------------------------
  // Level 4: 조직구조방식 하위
  // ----------------------------------------------------
  { id: 'CAT_SELF_GROWTH', parentId: 'CAT_ORG_STRUCTURE', name: '개인성장형', code: 'Self-growth Type'},
  { id: 'CAT_GROUP_GROWTH', parentId: 'CAT_ORG_STRUCTURE', name: '조직성장형', code: 'Group-growth Type'},

  // ----------------------------------------------------
  // Level 4: 업무방식 하위 (4가지 방식)
  // ----------------------------------------------------
  { id: 'CAT_PURPOSE_ACHIEVEMENT', parentId: 'CAT_WORK_STYLE', name: '목적성취방식', code: 'PURPOSE_ACHIEVEMENT' },
  { id: 'CAT_INFO_PROCESSING', parentId: 'CAT_WORK_STYLE', name: '정보처리방식', code: 'INFO_PROCESSING' },
  { id: 'CAT_ABILITY_EXPRESSION', parentId: 'CAT_WORK_STYLE', name: '능력표현방식', code: 'ABILITY_EXPRESSION' },
  { id: 'CAT_GOAL_EXECUTION', parentId: 'CAT_WORK_STYLE', name: '목표실행방식', code: 'GOAL_EXECUTION' },

  // ----------------------------------------------------
  // Level 5: 업무방식 상세 하위 (과제형, 관계형 등)
  // ----------------------------------------------------
  { id: 'CAT_TASK', parentId: 'CAT_PURPOSE_ACHIEVEMENT', name: '과제형', code: 'Task Type' },
  { id: 'CAT_RELATIONAL', parentId: 'CAT_PURPOSE_ACHIEVEMENT', name: '관계형', code: 'Relational Type' },
  { id: 'CAT_PURPOSE_ACHIEVEMENT_POTENTIAL', parentId: 'CAT_PURPOSE_ACHIEVEMENT', name: '잠재역량', code: 'PURPOSE_ACHIEVEMENT_POTENTIAL'},
  
  { id: 'CAT_INTUITIVE', parentId: 'CAT_INFO_PROCESSING', name: '직관형', code: 'Intuitive Type' },
  { id: 'CAT_EXPERIENTIAL', parentId: 'CAT_INFO_PROCESSING', name: '경험형', code: 'Experiential Type' },
  { id: 'CAT_INFO_PROCESSING_POTENTIAL', parentId: 'CAT_INFO_PROCESSING', name: '잠재역량', code: 'INFO_PROCESSING_POTENTIAL' },

  { id: 'CAT_DESIGN', parentId: 'CAT_ABILITY_EXPRESSION', name: '설계형', code: 'Design Type' },
  { id: 'CAT_TECHNICAL', parentId: 'CAT_ABILITY_EXPRESSION', name: '기술형', code: 'Technical Type' },
  { id: 'CAT_ABILITY_EXPRESSION_POTENTIAL', parentId: 'CAT_ABILITY_EXPRESSION', name: '잠재역량', code: 'ABILITY_EXPRESSION_POTENTIAL' },

  { id: 'CAT_TACTICAL', parentId: 'CAT_GOAL_EXECUTION', name: '전술형', code: 'Tactical Type'},
  { id: 'CAT_STRATEGIC', parentId: 'CAT_GOAL_EXECUTION', name: '전략형', code: 'Strategic Type'},
  { id: 'CAT_GOAL_EXECUTION_POTENTIAL', parentId: 'CAT_GOAL_EXECUTION', name: '잠재역량', code: 'GOAL_EXECUTION_POTENTIAL' },

  // ============================================================
  // 크라타 색채심리 카테고리
  // ============================================================
  
  // Level 1: 색채심리 Root
  { id: 'CAT_COLOR_ROOT', parentId: null, name: '크라타 색채심리', code: 'COLOR_ROOT' },

  // Level 2: 색채 그룹
  { id: 'CAT_COLOR_GROUP', parentId: 'CAT_COLOR_ROOT', name: '색채 유형', code: 'COLOR_GROUP' },

  // Level 3: 개별 색상 (16가지)
  { id: 'CAT_COLOR_RED', parentId: 'CAT_COLOR_GROUP', name: '레드', code: 'RED' },
  { id: 'CAT_COLOR_ORANGE', parentId: 'CAT_COLOR_GROUP', name: '오렌지', code: 'ORANGE' },
  { id: 'CAT_COLOR_ROSE_PINK', parentId: 'CAT_COLOR_GROUP', name: '로즈핑크', code: 'ROSE_PINK' },
  { id: 'CAT_COLOR_PINK', parentId: 'CAT_COLOR_GROUP', name: '핑크', code: 'PINK' },
  { id: 'CAT_COLOR_YELLOW', parentId: 'CAT_COLOR_GROUP', name: '옐로우', code: 'YELLOW' },
  { id: 'CAT_COLOR_GOLD', parentId: 'CAT_COLOR_GROUP', name: '골드', code: 'GOLD' },
  { id: 'CAT_COLOR_LEMON', parentId: 'CAT_COLOR_GROUP', name: '레몬', code: 'LEMON' },
  { id: 'CAT_COLOR_GREEN', parentId: 'CAT_COLOR_GROUP', name: '그린', code: 'GREEN' },
  { id: 'CAT_COLOR_BLUE', parentId: 'CAT_COLOR_GROUP', name: '블루', code: 'BLUE' },
  { id: 'CAT_COLOR_TURQUOISE', parentId: 'CAT_COLOR_GROUP', name: '터콰이즈', code: 'TURQUOISE' },
  { id: 'CAT_COLOR_PALE_BLUE', parentId: 'CAT_COLOR_GROUP', name: '페일블루', code: 'PALE_BLUE' },
  { id: 'CAT_COLOR_INDIGO', parentId: 'CAT_COLOR_GROUP', name: '인디고', code: 'INDIGO' },
  { id: 'CAT_COLOR_VIOLET', parentId: 'CAT_COLOR_GROUP', name: '바이올렛', code: 'VIOLET' },
  { id: 'CAT_COLOR_PURPLE', parentId: 'CAT_COLOR_GROUP', name: '퍼플', code: 'PURPLE' },
  { id: 'CAT_COLOR_MAGENTA', parentId: 'CAT_COLOR_GROUP', name: '마젠타', code: 'MAGENTA' },
  { id: 'CAT_COLOR_LILAC', parentId: 'CAT_COLOR_GROUP', name: '라일락', code: 'LILAC' },
];