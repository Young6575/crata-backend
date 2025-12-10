import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './group.entity';
import { TestResult } from '../result/test-result.entity';
import { GroupAnalyticsDto, TypeCount, TypeDistribution } from './dto/group-analytics.dto';

// 설문 카테고리 ID → 유형 매핑
const SURVEY_CATEGORY_MAP: Record<string, { group: string; type: string }> = {
  'CAT_STAND_ALONE': { group: 'selfDetermination', type: 'standAlone' },
  'CAT_GROUP': { group: 'selfDetermination', type: 'group' },
  'CAT_RIVAL': { group: 'selfImprovement', type: 'rival' },
  'CAT_COMPARATIVE': { group: 'selfImprovement', type: 'comparative' },
  'CAT_TASK': { group: 'purposeAchievement', type: 'task' },
  'CAT_RELATIONAL': { group: 'purposeAchievement', type: 'relational' },
  'CAT_INTUITIVE': { group: 'infoProcessing', type: 'intuitive' },
  'CAT_EXPERIENTIAL': { group: 'infoProcessing', type: 'experiential' },
  'CAT_DESIGN': { group: 'abilityExpression', type: 'design' },
  'CAT_TECHNICAL': { group: 'abilityExpression', type: 'technical' },
  'CAT_TACTICAL': { group: 'goalExecution', type: 'tactical' },
  'CAT_STRATEGIC': { group: 'goalExecution', type: 'strategic' },
};

@Injectable()
export class GroupAnalyticsService {
  constructor(
    @InjectRepository(Group) private groupRepo: Repository<Group>,
    @InjectRepository(TestResult) private resultRepo: Repository<TestResult>,
  ) {}

  async getGroupAnalytics(groupId: number): Promise<GroupAnalyticsDto> {
    const group = await this.groupRepo.findOne({
      where: { groupId },
      relations: ['tickets'],
    });

    if (!group) {
      throw new HttpException('그룹을 찾을 수 없습니다', HttpStatus.NOT_FOUND);
    }

    const results = await this.resultRepo
      .createQueryBuilder('result')
      .leftJoinAndSelect('result.ticket', 'ticket')
      .where('ticket.group_id = :groupId', { groupId })
      .getMany();

    const totalMembers = group.tickets?.length || 0;
    const completedCount = results.length;

    if (completedCount === 0) {
      return this.getEmptyAnalytics(group, totalMembers);
    }

    return this.calculateAnalytics(group, results, totalMembers, completedCount);
  }

