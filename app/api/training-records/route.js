import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database', 'app.db');
const db = new sqlite3.Database(dbPath);

// 获取用户训练记录和统计
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: '缺少用户ID' }, { status: 400 });
  }

  return new Promise((resolve) => {
    // 获取训练统计
    db.get(
      `SELECT 
        COUNT(*) as total_training,
        AVG(score) as avg_score,
        SUM(CASE WHEN score >= 80 THEN 1 ELSE 0 END) as excellent_count
       FROM training_records 
       WHERE user_id = ?`,
      [userId],
      (err, stats) => {
        if (err) {
          resolve(NextResponse.json({ error: err.message }, { status: 500 }));
          return;
        }

        // 获取最近训练记录
        db.all(
          `SELECT 
            tr.id,
            tr.scenario_id,
            tr.score,
            tr.created_at,
            ts.title,
            ts.scenario_type
           FROM training_records tr
           JOIN training_scenarios ts ON tr.scenario_id = ts.id
           WHERE tr.user_id = ?
           ORDER BY tr.created_at DESC
           LIMIT 20`,
          [userId],
          (err, records) => {
            if (err) {
              resolve(NextResponse.json({ error: err.message }, { status: 500 }));
            } else {
              resolve(NextResponse.json({
                stats: stats || { total_training: 0, avg_score: 0, excellent_count: 0 },
                records: records || []
              }));
            }
          }
        );
      }
    );
  });
}

// 保存训练记录
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, scenarioId, selectedOption, score } = body;

    if (!userId || !scenarioId || selectedOption === undefined || score === undefined) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
    }

    return new Promise((resolve) => {
      db.run(
        'INSERT INTO training_records (user_id, scenario_id, selected_option, score) VALUES (?, ?, ?, ?)',
        [userId, scenarioId, selectedOption, score],
        function(err) {
          if (err) {
            resolve(NextResponse.json({ error: err.message }, { status: 500 }));
          } else {
            resolve(NextResponse.json({ 
              id: this.lastID,
              message: '训练记录保存成功'
            }, { status: 201 }));
          }
        }
      );
    });
  } catch (error) {
    return NextResponse.json({ error: '请求体解析失败' }, { status: 400 });
  }
}
