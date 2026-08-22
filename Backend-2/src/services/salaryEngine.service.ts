import { Salary, SalaryComponent, PFConfiguration, TaxConfiguration } from '@prisma/client';

export interface SalaryBreakdown {
  employeeId: string;
  monthlyWage: number;
  yearlyWage: number;
  basic: number;
  hra: number;
  bonus: number;
  fixedAllowance: number;
  components: Array<{
    componentName: string;
    calculationType: string;
    percentage: number | null;
    amount: number;
    salaryBase: string | null;
  }>;
  grossSalary: number;
  employeePF: number;
  employerPF: number;
  professionalTax: number;
  totalDeductions: number;
  netSalary: number;
  payableDays: number;
  totalWorkingDays: number;
  payableSalary: number;
}

export interface CalculateSalaryInput {
  employeeId: string;
  salary: Salary | { monthlyWage: number; halfDayThresholdHours?: number; workingDaysPerWeek?: number };
  components?: SalaryComponent[] | null;
  pfConfig?: PFConfiguration | { employeePercentage?: number; employerPercentage?: number } | null;
  taxConfig?: TaxConfiguration | { professionalTax?: number } | null;
  payableDays?: number;
  totalWorkingDays?: number;
}

export const EXACT_SALARY_EXCEEDS_ERROR = 'Salary components cannot exceed the configured wage.';

export function calculateSalary(input: CalculateSalaryInput): SalaryBreakdown {
  const { employeeId, salary, components = [], pfConfig, taxConfig, payableDays = 30, totalWorkingDays = 30 } = input;

  const monthlyWage = Number(salary.monthlyWage);
  const yearlyWage = monthlyWage * 12;

  let basic = 0;
  let hra = 0;
  let bonus = 0;
  let fixedAllowance = 0;

  const calculatedComponents: Array<{
    componentName: string;
    calculationType: string;
    percentage: number | null;
    amount: number;
    salaryBase: string | null;
  }> = [];

  if (components && components.length > 0) {
    // 1. Calculate base components first (PERCENT_OF_WAGE, FIXED_AMOUNT)
    let explicitSum = 0;

    // First find or compute Basic
    const basicComp = components.find(
      (c) => c.componentName.toLowerCase().includes('basic') || c.salaryBase === 'WAGE'
    );

    if (basicComp) {
      if (basicComp.calculationType === 'PERCENT_OF_WAGE' && basicComp.percentage != null) {
        basic = (monthlyWage * basicComp.percentage) / 100;
      } else if (basicComp.amount != null) {
        basic = basicComp.amount;
      }
    } else {
      // Default to 50% of monthlyWage
      basic = monthlyWage * 0.5;
    }

    let remainderCompIndex = -1;

    for (let i = 0; i < components.length; i++) {
      const c = components[i];
      let amount = 0;

      if (c.calculationType === 'PERCENT_OF_WAGE' && c.percentage != null) {
        amount = (monthlyWage * c.percentage) / 100;
        explicitSum += amount;
      } else if (c.calculationType === 'PERCENT_OF_BASIC' && c.percentage != null) {
        amount = (basic * c.percentage) / 100;
        explicitSum += amount;
      } else if (c.calculationType === 'FIXED_AMOUNT' && c.amount != null) {
        amount = c.amount;
        explicitSum += amount;
      } else if (c.calculationType === 'FIXED_REMAINDER') {
        remainderCompIndex = i;
        // will compute after
      } else if (c.amount != null) {
        amount = c.amount;
        explicitSum += amount;
      }

      if (c.componentName.toLowerCase().includes('hra')) {
        hra = amount;
      } else if (
        c.componentName.toLowerCase().includes('bonus') ||
        c.componentName.toLowerCase().includes('lta') ||
        c.componentName.toLowerCase().includes('performance')
      ) {
        bonus = amount;
      }

      calculatedComponents.push({
        componentName: c.componentName,
        calculationType: c.calculationType,
        percentage: c.percentage,
        amount: Math.round(amount * 100) / 100,
        salaryBase: c.salaryBase
      });
    }

    if (remainderCompIndex >= 0) {
      const rem = Math.max(0, monthlyWage - explicitSum);
      fixedAllowance = rem;
      calculatedComponents[remainderCompIndex].amount = Math.round(rem * 100) / 100;
      explicitSum += rem;
    }

    // Validate sum
    const totalComponentSum = calculatedComponents.reduce((acc, c) => acc + c.amount, 0);
    // Allow small float tolerance
    if (totalComponentSum > monthlyWage + 0.01) {
      throw new Error(EXACT_SALARY_EXCEEDS_ERROR);
    }
  } else {
    // Standard default breakdown
    basic = Math.round(monthlyWage * 0.5 * 100) / 100; // 50% of Wage
    hra = Math.round(basic * 0.5 * 100) / 100; // 50% of Basic
    bonus = Math.round(basic * 0.0833 * 100) / 100; // 8.33% of Basic
    fixedAllowance = Math.round(Math.max(0, monthlyWage - (basic + hra + bonus)) * 100) / 100;

    calculatedComponents.push(
      { componentName: 'Basic Salary', calculationType: 'PERCENT_OF_WAGE', percentage: 50, amount: basic, salaryBase: 'WAGE' },
      { componentName: 'House Rent Allowance (HRA)', calculationType: 'PERCENT_OF_BASIC', percentage: 50, amount: hra, salaryBase: 'BASIC' },
      { componentName: 'Performance Bonus / LTA', calculationType: 'PERCENT_OF_BASIC', percentage: 8.33, amount: bonus, salaryBase: 'BASIC' },
      { componentName: 'Fixed Allowance', calculationType: 'FIXED_REMAINDER', percentage: null, amount: fixedAllowance, salaryBase: 'WAGE' }
    );
  }

  // Gross Salary = Sum of components = monthlyWage
  const grossSalary = monthlyWage;

  // PF Calculation
  const empPfPercent = pfConfig?.employeePercentage ?? 12;
  const emplyrPfPercent = pfConfig?.employerPercentage ?? 12;
  const employeePF = Math.round(((basic * empPfPercent) / 100) * 100) / 100;
  const employerPF = Math.round(((basic * emplyrPfPercent) / 100) * 100) / 100;

  // Professional Tax
  const professionalTax = taxConfig?.professionalTax != null ? Number(taxConfig.professionalTax) : 200;

  // Deductions & Net Salary
  const totalDeductions = Math.round((employeePF + professionalTax) * 100) / 100;
  const netSalary = Math.round(Math.max(0, grossSalary - totalDeductions) * 100) / 100;

  // Payable Salary based on days worked
  const safeTotalWorkingDays = totalWorkingDays > 0 ? totalWorkingDays : 30;
  const ratio = Math.max(0, Math.min(1, payableDays / safeTotalWorkingDays));
  const payableSalary = Math.round(netSalary * ratio * 100) / 100;

  return {
    employeeId,
    monthlyWage,
    yearlyWage,
    basic,
    hra,
    bonus,
    fixedAllowance,
    components: calculatedComponents,
    grossSalary,
    employeePF,
    employerPF,
    professionalTax,
    totalDeductions,
    netSalary,
    payableDays,
    totalWorkingDays: safeTotalWorkingDays,
    payableSalary
  };
}
