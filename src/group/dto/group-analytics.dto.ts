// 그룹 분석 응답 DTO
export interface GroupAnalyticsDto {
  groupId: number;
  groupName: string;
  totalMembers: number;
  completedCount: number;
  completionRate: number;

  // ========== 생일 기반 분석 (만세력) ==========
  birthdayBased: {
    // 개인행동방식
    motivationLocation: TypeDistribution; // 동기위치 (내적자극형/외적자극형)
    motivationOrientation: {              // 동기욕구유형
      growth: TypeCount;
      divergence: TypeCount;
      balance: TypeCount;
      harvest: TypeCount;
      accumulation: TypeCount;
    };
    // 조직구조방식
    orgStructure: TypeDistribution;
    // 집단행동
    selfDetermination: TypeDistribution;  // 자기의사결정방식
    selfImprovement: TypeDistribution;    // 자기향상 행동방식
    // 업무방식
    workStyle: {
      purposeAchievement: TypeDistribution;
      infoProcessing: TypeDistribution;
      abilityExpression: TypeDistribution;
      goalExecution: TypeDistribution;
    };
  };

  // ========== 설문 기반 분석 ==========
  surveyBased: {
    // 집단행동 분석
    groupBehavior: {
      selfDetermination: TypeDistribution;
      selfImprovement: TypeDistribution;
    };
    // 업무방식 분석
    workStyle: {
      purposeAchievement: TypeDistribution;
      infoProcessing: TypeDistribution;
      abilityExpression: TypeDistribution;
      goalExecution: TypeDistribution;
    };
    // 잠재역량 분석
    potentialScores: {
      [key: string]: { average: number; distribution: number[] };
    };
  };

  // 전체 평균 및 편차
  overallStats: {
    averageScore: number;
    standardDeviation: number;
  };
}

export interface TypeCount {
  count: number;
  percentage: number;
}

export interface TypeDistribution {
  [key: string]: TypeCount;
}
