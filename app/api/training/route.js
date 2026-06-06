import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database', 'app.db');
const db = new sqlite3.Database(dbPath);

// 获取所有训练场景
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  let sql = `
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
    sql += ' WHERE ts.scenario_type = ?';
    params.push(type);
  }

  sql += ' ORDER BY ts.difficulty ASC, ts.created_at DESC';

  return new Promise((resolve) => {
    db.all(sql, params, (err, scenarios) => {
      if (err) {
        resolve(NextResponse.json({ error: err.message }, { status: 500 }));
      } else {
        // 为每个场景获取选项
        const promises = scenarios.map((scenario) => {
          return new Promise((res) => {
            db.all(
              'SELECT id, option_text, is_correct, feedback, score FROM scenario_options WHERE scenario_id = ?',
              [scenario.id],
              (err, options) => {
                if (err) {
                  res({ ...scenario, options: [] });
                } else {
                  res({ ...scenario, options });
                }
              }
            );
          });
        });

        Promise.all(promises).then((results) => {
          resolve(NextResponse.json(results));
        });
      }
    });
  });
}
