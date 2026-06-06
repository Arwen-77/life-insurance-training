import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export async function GET(request, { params }) {
  const { id } = params;
  
  const result = await pool.query('SELECT * FROM questions WHERE id = $1', [id]);
  
  if (result.rows.length === 0) {
    return NextResponse.json({ error: '题目不存在' }, { status: 404 });
  }

  const question = result.rows[0];
  return NextResponse.json({
    ...question,
    options: JSON.parse(question.options)
  });
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { question, options, answer, explanation, category, difficulty } = body;

    const result = await pool.query(
      'UPDATE questions SET question = $1, options = $2, answer = $3, explanation = $4, category = $5, difficulty = $6 WHERE id = $7 RETURNING *',
      [question, JSON.stringify(options), answer, explanation, category, difficulty, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: '题目不存在' }, { status: 404 });
    }

    const updatedQuestion = result.rows[0];
    return NextResponse.json({
      ...updatedQuestion,
      options: JSON.parse(updatedQuestion.options)
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = params;
  
  const result = await pool.query('DELETE FROM questions WHERE id = $1 RETURNING *', [id]);
  
  if (result.rows.length === 0) {
    return NextResponse.json({ error: '题目不存在' }, { status: 404 });
  }

  return NextResponse.json({ message: '题目删除成功' });
}
