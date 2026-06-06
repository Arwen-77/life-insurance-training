'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Radio, Progress, Result, Space, Tag, Typography } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ArrowRightOutlined, ReloadOutlined, BookOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Paragraph } = Typography;

const difficultyLabels = {
  1: { text: '简单', color: 'green' },
  2: { text: '中等', color: 'orange' },
  3: { text: '困难', color: 'red' }
};

export default function QuizPage() {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/questions')
      .then(res => res.json())
      .then(data => {
        setQuestions(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // 检查是否有 token
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    // 从 token 中解码用户ID
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      setUserId(decoded.id);
    } catch {
      router.push('/');
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOutlined className="text-6xl text-blue-600 mb-4" />
          <Title level={2}>加载题目中...</Title>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Result
          status="warning"
          title="暂无题目"
          subTitle="题库中还没有题目，请先添加"
          extra={
            <Button type="primary" onClick={() => router.push('/dashboard')}>
              返回仪表盘
            </Button>
          }
        />
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const correctCount = Object.keys(answers).filter(key => answers[key] === questions[key].answer).length;

  const handleSelectAnswer = (index) => {
    setSelectedAnswer(index);
  };

  const handleSubmit = async () => {
    if (selectedAnswer === null) return;
    
    const currentQuestion = questions[currentIndex];
    const isCorrect = selectedAnswer === currentQuestion.answer;
    
    setAnswers(prev => ({ ...prev, [currentIndex]: selectedAnswer }));
    setShowResult(true);

    // 保存答题记录
    if (userId) {
      try {
        await fetch('/api/records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            questionId: currentQuestion.id,
            userAnswer: selectedAnswer,
            isCorrect
          })
        });
      } catch (error) {
        console.error('保存答题记录失败:', error);
      }
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setAnswers({});
  };

  const isCorrect = selectedAnswer === currentQuestion.answer;

  if (showResult && currentIndex === questions.length - 1) {
    const score = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <Card className="w-full max-w-md shadow-2xl">
          <Result
            status={score >= 60 ? 'success' : 'warning'}
            title={score >= 60 ? '恭喜完成！' : '继续加油！'}
            subTitle={`您答对了 ${correctCount} / ${questions.length} 道题目，得分：${score}分`}
            icon={score >= 60 ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          />
          <div className="mt-6 text-center">
            <Button type="primary" icon={<ReloadOutlined />} onClick={handleRestart} size="large">
              重新答题
            </Button>
            <Button icon={<BookOutlined />} onClick={() => router.push('/dashboard')} className="ml-4" size="large">
              返回仪表盘
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-3xl mx-auto">
        {/* 顶部进度条 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span>题目 {currentIndex + 1} / {questions.length}</span>
            <span>已答对: {correctCount} 题</span>
          </div>
          <Progress percent={progress} strokeColor="#3b82f6" />
        </div>

        {/* 题目卡片 */}
        <Card className="shadow-xl">
          {/* 题目头部 */}
          <div className="flex justify-between items-start mb-4">
            <Tag color={difficultyLabels[currentQuestion.difficulty].color}>
              {difficultyLabels[currentQuestion.difficulty].text}
            </Tag>
            <Tag color="blue">{currentQuestion.category}</Tag>
          </div>

          {/* 题目内容 */}
          <Title level={3} className="mb-6">
            {currentQuestion.question}
          </Title>

          {/* 选项 */}
          <Radio.Group
            value={selectedAnswer}
            onChange={(e) => handleSelectAnswer(e.target.value)}
            className="space-y-3"
          >
            {currentQuestion.options.map((option, index) => (
              <Radio
                key={index}
                value={index}
                disabled={showResult}
                className={`text-lg ${
                  showResult
                    ? index === currentQuestion.answer
                      ? 'text-green-600 font-bold'
                      : index === selectedAnswer && !isCorrect
                      ? 'text-red-600'
                      : 'text-gray-400'
                    : ''
                }`}
              >
                <span className="mr-2">{String.fromCharCode(65 + index)}.</span>
                {option}
                {showResult && index === currentQuestion.answer && (
                  <CheckCircleOutlined className="ml-2 text-green-500" />
                )}
                {showResult && index === selectedAnswer && !isCorrect && (
                  <CloseCircleOutlined className="ml-2 text-red-500" />
                )}
              </Radio>
            ))}
          </Radio.Group>

          {/* 答案解析 */}
          {showResult && (
            <div className={`mt-6 p-4 rounded-lg ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center mb-2">
                {isCorrect ? (
                  <CheckCircleOutlined className="text-green-500 mr-2" />
                ) : (
                  <CloseCircleOutlined className="text-red-500 mr-2" />
                )}
                <span className={`font-bold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                  {isCorrect ? '回答正确！' : '回答错误'}
                </span>
              </div>
              {currentQuestion.explanation && (
                <Paragraph className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                  <strong>解析：</strong>{currentQuestion.explanation}
                </Paragraph>
              )}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="mt-8 flex justify-end">
            {!showResult ? (
              <Button
                type="primary"
                onClick={handleSubmit}
                disabled={selectedAnswer === null}
                size="large"
              >
                确认答案
              </Button>
            ) : (
              <Button
                type="primary"
                onClick={handleNext}
                icon={<ArrowRightOutlined />}
                size="large"
              >
                {currentIndex < questions.length - 1 ? '下一题' : '查看成绩'}
              </Button>
            )}
          </div>
        </Card>

        {/* 底部导航 */}
        <div className="mt-6 flex justify-center">
          <Button
            type="default"
            icon={<ReloadOutlined />}
            onClick={handleRestart}
          >
            重新开始
          </Button>
          <Button
            icon={<BookOutlined />}
            onClick={() => router.push('/dashboard')}
            className="ml-4"
          >
            返回仪表盘
          </Button>
        </div>
      </div>
    </div>
  );
}
