'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Radio, Progress, Result, Tag, Typography, Space, Alert, Divider } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ArrowRightOutlined, ReloadOutlined, TrophyOutlined, BulbOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Paragraph, Text } = Typography;

const difficultyLabels = {
  1: { text: '初级', color: 'green' },
  2: { text: '中级', color: 'orange' },
  3: { text: '高级', color: 'red' }
};

const typeColors = {
  '客户异议处理': 'blue',
  '产品介绍': 'purple',
  '需求分析': 'cyan',
  '成交技巧': 'gold',
  '售后服务': 'green'
};

export default function TrainingPage() {
  const [scenarios, setScenarios] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/training')
      .then(res => res.json())
      .then(data => {
        setScenarios(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

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
          <TrophyOutlined className="text-6xl text-blue-600 mb-4" />
          <Title level={2}>加载训练场景中...</Title>
        </div>
      </div>
    );
  }

  if (scenarios.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Result
          status="warning"
          title="暂无训练场景"
          subTitle="训练场景库中还没有场景，请先添加"
          extra={
            <Button type="primary" onClick={() => router.push('/dashboard')}>
              返回仪表盘
            </Button>
          }
        />
      </div>
    );
  }

  const currentScenario = scenarios[currentIndex];
  const progress = ((currentIndex + 1) / scenarios.length) * 100;
  const totalScore = scores.reduce((sum, s) => sum + s, 0);
  const avgScore = scores.length > 0 ? Math.round(totalScore / scores.length) : 0;

  const handleSelectOption = (index) => {
    setSelectedOption(index);
  };

  const handleSubmit = async () => {
    if (selectedOption === null) return;
    
    const option = currentScenario.options[selectedOption];
    setScores([...scores, option.score]);
    setShowFeedback(true);

    // 保存训练记录
    if (userId) {
      try {
        await fetch('/api/training-records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            scenarioId: currentScenario.id,
            selectedOption,
            score: option.score
          })
        });
      } catch (error) {
        console.error('保存训练记录失败:', error);
      }
    }
  };

  const handleNext = () => {
    if (currentIndex < scenarios.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setShowFeedback(false);
    setScores([]);
  };

  if (showFeedback && currentIndex === scenarios.length - 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <Card className="w-full max-w-2xl shadow-2xl">
          <Result
            icon={<TrophyOutlined />}
            title={avgScore >= 80 ? '训练优秀！' : avgScore >= 60 ? '训练良好！' : '继续努力！'}
            subTitle={`平均得分：${avgScore}分 | 完成场景：${scenarios.length}个`}
            extra={[
              <Button type="primary" icon={<ReloadOutlined />} onClick={handleRestart} size="large">
                重新训练
              </Button>,
              <Button icon={<TrophyOutlined />} onClick={() => router.push('/dashboard')} size="large">
                返回仪表盘
              </Button>
            ]}
          />
          <Divider />
          <div className="text-center">
            <Text type="secondary">训练提示：多练习不同场景，提升销售技能！</Text>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* 顶部进度条 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span>场景 {currentIndex + 1} / {scenarios.length}</span>
            <span>平均得分: {avgScore}分</span>
          </div>
          <Progress percent={progress} strokeColor="#3b82f6" />
        </div>

        {/* 场景卡片 */}
        <Card className="shadow-xl mb-6">
          {/* 场景头部 */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <Tag color={typeColors[currentScenario.scenario_type] || 'default'}>
                {currentScenario.scenario_type}
              </Tag>
              <Tag color={difficultyLabels[currentScenario.difficulty].color}>
                {difficultyLabels[currentScenario.difficulty].text}
              </Tag>
            </div>
          </div>

          {/* 场景标题 */}
          <Title level={3}>{currentScenario.title}</Title>
          
          {/* 场景描述 */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <Paragraph className="text-base mb-0">
              <strong>场景描述：</strong>{currentScenario.scenario}
            </Paragraph>
          </div>

          {/* 提示 */}
          {currentScenario.tips && !showFeedback && (
            <Alert
              message="训练提示"
              description={currentScenario.tips}
              type="info"
              icon={<BulbOutlined />}
              showIcon
              className="mb-6"
            />
          )}

          {/* 选项 */}
          <Radio.Group
            value={selectedOption}
            onChange={(e) => handleSelectOption(e.target.value)}
            className="w-full"
            disabled={showFeedback}
          >
            <Space direction="vertical" className="w-full">
              {currentScenario.options.map((option, index) => (
                <Card
                  key={index}
                  hoverable={!showFeedback}
                  className={`cursor-pointer transition-all ${
                    showFeedback
                      ? option.is_correct
                        ? 'border-green-500 bg-green-50'
                        : index === selectedOption && !option.is_correct
                        ? 'border-red-500 bg-red-50'
                        : ''
                      : selectedOption === index
                      ? 'border-blue-500'
                      : ''
                  }`}
                  onClick={() => !showFeedback && handleSelectOption(index)}
                >
                  <Radio value={index} className="w-full">
                    <div className="flex items-start">
                      <span className="mr-2 font-bold">{String.fromCharCode(65 + index)}.</span>
                      <div className="flex-1">
                        <Text>{option.option_text}</Text>
                        {showFeedback && (
                          <div className="mt-2">
                            {option.is_correct ? (
                              <CheckCircleOutlined className="text-green-500 text-lg" />
                            ) : (
                              index === selectedOption && <CloseCircleOutlined className="text-red-500 text-lg" />
                            )}
                            <Text type={option.is_correct ? 'success' : 'danger'} className="ml-2">
                              得分：{option.score}分
                            </Text>
                          </div>
                        )}
                      </div>
                    </div>
                  </Radio>
                </Card>
              ))}
            </Space>
          </Radio.Group>

          {/* 反馈 */}
          {showFeedback && selectedOption !== null && (
            <div className="mt-6">
              <Alert
                message={currentScenario.options[selectedOption].is_correct ? '回答优秀！' : '回答需要改进'}
                description={currentScenario.options[selectedOption].feedback}
                type={currentScenario.options[selectedOption].is_correct ? 'success' : 'warning'}
                showIcon
              />
            </div>
          )}

          {/* 操作按钮 */}
          <div className="mt-8 flex justify-end">
            {!showFeedback ? (
              <Button
                type="primary"
                onClick={handleSubmit}
                disabled={selectedOption === null}
                size="large"
              >
                确认选择
              </Button>
            ) : (
              <Button
                type="primary"
                onClick={handleNext}
                icon={<ArrowRightOutlined />}
                size="large"
              >
                {currentIndex < scenarios.length - 1 ? '下一个场景' : '查看成绩'}
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
            icon={<TrophyOutlined />}
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
