const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const dbPath = path.join(__dirname, 'app.db');

// 创建数据库连接
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
    process.exit(1);
  } else {
    console.log('已连接到 SQLite 数据库');
    initializeTables();
  }
});

// 初始化数据库表
function initializeTables() {
  // 创建用户表
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('创建用户表失败:', err.message);
    } else {
      console.log('用户表初始化成功');
    }
  });

  // 创建会话表（用于存储 token 黑名单等）
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('创建会话表失败:', err.message);
    } else {
      console.log('会话表初始化成功');
      createQuestionsTable();
    }
  });
}

// 创建题目表
function createQuestionsTable() {
  db.run(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      options TEXT NOT NULL,
      answer INTEGER NOT NULL,
      explanation TEXT,
      category TEXT DEFAULT '综合',
      difficulty INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('创建题目表失败:', err.message);
      db.close();
    } else {
      console.log('题目表初始化成功');
      insertSampleQuestions();
    }
  });
}

// 插入示例题目
function insertSampleQuestions() {
  const sampleQuestions = [
    {
      question: 'JavaScript 中，以下哪个方法可以将数组转换为字符串？',
      options: JSON.stringify(['toString()', 'toArray()', 'convert()', 'stringify()']),
      answer: 0,
      explanation: 'toString() 方法可以将数组转换为以逗号分隔的字符串。',
      category: 'JavaScript',
      difficulty: 1
    },
    {
      question: 'CSS 中，以下哪个属性用于设置元素的背景颜色？',
      options: JSON.stringify(['color', 'background-color', 'bg-color', 'bgColor']),
      answer: 1,
      explanation: 'background-color 属性用于设置元素的背景颜色。',
      category: 'CSS',
      difficulty: 1
    },
    {
      question: 'React 中，以下哪个 Hook 用于管理组件状态？',
      options: JSON.stringify(['useEffect', 'useState', 'useContext', 'useReducer']),
      answer: 1,
      explanation: 'useState 是 React 中最基本的状态管理 Hook。',
      category: 'React',
      difficulty: 1
    },
    {
      question: '以下哪个 HTTP 状态码表示请求成功？',
      options: JSON.stringify(['404', '500', '200', '301']),
      answer: 2,
      explanation: 'HTTP 200 表示请求成功。',
      category: '网络',
      difficulty: 1
    },
    {
      question: '在 SQL 中，用于查询数据的关键字是？',
      options: JSON.stringify(['UPDATE', 'INSERT', 'SELECT', 'DELETE']),
      answer: 2,
      explanation: 'SELECT 关键字用于从数据库表中查询数据。',
      category: '数据库',
      difficulty: 1
    },
    {
      question: 'JavaScript 中，let 和 var 的主要区别是什么？',
      options: JSON.stringify(['let 是新语法', 'let 有块级作用域', 'let 更快', 'let 可以重复声明']),
      answer: 1,
      explanation: 'let 声明的变量具有块级作用域，而 var 声明的变量具有函数作用域。',
      category: 'JavaScript',
      difficulty: 2
    },
    {
      question: '以下哪个不是 ES6 的新特性？',
      options: JSON.stringify(['箭头函数', 'Promise', 'var 声明', '解构赋值']),
      answer: 2,
      explanation: 'var 是 ES5 及之前就存在的声明方式，不是 ES6 新特性。',
      category: 'JavaScript',
      difficulty: 2
    },
    {
      question: 'CSS Flexbox 中，justify-content: center 的作用是？',
      options: JSON.stringify(['垂直居中', '水平居中', '两端对齐', '均匀分布']),
      answer: 1,
      explanation: 'justify-content: center 使主轴方向上的元素居中对齐。',
      category: 'CSS',
      difficulty: 2
    },
    {
      question: 'React 中，key 属性的主要作用是什么？',
      options: JSON.stringify(['样式设置', '帮助 React 识别列表项的变化', '数据传递', '事件绑定']),
      answer: 1,
      explanation: 'key 属性帮助 React 识别哪些元素改变了、添加了或删除了，提高渲染性能。',
      category: 'React',
      difficulty: 2
    },
    {
      question: 'RESTful API 中，删除资源应该使用哪个 HTTP 方法？',
      options: JSON.stringify(['GET', 'POST', 'PUT', 'DELETE']),
      answer: 3,
      explanation: 'DELETE 方法用于删除指定的资源。',
      category: '网络',
      difficulty: 1
    }
  ];

  let count = 0;
  sampleQuestions.forEach((q) => {
    db.run(
      'INSERT OR IGNORE INTO questions (question, options, answer, explanation, category, difficulty) VALUES (?, ?, ?, ?, ?, ?)',
      [q.question, q.options, q.answer, q.explanation, q.category, q.difficulty],
      (err) => {
        count++;
        if (err && err.code !== 'SQLITE_CONSTRAINT') {
          console.error('插入题目失败:', err.message);
        }
        if (count === sampleQuestions.length) {
          console.log('示例题目插入成功');
          createAnswerRecordsTable();
        }
      }
    );
  });
}

