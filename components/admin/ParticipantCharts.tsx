'use client';

import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';

interface WorkoutDetail {
  activityType?: string;
  name?: string;
}

interface DailyCheckin {
  date: string;
  steps: number | null;
  calories_consumed: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  workout_completed: boolean;
  workout_type?: string | null;
  workout_details?: WorkoutDetail[] | null;
}

interface WeightCheckin {
  check_in_number: number;
  weight_kg: number | null;
  submitted_at: string;
}

interface ParticipantChartsProps {
  dailyCheckins: DailyCheckin[];
  weightCheckins?: WeightCheckin[];
  targetCalories?: number | null;
  targetProtein?: number | null;
  targetCarbs?: number | null;
  targetFat?: number | null;
  getTargetValuesForDate?: (date: string) => {
    calories: number | null;
    protein: number | null;
    carbs: number | null;
    fat: number | null;
  };
  stepGoal?: number | null;
}

export function ParticipantCharts({
  dailyCheckins,
  weightCheckins = [],
  targetCalories,
  targetProtein,
  targetCarbs,
  targetFat,
  getTargetValuesForDate,
  stepGoal,
}: ParticipantChartsProps) {
  // State for macro filters
  const [showProtein, setShowProtein] = useState(true);
  const [showCarbs, setShowCarbs] = useState(true);
  const [showFat, setShowFat] = useState(true);
  // Helper function to calculate nice Y-axis domain
  const calculateYAxisDomain = (values: (number | null)[], includeTargets: (number | null)[] = []): [number, number] => {
    const allValues = [...values, ...includeTargets].filter((v): v is number => v !== null && v !== undefined);
    
    if (allValues.length === 0) {
      return [0, 100];
    }

    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    
    // If min and max are the same, add some padding
    if (min === max) {
      const padding = Math.max(1, min * 0.1);
      return [Math.max(0, min - padding), max + padding];
    }

    // Add 10% padding
    const range = max - min;
    const padding = range * 0.1;
    let domainMin = min - padding;
    let domainMax = max + padding;

    // Round to nice numbers using a simpler approach
    const getNiceIncrement = (range: number): number => {
      if (range === 0) return 1;
      const magnitude = Math.pow(10, Math.floor(Math.log10(range)));
      const normalized = range / magnitude;
      
      if (normalized <= 1) return 1 * magnitude;
      if (normalized <= 2) return 2 * magnitude;
      if (normalized <= 5) return 5 * magnitude;
      return 10 * magnitude;
    };

    const increment = getNiceIncrement(range);
    
    // Round min down and max up to nice increments
    domainMin = Math.max(0, Math.floor(domainMin / increment) * increment);
    domainMax = Math.ceil(domainMax / increment) * increment;
    
    // Ensure we have a minimum range for better visualization
    if (domainMax - domainMin < increment && domainMax > 0) {
      domainMax = domainMin + increment;
    }

    return [domainMin, domainMax];
  };

  // Helper function to calculate nice tick interval
  const calculateTickInterval = (domain: [number, number], numTicks: number = 5): number => {
    const range = domain[1] - domain[0];
    const rawInterval = range / numTicks;
    
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawInterval)));
    const normalized = rawInterval / magnitude;
    
    let niceInterval: number;
    if (normalized <= 1) niceInterval = 1;
    else if (normalized <= 2) niceInterval = 2;
    else if (normalized <= 5) niceInterval = 5;
    else niceInterval = 10;
    
    return niceInterval * magnitude;
  };

  // Prepare steps data
  const stepsData = dailyCheckins
    .filter(c => c.steps !== null)
    .map(c => ({
      date: new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      steps: c.steps,
      goal: stepGoal,
    }));

  // Calculate steps Y-axis domain
  const stepsDomain = stepsData.length > 0
    ? calculateYAxisDomain(
        stepsData.map(d => d.steps),
        stepGoal ? [stepGoal] : []
      )
    : [0, 10000];
  const stepsTickInterval = calculateTickInterval(stepsDomain);

  // Prepare calories data with date-specific targets
  const caloriesData = dailyCheckins
    .filter(c => c.calories_consumed !== null)
    .map(c => {
      const targetValues = getTargetValuesForDate ? getTargetValuesForDate(c.date) : null;
      return {
      date: new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      calories: c.calories_consumed,
        target: targetValues?.calories ?? targetCalories ?? null,
      };
    });

  // Calculate calories Y-axis domain with balanced padding and 50-calorie increments
  const caloriesDomain = useMemo(() => {
    if (caloriesData.length === 0) return [0, 3000];
    
    const allValues = [
      ...caloriesData.map(d => d.calories),
      ...caloriesData.map(d => d.target)
    ].filter((v): v is number => v !== null && v !== undefined && !isNaN(v));
    
    if (allValues.length === 0) return [0, 3000];
    
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = max - min;
    
    // Add 10% padding on each side
    const padding = range * 0.1;
    const paddedMin = min - padding;
    const paddedMax = max + padding;
    
    // Round to increments of 50 for calories
    const increment = 50;
    
    // Round down min and round up max to nearest 50
    let domainMin = Math.floor(paddedMin / increment) * increment;
    let domainMax = Math.ceil(paddedMax / increment) * increment;
    
    // Ensure balanced padding by checking actual padding after rounding
    const actualPaddingBottom = min - domainMin;
    const actualPaddingTop = domainMax - max;
    const avgPadding = (actualPaddingBottom + actualPaddingTop) / 2;
    
    // If padding is very unbalanced, adjust to center better
    if (Math.abs(actualPaddingBottom - actualPaddingTop) > increment) {
      const center = (min + max) / 2;
      const desiredRange = (max - min) + (avgPadding * 2);
      domainMin = Math.floor((center - desiredRange / 2) / increment) * increment;
      domainMax = Math.ceil((center + desiredRange / 2) / increment) * increment;
    }
    
    // Ensure minimum range
    if (domainMax - domainMin < increment * 4) {
      const center = (domainMin + domainMax) / 2;
      domainMin = Math.floor((center - increment * 2) / increment) * increment;
      domainMax = Math.ceil((center + increment * 2) / increment) * increment;
    }
    
    return [domainMin, domainMax];
  }, [caloriesData]);
  
  const caloriesTickInterval = 50;

  // Prepare macros data with date-specific targets
  const macrosData = dailyCheckins
    .filter(c => c.protein_g !== null || c.carbs_g !== null || c.fat_g !== null)
    .map(c => {
      const targetValues = getTargetValuesForDate ? getTargetValuesForDate(c.date) : null;
      return {
      date: new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      protein: c.protein_g || 0,
      carbs: c.carbs_g || 0,
      fat: c.fat_g || 0,
        targetProtein: targetValues?.protein ?? targetProtein ?? 0,
        targetCarbs: targetValues?.carbs ?? targetCarbs ?? 0,
        targetFat: targetValues?.fat ?? targetFat ?? 0,
      };
    });

  // Calculate macros Y-axis domain based on visible macros only
  const visibleMacroValues = useMemo(() => {
    const values: number[] = [];
    if (showProtein) {
      values.push(...macrosData.map(d => d.protein), ...macrosData.map(d => d.targetProtein));
    }
    if (showCarbs) {
      values.push(...macrosData.map(d => d.carbs), ...macrosData.map(d => d.targetCarbs));
    }
    if (showFat) {
      values.push(...macrosData.map(d => d.fat), ...macrosData.map(d => d.targetFat));
    }
    return values.filter((v): v is number => v !== null && v !== undefined && !isNaN(v) && v >= 0);
  }, [macrosData, showProtein, showCarbs, showFat]);
  
  // Calculate macros domain and tick interval based on visible macros
  const { macrosDomain, macrosTickInterval } = useMemo(() => {
    if (macrosData.length > 0 && visibleMacroValues.length > 0) {
      const min = Math.min(...visibleMacroValues);
      const max = Math.max(...visibleMacroValues);
      
      // If all macros are visible, use fixed 7 segments of 50g (0-350)
      const allMacrosVisible = showProtein && showCarbs && showFat;
      if (allMacrosVisible) {
        return {
          macrosDomain: [0, 350] as [number, number],
          macrosTickInterval: 50,
        };
      }
      
      // For filtered views, calculate dynamically
      const range = max - min;
      const numSegments = 5;
      
      // Calculate interval based on data range
      const rawInterval = range / (numSegments - 1);
      
      // Round to nice increment (10, 20, 50, 100, etc.)
      const getNiceIncrement = (value: number): number => {
        if (value === 0) return 10;
        const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
        const normalized = value / magnitude;
        
        if (normalized <= 1) return 1 * magnitude;
        if (normalized <= 2) return 2 * magnitude;
        if (normalized <= 5) return 5 * magnitude;
        return 10 * magnitude;
      };
      
      const niceInterval = getNiceIncrement(rawInterval);
      
      // Calculate domain: round min down and max up to align with increments
      let domainMin = Math.floor(min / niceInterval) * niceInterval;
      let domainMax = Math.ceil(max / niceInterval) * niceInterval;
      
      // Add minimal padding: one increment on each side
      domainMin = Math.max(0, domainMin - niceInterval);
      domainMax = domainMax + niceInterval;
      
      // Ensure we have at least the desired number of segments
      const actualSegments = (domainMax - domainMin) / niceInterval;
      if (actualSegments < numSegments) {
        const neededRange = niceInterval * numSegments;
        const currentRange = domainMax - domainMin;
        const extraNeeded = neededRange - currentRange;
        domainMax += Math.ceil(extraNeeded);
        domainMax = Math.ceil(domainMax / niceInterval) * niceInterval;
      }
      
      return {
        macrosDomain: [domainMin, domainMax] as [number, number],
        macrosTickInterval: niceInterval,
      };
    }
    return {
      macrosDomain: [0, 350] as [number, number],
      macrosTickInterval: 50,
    };
  }, [macrosData, visibleMacroValues, showProtein, showCarbs, showFat]);

  // Helper function to determine workout types
  const getWorkoutTypes = (checkin: DailyCheckin): { weights: boolean; cardio: boolean } => {
    if (!checkin.workout_completed) return { weights: false, cardio: false };
    
    // First check workout_details for activityType
    if (checkin.workout_details && Array.isArray(checkin.workout_details) && checkin.workout_details.length > 0) {
      const hasWeights = checkin.workout_details.some((detail: WorkoutDetail) => detail.activityType === 'weights');
      const hasCardio = checkin.workout_details.some((detail: WorkoutDetail) => detail.activityType === 'cardio');
      return { weights: hasWeights, cardio: hasCardio };
    }
    
    // Fall back to workout_type string matching
    if (checkin.workout_type) {
      const type = checkin.workout_type.toLowerCase();
      const hasWeights = type.includes('weight') || type.includes('strength') || type.includes('circuit');
      const hasCardio = type.includes('cardio') || type.includes('run') || type.includes('bike');
      return { weights: hasWeights, cardio: hasCardio };
    }
    
    // Default: if workout_completed is true but no type specified, assume both
    return { weights: true, cardio: false };
  };

  // Group workouts by week
  const workoutDataByWeek = useMemo(() => {
    if (dailyCheckins.length === 0) return [];
    
    // Get date range
    const dates = dailyCheckins.map(c => new Date(c.date)).sort((a, b) => a.getTime() - b.getTime());
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];
    
    // Calculate weeks
    const weeks: Array<{
      weekNumber: number;
      weekLabel: string;
      startDate: Date;
      endDate: Date;
      weights: number;
      cardio: number;
    }> = [];
    
    let currentWeekStart = new Date(startDate);
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay()); // Start of week (Sunday)
    let weekNumber = 1;
    
    while (currentWeekStart <= endDate) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6); // End of week (Saturday)
      
      // Count workouts in this week
      let weights = 0;
      let cardio = 0;
      
      dailyCheckins.forEach(checkin => {
        const checkinDate = new Date(checkin.date);
        if (checkinDate >= currentWeekStart && checkinDate <= weekEnd) {
          const types = getWorkoutTypes(checkin);
          if (types.weights) weights++;
          if (types.cardio) cardio++;
        }
      });
      
      weeks.push({
        weekNumber,
        weekLabel: `W${weekNumber}`,
        startDate: new Date(currentWeekStart),
        endDate: new Date(weekEnd),
        weights,
        cardio,
      });
      
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      weekNumber++;
    }
    
    return weeks;
  }, [dailyCheckins]);

  // Calculate Y-axis domain for workouts (increments of 2)
  const workoutDomain = useMemo(() => {
    if (workoutDataByWeek.length === 0) return [0, 6];
    const maxValue = Math.max(...workoutDataByWeek.map(w => w.weights + w.cardio));
    const roundedMax = Math.ceil(maxValue / 2) * 2; // Round up to nearest 2
    return [0, Math.max(6, roundedMax)];
  }, [workoutDataByWeek]);

  // Prepare weight data
  const weightData = weightCheckins
    .filter(w => w.weight_kg !== null)
    .map(w => ({
      checkIn: `Check-in ${w.check_in_number}`,
      weight: w.weight_kg,
    }));

  // Calculate weight Y-axis domain with 10% padding and 2kg increments
  const weightDomain = useMemo(() => {
    if (weightData.length === 0) return [0, 100];
    
    const weights = weightData.map(d => d.weight).filter((w): w is number => w !== null && w !== undefined);
    if (weights.length === 0) return [0, 100];
    
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const range = max - min;
    const padding = range * 0.1;
    
    // Calculate domain with padding
    let domainMin = min - padding;
    let domainMax = max + padding;
    
    // Round to increments of 2
    domainMin = Math.floor(domainMin / 2) * 2;
    domainMax = Math.ceil(domainMax / 2) * 2;
    
    // Ensure minimum range
    if (domainMax - domainMin < 4) {
      domainMax = domainMin + 4;
    }
    
    return [domainMin, domainMax];
  }, [weightData]);

  const chartStyle = {
    background: '#1a1a1a',
    color: '#FFFFFF',
  };

  const tooltipStyle = {
    backgroundColor: '#2a2a2a',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: '#FFFFFF',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Steps Chart */}
      {stepsData.length > 0 && (
        <div
          style={{
            padding: '20px',
            background: '#1a1a1a',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>
            Steps Progress
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stepsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="date" stroke="rgba(255, 255, 255, 0.6)" />
              <YAxis 
                stroke="rgba(255, 255, 255, 0.6)" 
                domain={stepsDomain}
                tickCount={5}
                allowDecimals={false}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ color: '#FFFFFF' }} />
              <Line
                type="monotone"
                dataKey="steps"
                stroke="#34C759"
                strokeWidth={2}
                name="Steps"
                dot={{ fill: '#34C759', r: 4 }}
              />
              {stepGoal && (
                <Line
                  type="monotone"
                  dataKey="goal"
                  stroke="#FF9500"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Goal"
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Calories Chart */}
      {caloriesData.length > 0 && (
        <div
          style={{
            padding: '20px',
            background: '#1a1a1a',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>
            Calories Progress
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={caloriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="date" stroke="rgba(255, 255, 255, 0.6)" />
              <YAxis 
                stroke="rgba(255, 255, 255, 0.6)" 
                domain={caloriesDomain}
                allowDecimals={false}
                ticks={(() => {
                  const ticks: number[] = [];
                  for (let i = caloriesDomain[0]; i <= caloriesDomain[1]; i += caloriesTickInterval) {
                    ticks.push(i);
                  }
                  return ticks;
                })()}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ color: '#FFFFFF' }} />
              <Line
                type="monotone"
                dataKey="calories"
                stroke="#007AFF"
                strokeWidth={2}
                name="Calories"
                dot={{ fill: '#007AFF', r: 4 }}
              />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#FF9500"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Target"
                  dot={false}
                connectNulls={false}
                />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Macros Chart */}
      {macrosData.length > 0 && (
        <div
          style={{
            padding: '20px',
            background: '#1a1a1a',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>
            Macros Progress
          </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowProtein(!showProtein)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: showProtein ? 'rgba(255, 59, 48, 0.2)' : 'transparent',
                  color: showProtein ? '#FF3B30' : 'rgba(255, 255, 255, 0.6)',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Protein
              </button>
              <button
                onClick={() => setShowCarbs(!showCarbs)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: showCarbs ? 'rgba(0, 122, 255, 0.2)' : 'transparent',
                  color: showCarbs ? '#007AFF' : 'rgba(255, 255, 255, 0.6)',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Carbs
              </button>
              <button
                onClick={() => setShowFat(!showFat)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: showFat ? 'rgba(255, 149, 0, 0.2)' : 'transparent',
                  color: showFat ? '#FF9500' : 'rgba(255, 255, 255, 0.6)',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Fat
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={macrosData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="date" stroke="rgba(255, 255, 255, 0.6)" />
              <YAxis 
                stroke="rgba(255, 255, 255, 0.6)" 
                domain={macrosDomain}
                tickCount={Math.ceil((macrosDomain[1] - macrosDomain[0]) / macrosTickInterval) + 1}
                allowDecimals={false}
                interval={0}
                ticks={(() => {
                  const ticks: number[] = [];
                  for (let i = macrosDomain[0]; i <= macrosDomain[1]; i += macrosTickInterval) {
                    ticks.push(i);
                  }
                  return ticks;
                })()}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ color: '#FFFFFF' }} />
              {showProtein && (
                <>
              <Line
                type="monotone"
                dataKey="protein"
                stroke="#FF3B30"
                strokeWidth={2}
                name="Protein (g)"
                dot={{ fill: '#FF3B30', r: 3 }}
              />
                  <Line
                    type="monotone"
                    dataKey="targetProtein"
                    stroke="#FF3B30"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    name="Target Protein"
                    dot={false}
                    opacity={0.5}
                    connectNulls={false}
                  />
                </>
              )}
              {showCarbs && (
                <>
              <Line
                type="monotone"
                dataKey="carbs"
                stroke="#007AFF"
                strokeWidth={2}
                name="Carbs (g)"
                dot={{ fill: '#007AFF', r: 3 }}
              />
                <Line
                  type="monotone"
                  dataKey="targetCarbs"
                  stroke="#007AFF"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  name="Target Carbs"
                  dot={false}
                  opacity={0.5}
                    connectNulls={false}
                  />
                </>
              )}
              {showFat && (
                <>
                  <Line
                    type="monotone"
                    dataKey="fat"
                    stroke="#FF9500"
                    strokeWidth={2}
                    name="Fat (g)"
                    dot={{ fill: '#FF9500', r: 3 }}
                  />
                <Line
                  type="monotone"
                  dataKey="targetFat"
                  stroke="#FF9500"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  name="Target Fat"
                  dot={false}
                  opacity={0.5}
                    connectNulls={false}
                />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Activities Per Week Chart */}
      {workoutDataByWeek.length > 0 && (
        <div
          style={{
            padding: '20px',
            background: '#1a1a1a',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>
            Activities Per Week
          </h3>
          
          {/* Legend */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', background: '#007AFF', borderRadius: '2px' }}></div>
              <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px' }}>Weight</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', background: '#34C759', borderRadius: '2px' }}></div>
              <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px' }}>Cardio</span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={workoutDataByWeek}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis 
                dataKey="weekLabel" 
                stroke="rgba(255, 255, 255, 0.6)"
                tick={{ fill: 'rgba(255, 255, 255, 0.6)' }}
              />
              <YAxis 
                stroke="rgba(255, 255, 255, 0.6)"
                domain={workoutDomain}
                tick={{ fill: 'rgba(255, 255, 255, 0.6)' }}
                allowDecimals={false}
                ticks={(() => {
                  const ticks: number[] = [];
                  for (let i = 0; i <= workoutDomain[1]; i += 2) {
                    ticks.push(i);
                  }
                  return ticks;
                })()}
              />
              <Tooltip 
                contentStyle={{
                  ...tooltipStyle,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                formatter={(value: number, name: string) => [value, name]}
              />
              <Bar 
                dataKey="weights" 
                stackId="activities"
                fill="#007AFF" 
                name="Weight"
                radius={[0, 0, 0, 0]}
              >
                {workoutDataByWeek.map((entry, index) => (
                  <Cell key={`weights-${index}`} fill="#007AFF" />
                ))}
                <LabelList 
                  dataKey="weights" 
                  content={({ x, y, width, height, value }: any) => {
                    if (!value || value === 0) return null;
                    const centerX = (x || 0) + (width || 0) / 2;
                    const centerY = (y || 0) + (height || 0) / 2;
                    // BarbellIcon SVG path
                    return (
                      <g transform={`translate(${centerX - 8}, ${centerY - 8})`}>
                        <svg 
                          width={16} 
                          height={16} 
                          viewBox="0 0 512 512"
                          fill="#FFFFFF"
                        >
                          <path d="M467,176a29.94,29.94,0,0,0-25.32,12.5,2,2,0,0,1-3.64-1.14V150.71c0-20.75-16.34-38.21-37.08-38.7A38,38,0,0,0,362,150v82a2,2,0,0,1-2,2H152a2,2,0,0,1-2-2V150.71c0-20.75-16.34-38.21-37.08-38.7A38,38,0,0,0,74,150v37.38a2,2,0,0,1-3.64,1.14A29.94,29.94,0,0,0,45,176c-16.3.51-29,14.31-29,30.62v98.72c0,16.31,12.74,30.11,29,30.62a29.94,29.94,0,0,0,25.32-12.5A2,2,0,0,1,74,324.62v36.67C74,382,90.34,399.5,111.08,400A38,38,0,0,0,150,362V280a2,2,0,0,1,2-2H360a2,2,0,0,1,2,2v81.29c0,20.75,16.34,38.21,37.08,38.7A38,38,0,0,0,438,362V324.62a2,2,0,0,1,3.64-1.14A29.94,29.94,0,0,0,467,336c16.3-.51,29-14.31,29-30.62V206.64C496,190.33,483.26,176.53,467,176Z"/>
                        </svg>
                      </g>
                    );
                  }}
                />
              </Bar>
              <Bar 
                dataKey="cardio" 
                stackId="activities"
                fill="#34C759" 
                name="Cardio"
                radius={[4, 4, 0, 0]}
              >
                {workoutDataByWeek.map((entry, index) => (
                  <Cell key={`cardio-${index}`} fill="#34C759" />
                ))}
                <LabelList 
                  dataKey="cardio" 
                  content={({ x, y, width, height, value }: any) => {
                    if (!value || value === 0) return null;
                    const centerX = (x || 0) + (width || 0) / 2;
                    // For stacked bars, y is the top of the cardio segment
                    const centerY = (y || 0) + (height || 0) / 2;
                    // FitnessIcon SVG path (heart with pulse line)
                    return (
                      <g transform={`translate(${centerX - 7}, ${centerY - 7})`}>
                        <svg 
                          width={14} 
                          height={14} 
                          viewBox="0 0 512 512"
                          fill="none"
                          stroke="#FFFFFF"
                          strokeWidth="32"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M352.92,80C288,80,256,144,256,144s-32-64-96.92-64C106.32,80,64.54,124.14,64,176.81c-1.1,109.33,86.73,187.08,183,252.42a16,16,0,0,0,18,0c96.26-65.34,184.09-143.09,183-252.42C447.46,124.14,405.68,80,352.92,80Z"/>
                          <polyline points="48 256 160 256 208 160 256 320 304 224 336 288 464 288"/>
                        </svg>
                      </g>
                    );
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Weight Progress Chart */}
      {weightData.length > 0 && (
        <div
          style={{
            padding: '20px',
            background: '#1a1a1a',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>
            Weight Progress
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weightData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="checkIn" stroke="rgba(255, 255, 255, 0.6)" />
              <YAxis 
                stroke="rgba(255, 255, 255, 0.6)"
                domain={weightDomain}
                allowDecimals={false}
                ticks={(() => {
                  const ticks: number[] = [];
                  for (let i = weightDomain[0]; i <= weightDomain[1]; i += 2) {
                    ticks.push(i);
                  }
                  return ticks;
                })()}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ color: '#FFFFFF' }} />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#FF9500"
                strokeWidth={2}
                name="Weight (kg)"
                dot={{ fill: '#FF9500', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}


