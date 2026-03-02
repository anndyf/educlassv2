
/**
 * Lógica de Predição de Risco (IA Simples)
 * Baseada no acúmulo de pontos necessários para atingir a média 5.0 (Total 15.0 em 3 unidades)
 */

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'NONE';

export interface RiskAnalysis {
  level: RiskLevel;
  pointsNeeded: number;
  message: string;
  color: string;
}

export function analyzeRisk(nota1: number | null, nota2: number | null, nota3: number | null): RiskAnalysis {
  const GOAL = 15.0; // Média 5.0 * 3 unidades
  let currentTotal = 0;
  let unitsCount = 0;

  if (nota1 !== null) { currentTotal += nota1; unitsCount++; }
  if (nota2 !== null) { currentTotal += nota2; unitsCount++; }
  if (nota3 !== null) { currentTotal += nota3; unitsCount++; }

  // Se não tem nenhuma nota, não há risco calculado
  if (unitsCount === 0) {
    return { level: 'NONE', pointsNeeded: 15.0, message: 'Sem dados', color: 'text-slate-400' };
  }

  const remainingPoints = GOAL - currentTotal;
  const remainingUnits = 3 - unitsCount;

  // Se já atingiu a meta
  if (remainingPoints <= 0) {
    return { level: 'LOW', pointsNeeded: 0, message: 'Aprovado', color: 'text-emerald-500' };
  }

  // Se não restam mais unidades e não atingiu a meta
  if (remainingUnits === 0) {
    return { level: 'CRITICAL', pointsNeeded: remainingPoints, message: 'Reprovado', color: 'text-rose-600' };
  }

  const averageNeededPerUnit = remainingPoints / remainingUnits;

  // Classificação de Risco
  if (averageNeededPerUnit > 9.0) {
    return { 
      level: 'CRITICAL', 
      pointsNeeded: remainingPoints, 
      message: `Crítico (Precisa de ${averageNeededPerUnit.toFixed(1)}/und)`, 
      color: 'text-rose-600' 
    };
  } else if (averageNeededPerUnit > 7.0) {
    return { 
      level: 'HIGH', 
      pointsNeeded: remainingPoints, 
      message: `Alto Risco (Precisa de ${averageNeededPerUnit.toFixed(1)}/und)`, 
      color: 'text-orange-600' 
    };
  } else if (averageNeededPerUnit > 5.0) {
    return { 
      level: 'MEDIUM', 
      pointsNeeded: remainingPoints, 
      message: `Atenção (Precisa de ${averageNeededPerUnit.toFixed(1)}/und)`, 
      color: 'text-amber-500' 
    };
  } else {
    return { 
      level: 'LOW', 
      pointsNeeded: remainingPoints, 
      message: `Estável (Precisa de ${averageNeededPerUnit.toFixed(1)}/und)`, 
      color: 'text-emerald-500' 
    };
  }
}