// 创建答题记录表
function createAnswerRecordsTable() {
  db.run(`
    CREATE TABLE IF NOT EXISTS answer_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      user_answer INTEGER NOT NULL,
      is_correct INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (question_id) REFERENCES questions(id)
    )
  `, (err) => {
    if (err) {
      console.error('创建答题记录表失败:', err.message);
      db.close();
    } else {
      console.log('答题记录表初始化成功');
      createTrainingScenariosTable();
    }
  });
}

// 创建训练场景表
function createTrainingScenariosTable() {
  db.run(`
    CREATE TABLE IF NOT EXISTS training_scenarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      scenario TEXT NOT NULL,
      scenario_type TEXT NOT NULL,
      difficulty INTEGER DEFAULT 1,
      tips TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('创建训练场景表失败:', err.message);
      db.close();
    } else {
      console.log('训练场景表初始化成功');
      createScenarioOptionsTable();
    }
  });
}

// 创建场景选项表
function createScenarioOptionsTable() {
  db.run(`
    CREATE TABLE IF NOT EXISTS scenario_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scenario_id INTEGER NOT NULL,
      option_text TEXT NOT NULL,
      is_correct INTEGER NOT NULL,
      feedback TEXT,
      score INTEGER DEFAULT 0,
      FOREIGN KEY (scenario_id) REFERENCES training_scenarios(id)
    )
  `, (err) => {
    if (err) {
      console.error('创建场景选项表失败:', err.message);
      db.close();
    } else {
      console.log('场景选项表初始化成功');
      createTrainingRecordsTable();
    }
  });
}

// 创建训练记录表
function createTrainingRecordsTable() {
  db.run(`
    CREATE TABLE IF NOT EXISTS training_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      scenario_id INTEGER NOT NULL,
      selected_option INTEGER NOT NULL,
      score INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (scenario_id) REFERENCES training_scenarios(id)
    )
  `, (err) => {
    if (err) {
      console.error('创建训练记录表失败:', err.message);
      db.close();
    } else {
      console.log('训练记录表初始化成功');
      insertTrainingScenarios();
    }
  });
}

// 插入训练场景数据
function insertTrainingScenarios() {
  const scenarios = [
    {
      title: '客户说"保险太贵了"',
      scenario: '客户是一位35岁的白领，月收入15000元，有房贷和孩子。当你推荐重疾险时，他说："保险太贵了，我买不起。"',
      scenario_type: '客户异议处理',
      difficulty: 1,
      tips: '要理解客户的真实顾虑，用专业的方式展示保险的价值和必要性。',
      options: [
        {
          option_text: '您说得对，确实不便宜。但我们可以根据您的预算调整方案，先保障最关键的风险。',
          is_correct: 1,
          feedback: '很好！这个回答既认同了客户的感受，又提出了建设性的解决方案。',
          score: 90
        },
        {
          option_text: '不贵啊，一天也就几十块钱，少喝两杯咖啡就有了。',
          is_correct: 0,
          feedback: '这种说法可能会让客户觉得你不理解他的经济压力，容易引起反感。',
          score: 30
        },
        {
          option_text: '那您觉得多少钱合适呢？我们可以调整保额。',
          is_correct: 1,
          feedback: '不错！通过询问客户的预算，可以更好地为其定制方案。',
          score: 75
        },
        {
          option_text: '您有房贷和孩子，万一出事了，谁来还房贷？谁来养孩子？',
          is_correct: 0,
          feedback: '虽然说的是事实，但语气过于直接，可能会让客户感到被威胁。',
          score: 40
        }
      ]
    },
    {
      title: '客户说"我再考虑考虑"',
      scenario: '你详细介绍了产品后，客户说："我再考虑考虑，过几天给你答复。"',
      scenario_type: '成交技巧',
      difficulty: 2,
      tips: '要了解客户犹豫的真实原因，并提供有价值的信息帮助决策。',
      options: [
        {
          option_text: '好的，您慢慢考虑。有需要随时联系我。',
          is_correct: 0,
          feedback: '这样回答太被动，可能会失去成交机会。',
          score: 40
        },
        {
          option_text: '我理解您的谨慎。您主要考虑哪方面呢？是保障范围、保费还是其他？我可以帮您详细分析。',
          is_correct: 1,
          feedback: '非常好！通过开放式问题了解客户顾虑，展现专业性和服务意识。',
          score: 95
        },
        {
          option_text: '现在投保有优惠活动，过了这个月就没了。',
          is_correct: 0,
          feedback: '用促销手段施压可能会让客户觉得你在推销，而不是为他着想。',
          score: 35
        },
        {
          option_text: '那您先考虑，我下周再联系您。',
          is_correct: 1,
          feedback: '可以接受，但缺少主动了解客户顾虑的步骤。',
          score: 60
        }
      ]
    },
    {
      title: '重疾险产品介绍',
      scenario: '客户是一位40岁的企业主，想了解重疾险。请向他介绍重疾险的核心价值。',
      scenario_type: '产品介绍',
      difficulty: 2,
      tips: '要用通俗易懂的语言，结合客户实际情况，突出产品的核心价值。',
      options: [
        {
          option_text: '重疾险就是确诊重大疾病后，保险公司一次性赔付一笔钱，您可以自由支配，用于治疗、康复或弥补收入损失。',
          is_correct: 1,
          feedback: '很好！简洁明了地说明了重疾险的核心功能和资金使用灵活性。',
          score: 85
        },
        {
          option_text: '重疾险包含100种重大疾病，保额最高可达100万，等待期90天，保障终身。',
          is_correct: 0,
          feedback: '虽然信息准确，但过于技术化，没有突出对客户的价值。',
          score: 50
        },
        {
          option_text: '作为企业主，您是家庭的经济支柱。一旦生病，不仅治疗需要钱，企业运营也会受影响。重疾险可以给您一笔现金流，让您安心养病。',
          is_correct: 1,
          feedback: '非常好！结合客户身份和实际情况，生动地说明了保险的必要性。',
          score: 95
        },
        {
          option_text: '重疾险是必备保险，现在环境污染严重，得大病的人越来越多，一定要买。',
          is_correct: 0,
          feedback: '用恐吓的方式推销，可能会让客户反感。',
          score: 30
        }
      ]
    },
    {
      title: '客户需求分析',
      scenario: '客户是一位28岁的单身女性，刚工作几年，想买保险但不知道买什么。请帮她分析需求。',
      scenario_type: '需求分析',
      difficulty: 1,
      tips: '要通过提问了解客户的具体情况，包括收入、负债、家庭责任等。',
      options: [
        {
          option_text: '您单身，没有家庭负担，建议先买意外险和医疗险，保费便宜保障高。',
          is_correct: 0,
          feedback: '虽然建议合理，但没有充分了解客户情况就下结论。',
          score: 55
        },
        {
          option_text: '请问您目前的收入情况如何？有没有负债？父母是否需要您赡养？未来有什么规划？',
          is_correct: 1,
          feedback: '非常好！通过系统性的提问全面了解客户情况，体现专业性。',
          score: 95
        },
        {
          option_text: '年轻人建议买重疾险，现在买保费便宜，以后年龄大了就贵了。',
          is_correct: 0,
          feedback: '虽然说的是事实，但没有了解客户的具体需求和预算。',
          score: 45
        },
        {
          option_text: '您最担心什么风险？是意外、疾病还是其他？我们可以针对性地配置保障。',
          is_correct: 1,
          feedback: '不错！从客户关心的风险出发，引导需求分析。',
          score: 85
        }
      ]
    },
    {
      title: '客户说"我有社保了"',
      scenario: '客户说："我有社保了，不需要商业保险。"',
      scenario_type: '客户异议处理',
      difficulty: 2,
      tips: '要客观分析社保和商业保险的区别，用事实说话，不要贬低社保。',
      options: [
        {
          option_text: '社保是基础保障，但有起付线、封顶线和报销比例限制。商业保险可以补充这些不足，给您更全面的保障。',
          is_correct: 1,
          feedback: '很好！客观地说明了社保和商保的关系，强调互补性。',
          score: 90
        },
        {
          option_text: '社保报销太少了，根本不够用，必须买商业保险。',
          is_correct: 0,
          feedback: '贬低社保可能会让客户觉得你不专业或有偏见。',
          score: 35
        },
        {
          option_text: '社保只报销医疗费用，如果生病不能工作，收入损失怎么办？重疾险可以弥补这部分损失。',
          is_correct: 1,
          feedback: '非常好！指出了社保的保障缺口，用具体场景说明商业保险的价值。',
          score: 95
        },
        {
          option_text: '您说得对，社保确实很重要。但您知道社保有哪些限制吗？我给您详细说说。',
          is_correct: 1,
          feedback: '不错！先认同客户，再引导了解详情。',
          score: 80
        }
      ]
    }
  ];

  let scenarioCount = 0;
  scenarios.forEach((scenario) => {
    db.run(
      'INSERT INTO training_scenarios (title, scenario, scenario_type, difficulty, tips) VALUES (?, ?, ?, ?, ?)',
      [scenario.title, scenario.scenario, scenario.scenario_type, scenario.difficulty, scenario.tips],
      function(err) {
        if (err) {
          console.error('插入训练场景失败:', err.message);
          return;
        }

        const scenarioId = this.lastID;
        let optionCount = 0;

        scenario.options.forEach((option) => {
          db.run(
            'INSERT INTO scenario_options (scenario_id, option_text, is_correct, feedback, score) VALUES (?, ?, ?, ?, ?)',
            [scenarioId, option.option_text, option.is_correct, option.feedback, option.score],
            (err) => {
              if (err) {
                console.error('插入场景选项失败:', err.message);
              }
              optionCount++;
              if (optionCount === scenario.options.length) {
                scenarioCount++;
                if (scenarioCount === scenarios.length) {
                  console.log('训练场景数据插入成功');
                  db.close((err) => {
                    if (err) {
                      console.error('关闭数据库失败:', err.message);
                    } else {
                      console.log('数据库初始化完成');
                    }
                  });
                }
              }
            }
          );
        });
      }
    );
  });
}
