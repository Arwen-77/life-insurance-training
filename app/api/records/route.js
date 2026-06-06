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

  // 获取答题统计
  const statsResult = await pool.query(
    `SELECT 
      COUNT(*) as total_answers,
      SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_answers,
      ROUND(SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as accuracy
     FROM answer_records 
     WHERE user_id = $1`,
    [userId]
  );

  const stats = statsResult.rows[0];

  // 获取最近答题记录
  const recordsResult = await pool.query(
    `SELECT 
      ar.id,
      ar.question_id,
      ar.user_answer,
      ar.is_correct,
      ar.created_at,
      q.question,
      q.options,
      q.answer as correct_answer,
      q.category
     FROM answer_records ar
     JOIN questions q ON ar.question_id = q.id
     WHERE ar.user_id = $1
     ORDER BY ar.created_at DESC
     LIMIT 50`,
    [userId]
  );

  const records = recordsResult.rows.map(r => ({
    ...r,
    options: JSON.parse(r.options)
  }));

  return NextResponse.json({
    stats: stats || { total_answers: 0, correct_answers: 0, accuracy: 0 },
    records
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, questionId, userAnswer, isCorrect } = body;

    if (!userId || !questionId || userAnswer === undefined || isCorrect === undefined) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
    }

    await pool.query(
      'INSERT INTO answer_records (user_id, question_id, user_answer, is_correct) VALUES ($1, $2, $3, $4)',
      [userId, questionId, userAnswer, isCorrect ? 1 : 0]
    );

    return NextResponse.json({ 
      message: '答题记录保存成功'
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '请求体解析失败' }, { status: 400 });
  }
}
