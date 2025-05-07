export interface MembershipBenefit {
  id: number;
  membershipId: number;
  membershipName: string;
  benefitType: string;
  configJson: string;
  description: string;
  logoUrl: string;
  
  // Các trường phân tích từ ConfigJson
  target?: string;
  value?: number;
  multiplier?: number;
  serviceId?: string;
  serviceName?: string;
  quantity?: number;
  limit?: number;
  usePointValue?: number;
}

export interface MembershipBenefitRequest {
  id?: number;
  membershipId: number;
  benefitType: string;
  description: string;
  
  // Cho Discount
  target?: string;
  value?: number;
  
  // Cho PointBonus
  multiplier?: number;
  
  // Cho Service
  serviceId?: string;
  quantity?: number;
  limit?: number;
  
  // Cho UsePoint
  usePointValue?: number;
}
