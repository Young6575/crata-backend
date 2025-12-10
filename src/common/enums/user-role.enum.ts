export enum UserRole {
  USER = 'user', // 일반 개인 회원 (기본값)
  TEACHER = 'teacher', // 강사/상담사
  ADMIN = 'admin', // 시스템 관리자
  COMPANY_MANAGER = 'companymanager', // 기업 담당자 (B2B 구매/관리 권한)
}