  private calculateAnalytics(
    group: Group,
    results: TestResult[],
    totalMembers: number,
    completedCount: number,
  ): GroupAnalyticsDto {
    // ========== 생일 기반 카운터 ==========
    const bdCounters = {
      motivationLocation: { internal: 0, external: 0 },
      motivationOrientation: { growth: 0, divergence: 0, balance: 0, harvest: 0, accumulation: 0 },
      orgStructure: { selfGrowth: 0, groupGrowth: 0 },
      selfDetermination: { standAlone: 0, group: 0 },
      selfImprovement: { rival: 0, comparative: 0 },
      workStyle: {
        purposeAchievement: { task: 0, relational: 0 },
        infoProcessing: { intuitive: 0, experiential: 0 },
        abilityExpression: { design: 0, technical: 0 },
        goalExecution: { tactical: 0, strategic: 0 },
      },
    };

    // ========== 설문 기반 카운터 ==========
    const surveyCounters: Record<string, number> = {};
    const potentialScores: Record<string, number[]> = {};
    const allScores: number[] = [];

    for (const result of results) {
      // 1. 생일 기반 분석
      const manse = result.resultSnapshot?.manse;
      if (manse) {
        // 동기위치
        if (manse.motivationLocation === 'internal') bdCounters.motivationLocation.internal++;
        else if (manse.motivationLocation === 'external') bdCounters.motivationLocation.external++;

        // 동기욕구유형
        const orient = manse.motivationOrientation;
        if (orient && bdCounters.motivationOrientation[orient] !== undefined) {
          bdCounters.motivationOrientation[orient]++;
        }

        // 조직구조방식
        if (manse.orgStructure === 'selfGrowth') bdCounters.orgStructure.selfGrowth++;
        else if (manse.orgStructure === 'groupGrowth') bdCounters.orgStructure.groupGrowth++;
        else if (manse.orgStructure === 'both') {
          bdCounters.orgStructure.selfGrowth++;
          bdCounters.orgStructure.groupGrowth++;
        }

        // 자기의사결정방식
        if (manse.selfDetermination === 'standAlone') bdCounters.selfDetermination.standAlone++;
        else if (manse.selfDetermination === 'group') bdCounters.selfDetermination.group++;
        else if (manse.selfDetermination === 'both') {
          bdCounters.selfDetermination.standAlone++;
          bdCounters.selfDetermination.group++;
        }

        // 자기향상 행동방식
        if (manse.selfImprovement === 'rival') bdCounters.selfImprovement.rival++;
        else if (manse.selfImprovement === 'comparative') bdCounters.selfImprovement.comparative++;
        else if (manse.selfImprovement === 'both') {
          bdCounters.selfImprovement.rival++;
          bdCounters.selfImprovement.comparative++;
        }

        // 업무방식
        const ws = manse.workStyle;
        if (ws) {
          ws.purposeAchievement?.forEach((t: string) => {
            if (t === 'task') bdCounters.workStyle.purposeAchievement.task++;
            if (t === 'relational') bdCounters.workStyle.purposeAchievement.relational++;
          });
          ws.infoProcessing?.forEach((t: string) => {
            if (t === 'intuitive') bdCounters.workStyle.infoProcessing.intuitive++;
            if (t === 'experiential') bdCounters.workStyle.infoProcessing.experiential++;
          });
          ws.abilityExpression?.forEach((t: string) => {
            if (t === 'design') bdCounters.workStyle.abilityExpression.design++;
            if (t === 'technical') bdCounters.workStyle.abilityExpression.technical++;
          });
          ws.goalExecution?.forEach((t: string) => {
            if (t === 'tactical') bdCounters.workStyle.goalExecution.tactical++;
            if (t === 'strategic') bdCounters.workStyle.goalExecution.strategic++;
          });
        }
      }

      // 2. 설문 기반 분석
      const answers = result.answers || [];
      const groupScores: Record<string, Record<string, number>> = {};

      for (const answer of answers) {
        const categoryId = answer.categoryId || '';
        const score = answer.score ?? 0;
        
        const mapping = SURVEY_CATEGORY_MAP[categoryId];
        if (mapping) {
          if (!groupScores[mapping.group]) groupScores[mapping.group] = {};
          groupScores[mapping.group][mapping.type] = (groupScores[mapping.group][mapping.type] || 0) + score;
          allScores.push(score);
        }

        const categoryName = answer.categoryName || '';
        if (categoryName.includes('잠재') || categoryId.includes('POTENTIAL')) {
          const parentId = answer.parentId || '';
          if (!potentialScores[parentId]) potentialScores[parentId] = [];
          potentialScores[parentId].push(score);
        }
      }

      for (const [groupName, types] of Object.entries(groupScores)) {
        let maxType = '';
        let maxScore = -1;
        for (const [typeName, score] of Object.entries(types)) {
          if (score > maxScore) {
            maxScore = score;
            maxType = typeName;
          }
        }
        if (maxType) {
          const key = `${groupName}_${maxType}`;
          surveyCounters[key] = (surveyCounters[key] || 0) + 1;
        }
      }
    }

    const toTypeCount = (count: number): TypeCount => ({
      count,
      percentage: completedCount > 0 ? Math.round((count / completedCount) * 100) : 0,
    });

    const toSurveyDist = (keys: string[], prefix: string): TypeDistribution => {
      const dist: TypeDistribution = {};
      for (const key of keys) {
        const count = surveyCounters[`${prefix}_${key}`] || 0;
        dist[key] = { count, percentage: Math.round((count / completedCount) * 100) };
      }
      return dist;
    };

    const avgScore = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
    const stdDev = allScores.length > 0
      ? Math.sqrt(allScores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / allScores.length)
      : 0;

    const potentialAnalysis: Record<string, { average: number; distribution: number[] }> = {};
    for (const [key, scores] of Object.entries(potentialScores)) {
      potentialAnalysis[key] = {
        average: scores.reduce((a, b) => a + b, 0) / scores.length,
        distribution: this.createDistribution(scores),
      };
    }

    return {
      groupId: group.groupId,
      groupName: group.groupName,
      totalMembers,
      completedCount,
      completionRate: Math.round((completedCount / totalMembers) * 100),
      
      birthdayBased: {
        motivationLocation: {
          internal: toTypeCount(bdCounters.motivationLocation.internal),
          external: toTypeCount(bdCounters.motivationLocation.external),
        },
        motivationOrientation: {
          growth: toTypeCount(bdCounters.motivationOrientation.growth),
          divergence: toTypeCount(bdCounters.motivationOrientation.divergence),
          balance: toTypeCount(bdCounters.motivationOrientation.balance),
          harvest: toTypeCount(bdCounters.motivationOrientation.harvest),
          accumulation: toTypeCount(bdCounters.motivationOrientation.accumulation),
        },
        orgStructure: {
          selfGrowth: toTypeCount(bdCounters.orgStructure.selfGrowth),
          groupGrowth: toTypeCount(bdCounters.orgStructure.groupGrowth),
        },
        selfDetermination: {
          standAlone: toTypeCount(bdCounters.selfDetermination.standAlone),
          group: toTypeCount(bdCounters.selfDetermination.group),
        },
        selfImprovement: {
          rival: toTypeCount(bdCounters.selfImprovement.rival),
          comparative: toTypeCount(bdCounters.selfImprovement.comparative),
        },
        workStyle: {
          purposeAchievement: {
            task: toTypeCount(bdCounters.workStyle.purposeAchievement.task),
            relational: toTypeCount(bdCounters.workStyle.purposeAchievement.relational),
          },
          infoProcessing: {
            intuitive: toTypeCount(bdCounters.workStyle.infoProcessing.intuitive),
            experiential: toTypeCount(bdCounters.workStyle.infoProcessing.experiential),
          },
          abilityExpression: {
            design: toTypeCount(bdCounters.workStyle.abilityExpression.design),
            technical: toTypeCount(bdCounters.workStyle.abilityExpression.technical),
          },
          goalExecution: {
            tactical: toTypeCount(bdCounters.workStyle.goalExecution.tactical),
            strategic: toTypeCount(bdCounters.workStyle.goalExecution.strategic),
          },
        },
      },

      surveyBased: {
        groupBehavior: {
          selfDetermination: toSurveyDist(['standAlone', 'group'], 'selfDetermination'),
          selfImprovement: toSurveyDist(['rival', 'comparative'], 'selfImprovement'),
        },
        workStyle: {
          purposeAchievement: toSurveyDist(['task', 'relational'], 'purposeAchievement'),
          infoProcessing: toSurveyDist(['intuitive', 'experiential'], 'infoProcessing'),
          abilityExpression: toSurveyDist(['design', 'technical'], 'abilityExpression'),
          goalExecution: toSurveyDist(['tactical', 'strategic'], 'goalExecution'),
        },
        potentialScores: potentialAnalysis,
      },

      overallStats: {
        averageScore: Math.round(avgScore * 100) / 100,
        standardDeviation: Math.round(stdDev * 100) / 100,
      },
    };
  }

