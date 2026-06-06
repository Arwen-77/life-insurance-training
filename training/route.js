import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  let query = `
    SELECT 
      ts.id,
      ts.title,
      ts.scenario,
      ts.scenario_type,
      ts.difficulty,
      ts.tips
    FROM training_scenarios ts
  `;
  let params = [];

  if (type) {
    query += ' WHERE ts.scenario_type = $1';
    params.push(type);
  }

  query += ' ORDER BY ts.difficulty ASC, ts.created_at DESC';

  const scenariosResult = await pool.query(query, params);
  
  const scenarios = await Promise.all(
    scenariosResult.rows.map(async (scenario) => {
      const optionsResult = await pool.query(
        'SELECT id, option_text, is_correct, feedback, score FROM scenario_options WHERE scenario_id = $1',
        [scenario.id]
      );
      return {
        ...scenario,
        options: optionsResult.rows
      };
    })
  );

  return NextResponse.json(scenarios);
}
