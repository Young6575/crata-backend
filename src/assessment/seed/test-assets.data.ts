// 1. 검사지 (Test) 마스터 데이터
export const TEST_MASTER_DATA = [
    { id: 'BEHAVIOR', slug: 'behavior-type', name: '행동방식유형검사', description: '개인의 행동 성향 분석' },
    { id: 'EMOTION', slug: 'emotion-attitude', name: '정서-태도검사', description: '색채 기반 심리 진단 검사' },
];

// 2. 보기 세트 (OptionSet) 마스터 데이터
export const OPTION_SET_MASTER_DATA = [
    { id: 'LIKERT_5', name: '5점 척도', description: '매우 그렇다 ~ 매우 아니다 (5점)' },
    { id: 'LIKERT_4', name: '4점 척도', description: '매우 그렇다 ~ 아니다 (4점)' },
    { id: 'YES_NO', name: '예/아니오 척도', description: '단순 긍정/부정 판단' },
];