  private createDistribution(scores: number[]): number[] {
    const dist = [0, 0, 0, 0, 0];
    for (const score of scores) {
      const idx = Math.min(Math.floor(score / 20), 4);
      dist[idx]++;
    }
    return dist;
  }

  private getEmptyAnalytics(group: Group, totalMembers: number): GroupAnalyticsDto {
    const empty = { count: 0, percentage: 0 };
    return {
      groupId: group.groupId,
      groupName: group.groupName,
      totalMembers,
      completedCount: 0,
      completionRate: 0,
      birthdayBased: {
        motivationLocation: { internal: empty, external: empty },
        motivationOrientation: { growth: empty, divergence: empty, balance: empty, harvest: empty, accumulation: empty },
        orgStructure: { selfGrowth: empty, groupGrowth: empty },
        selfDetermination: { standAlone: empty, group: empty },
        selfImprovement: { rival: empty, comparative: empty },
        workStyle: {
          purposeAchievement: { task: empty, relational: empty },
          infoProcessing: { intuitive: empty, experiential: empty },
          abilityExpression: { design: empty, technical: empty },
          goalExecution: { tactical: empty, strategic: empty },
        },
      },
      surveyBased: {
        groupBehavior: {
          selfDetermination: { standAlone: empty, group: empty },
          selfImprovement: { rival: empty, comparative: empty },
        },
        workStyle: {
          purposeAchievement: { task: empty, relational: empty },
          infoProcessing: { intuitive: empty, experiential: empty },
          abilityExpression: { design: empty, technical: empty },
          goalExecution: { tactical: empty, strategic: empty },
        },
        potentialScores: {},
      },
      overallStats: { averageScore: 0, standardDeviation: 0 },
    };
  }

