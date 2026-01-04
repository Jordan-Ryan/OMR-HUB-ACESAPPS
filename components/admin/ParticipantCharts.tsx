'use client';

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
} from 'recharts';

interface DailyCheckin {
  date: string;
  steps: number | null;
  calories_consumed: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  workout_completed: boolean;
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
  stepGoal?: number | null;
}

export function ParticipantCharts({
  dailyCheckins,
  weightCheckins = [],
  targetCalories,
  targetProtein,
  targetCarbs,
  targetFat,
  stepGoal,
}: ParticipantChartsProps) {
  // Prepare steps data
  const stepsData = dailyCheckins
    .filter(c => c.steps !== null)
    .map(c => ({
      date: new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      steps: c.steps,
      goal: stepGoal,
    }));

  // Prepare calories data
  const caloriesData = dailyCheckins
    .filter(c => c.calories_consumed !== null)
    .map(c => ({
      date: new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      calories: c.calories_consumed,
      target: targetCalories,
    }));

  // Prepare macros data
  const macrosData = dailyCheckins
    .filter(c => c.protein_g !== null || c.carbs_g !== null || c.fat_g !== null)
    .map(c => ({
      date: new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      protein: c.protein_g || 0,
      carbs: c.carbs_g || 0,
      fat: c.fat_g || 0,
      targetProtein: targetProtein || 0,
      targetCarbs: targetCarbs || 0,
      targetFat: targetFat || 0,
    }));

  // Prepare workout completion data
  const workoutData = dailyCheckins.map(c => ({
    date: new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    completed: c.workout_completed ? 1 : 0,
  }));

  // Prepare weight data
  const weightData = weightCheckins
    .filter(w => w.weight_kg !== null)
    .map(w => ({
      checkIn: `Check-in ${w.check_in_number}`,
      weight: w.weight_kg,
    }));

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
              <YAxis stroke="rgba(255, 255, 255, 0.6)" />
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
              <YAxis stroke="rgba(255, 255, 255, 0.6)" />
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
              {targetCalories && (
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#FF9500"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Target"
                  dot={false}
                />
              )}
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
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>
            Macros Progress
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={macrosData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="date" stroke="rgba(255, 255, 255, 0.6)" />
              <YAxis stroke="rgba(255, 255, 255, 0.6)" />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ color: '#FFFFFF' }} />
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
                dataKey="carbs"
                stroke="#007AFF"
                strokeWidth={2}
                name="Carbs (g)"
                dot={{ fill: '#007AFF', r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="fat"
                stroke="#FF9500"
                strokeWidth={2}
                name="Fat (g)"
                dot={{ fill: '#FF9500', r: 3 }}
              />
              {targetProtein && (
                <Line
                  type="monotone"
                  dataKey="targetProtein"
                  stroke="#FF3B30"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  name="Target Protein"
                  dot={false}
                  opacity={0.5}
                />
              )}
              {targetCarbs && (
                <Line
                  type="monotone"
                  dataKey="targetCarbs"
                  stroke="#007AFF"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  name="Target Carbs"
                  dot={false}
                  opacity={0.5}
                />
              )}
              {targetFat && (
                <Line
                  type="monotone"
                  dataKey="targetFat"
                  stroke="#FF9500"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  name="Target Fat"
                  dot={false}
                  opacity={0.5}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Workout Completion Chart */}
      {workoutData.length > 0 && (
        <div
          style={{
            padding: '20px',
            background: '#1a1a1a',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>
            Workout Completion
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={workoutData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="date" stroke="rgba(255, 255, 255, 0.6)" />
              <YAxis stroke="rgba(255, 255, 255, 0.6)" />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="completed" fill="#34C759" name="Workout Completed" />
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
              <YAxis stroke="rgba(255, 255, 255, 0.6)" />
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


