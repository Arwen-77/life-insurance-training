import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: '缺少用户ID' }, { status: 400 });
  }

  // 获取训练统计
  const statsResult = await pool.query(
    `SELECT 
      COUNT(*) as total_training,
      AVG(score) as avg_score,
      SUM(CASE WHEN score >= 80 THEN 1 ELSE 0 END) as excellent_count
     FROM training_records 
     WHERE user_id = $1`,
    [userId]
  );

  const stats = statsResult.rows[0];

  // 获取最近训练记录
  const recordsResult = await pool.query(
    `SELECT 
      tr.id,
      tr.scenario_id,
      tr.score,
      tr.created_at,
      ts.title,
      ts.scenario_type
     FROM training_records tr
     JOIN training_scenarios ts ON tr.scenario_id = ts.id
     WHERE tr.user_id = $1
     ORDER BY tr.created_at DESC
     LIMIT 20`,
    [userId]
  );

  return NextResponse.json({
    stats: stats || { total_training: 0, avg_score: 0, excellent_count: 0 },
    records: recordsResult.rows
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, scenarioId, selectedOption, score } = body;

    if (!userId || !scenarioId || selectedOption === undefined || score === undefined) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
    }

    await pool.query(
      'INSERT INTO training_records (user_id, scenario_id, selected_option, score) VALUES ($1, $2, $3, $4)',
      [userId, scenarioId, selectedOption, score]
    );

    return NextResponse.json({ 
      message: '训练记录保存成功'
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '请求体解析失败' }, { status: 400 });
  }
}