  async getGroupMembers(groupId: number, typeFilter?: string) {
    const results = await this.resultRepo.createQueryBuilder('result')
      .leftJoinAndSelect('result.ticket', 'ticket')
      .where('ticket.group_id = :groupId', { groupId })
      .orderBy('result.createdAt', 'DESC')
      .getMany();

    let members = results.map(r => {
      const manse = r.resultSnapshot?.manse;
      return {
        ticketId: r.ticket?.ticketId,
        clientName: r.ticket?.clientName || r.userMeta?.name || '익명',
        completedAt: r.createdAt,
        birthdayTypes: {
          motivationLocation: manse?.motivationLocation || null,
          motivationOrientation: manse?.motivationOrientation || null,
          orgStructure: manse?.orgStructure || null,
          selfDetermination: manse?.selfDetermination || null,
          selfImprovement: manse?.selfImprovement || null,
        },
        surveyTypes: this.extractSurveyTypes(r.answers || []),
      };
    });

    if (typeFilter) {
      members = members.filter(m => {
        const allTypes = [
          m.birthdayTypes.motivationLocation,
          m.birthdayTypes.motivationOrientation,
          m.birthdayTypes.orgStructure,
          m.birthdayTypes.selfDetermination,
          m.birthdayTypes.selfImprovement,
          ...Object.values(m.surveyTypes),
        ];
        return allTypes.some(t => String(t).toLowerCase().includes(typeFilter.toLowerCase()));
      });
    }

    return { members, total: members.length };
  }

  private extractSurveyTypes(answers: any[]): Record<string, string> {
    const groupScores: Record<string, Record<string, number>> = {};
    
    for (const answer of answers) {
      const categoryId = answer.categoryId || '';
      const score = answer.score ?? 0;
      
      const mapping = SURVEY_CATEGORY_MAP[categoryId];
      if (mapping) {
        if (!groupScores[mapping.group]) groupScores[mapping.group] = {};
        groupScores[mapping.group][mapping.type] = (groupScores[mapping.group][mapping.type] || 0) + score;
      }
    }

    const mainTypes: Record<string, string> = {};
    for (const [groupName, types] of Object.entries(groupScores)) {
      let maxType = '';
      let maxScore = -1;
      for (const [typeName, score] of Object.entries(types)) {
        if (score > maxScore) {
          maxScore = score;
          maxType = typeName;
        }
      }
      if (maxType) mainTypes[groupName] = maxType;
    }
    
    return mainTypes;
  }

  // 하위 그룹 목록 조회
  async getSubGroups(parentGroupId: number) {
    const subGroups = await this.groupRepo.find({
      where: { parentGroup: { groupId: parentGroupId } },
      relations: ['tickets'],
      order: { groupName: 'ASC' },
    });

    return subGroups.map(g => ({
      groupId: g.groupId,
      groupName: g.groupName,
      totalMembers: g.tickets?.length || 0,
    }));
  }

  // 하위 그룹 비교 분석
  async getSubGroupComparison(parentGroupId: number) {
    const subGroups = await this.groupRepo.find({
      where: { parentGroup: { groupId: parentGroupId } },
      relations: ['tickets'],
    });

    if (subGroups.length === 0) {
      return { subGroups: [], hasSubGroups: false };
    }

    const comparisonData = await Promise.all(
      subGroups.map(async (subGroup) => {
        const analytics = await this.getGroupAnalytics(subGroup.groupId);
        return {
          groupId: subGroup.groupId,
          groupName: subGroup.groupName,
          totalMembers: analytics.totalMembers,
          completedCount: analytics.completedCount,
          completionRate: analytics.completionRate,
          averageScore: analytics.overallStats.averageScore,
          standardDeviation: analytics.overallStats.standardDeviation,
          // 주요 유형 분포 요약
          typeDistribution: {
            motivationLocation: analytics.birthdayBased.motivationLocation,
            selfDetermination: analytics.birthdayBased.selfDetermination,
            orgStructure: analytics.birthdayBased.orgStructure,
          },
          // 업무방식 요약
          workStyleSummary: {
            purposeAchievement: analytics.birthdayBased.workStyle.purposeAchievement,
            infoProcessing: analytics.birthdayBased.workStyle.infoProcessing,
          },
        };
      })
    );

    return {
      subGroups: comparisonData,
      hasSubGroups: true,
      totalSubGroups: subGroups.length,
    };
  }
}
