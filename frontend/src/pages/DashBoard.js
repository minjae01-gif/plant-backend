import React, { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, Typography, Tag, Space, Button, message, InputNumber, Switch, Select, Divider } from 'antd';
import {
  ThunderboltOutlined,
  CloudOutlined,
  BulbOutlined,
  DropboxOutlined,
  BulbFilled,
  ExperimentOutlined,
  SettingOutlined
} from '@ant-design/icons';

import { sensorAPI } from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

/* =========================================================
   ⭐ 커스텀 반원형 게이지
========================================================= */
const CustomGauge = ({ value, max, title, icon, unit, levels }) => {
  const percentage = (value / max) * 100;

  const currentLevel = levels.find(level =>
    percentage >= level.min && percentage <= level.max
  );

  return (
    <div style={{ width: "100%" }}>
      <div style={{ textAlign: "center", marginBottom: "16px" }}>
        {icon}
        <Title level={4} style={{ margin: "8px 0" }}>{title}</Title>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg width="300" height="180" viewBox="0 0 300 180">

          {/* 배경 단계 */}
          {levels.map((level, index) => {
            const startAngle = 180 + (level.min * 1.8);
            const endAngle = 180 + (level.max * 1.8);
            const radius = 120;
            const cx = 150, cy = 150;

            const x1 = cx + radius * Math.cos(startAngle * Math.PI / 180);
            const y1 = cy + radius * Math.sin(startAngle * Math.PI / 180);
            const x2 = cx + radius * Math.cos(endAngle * Math.PI / 180);
            const y2 = cy + radius * Math.sin(endAngle * Math.PI / 180);

            return (
              <path
                key={index}
                d={`M ${x1} ${y1} A 120 120 0 0 1 ${x2} ${y2}`}
                fill="none"
                stroke={level.color}
                strokeWidth="25"
                opacity="0.3"
                strokeLinecap="round"
              />
            );
          })}

          {/* 현재 값 아크 */}
          {(() => {
            const angle = 180 + percentage * 1.8;
            const cx = 150, cy = 150;
            const radius = 120;

            const x1 = cx - radius;
            const y1 = cy;
            const x2 = cx + radius * Math.cos(angle * Math.PI / 180);
            const y2 = cy + radius * Math.sin(angle * Math.PI / 180);

            return (
              <path
                d={`M ${x1} ${y1} A 120 120 0 0 1 ${x2} ${y2}`}
                fill="none"
                stroke={currentLevel?.color || '#52c41a'}
                strokeWidth="25"
                strokeLinecap="round"
              />
            );
          })()}

          {/* 바늘 */}
          {(() => {
            const angle = 180 + percentage * 1.8;
            const cx = 150, cy = 150;
            const needleLength = 100;

            const x = cx + needleLength * Math.cos(angle * Math.PI / 180);
            const y = cy + needleLength * Math.sin(angle * Math.PI / 180);

            return (
              <g>
                <circle cx={cx} cy={cy} r="8" fill="#555" />
                <line
                  x1={cx}
                  y1={cy}
                  x2={x}
                  y2={y}
                  stroke="#555"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </g>
            );
          })()}

          {/* 숫자 */}
          <text x="150" y="120" textAnchor="middle" style={{ fontSize: 42, fontWeight: "bold", fill: currentLevel?.color }}>
            {value}
          </text>
          <text x="150" y="165" textAnchor="middle" style={{ fontSize: 16, fill: "#888" }}>
            {unit}
          </text>
        </svg>
      </div>

      {/* 상태 Tag */}
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <Tag color={currentLevel?.color} style={{ fontSize: 16, padding: "8px 20px" }}>
          {currentLevel?.label}
        </Tag>
      </div>
    </div>
  );
};

/* =========================================================
   ⭐ Dashboard 메인 페이지
========================================================= */
function DashBoard() {
  const [sensorData, setSensorData] = useState({
    temperature: 0,
    humidity: 0,
    soilMoisture: 0,
    lightLevel: 0,
  });

  const [loading, setLoading] = useState(true);
  const [ledStatus, setLedStatus] = useState(false);
  const [motorStatus, setMotorStatus] = useState(false);
  const [controlLoading, setControlLoading] = useState(false);

  // ⭐ 식물 데이터
  const [speciesList, setSpeciesList] = useState([]);
  const [selectedSpeciesId, setSelectedSpeciesId] = useState(null);

  const selectedSpecies = useMemo(
    () => speciesList.find(s => s.id === selectedSpeciesId),
    [speciesList, selectedSpeciesId]
  );

  // ⭐ 새 설정 상태 (백엔드에 ledOnHoursPerDay 추가됨)
  const [settings, setSettings] = useState({
    ledOffHour: 22,
    ledOnHoursPerDay: 8,            // ✅ 새로 추가
    wateringIntervalHours: 6,
    autoWaterEnabled: true
  });

  /* ---------------------- 데이터 가져오기 ---------------------- */
  useEffect(() => {
    fetchSensorData();
    fetchSettings();
    fetchSpecies();

    const interval = setInterval(fetchSensorData, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchSensorData = async () => {
    try {
      const res = await sensorAPI.getLatestData();
      if (res.data.success && res.data.data) {
      setSensorData(res.data.data);
    }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await sensorAPI.getSettings();
      if (res.data.success) {
        // 서버 settings에 ledOnHoursPerDay가 없을 수도 있으니 기본값 보정
        setSettings(prev => ({
          ...prev,
          ...(res.data.settings || {}),
          ledOnHoursPerDay: res.data.settings?.ledOnHoursPerDay ?? prev.ledOnHoursPerDay
        }));
      }
    } catch (e) {
      console.error("⚠ 설정 불러오기 실패", e);
    }
  };

  const fetchSpecies = async () => {
    try {
      const res = await sensorAPI.getSpecies();
      // backend에서 res.json(species)로 배열 반환 중
      setSpeciesList(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("⚠ 식물 데이터 불러오기 실패", e);
      message.error("식물 데이터셋을 불러오지 못했습니다. 서버 /api/species 확인!");
    }
  };

  /* ---------------------- 식물 프리셋 적용 ---------------------- */
  const applyPlantPreset = () => {
    if (!selectedSpecies) {
      message.warning("먼저 식물을 선택하세요!");
      return;
    }

    const wateringIntervalHours = Math.max(1, (selectedSpecies.water_cycle_days || 1) * 24);
    const ledOnHoursPerDay = Math.min(24, Math.max(0, selectedSpecies.light_hours_per_day || 8));

    setSettings(prev => ({
      ...prev,
      wateringIntervalHours,
      ledOnHoursPerDay
    }));

    message.success(`🌿 ${selectedSpecies.name} 추천 설정이 적용되었습니다!`);
  };

  /* ---------------------- LED 제어 ---------------------- */
  const handleLedControl = async () => {
    setControlLoading(true);
    try {
      const command = ledStatus ? "led_off" : "led_on";
      const res = await sensorAPI.sendCommand(command);

      if (res.data.success) {
        setLedStatus(!ledStatus);
        message.success(ledStatus ? "LED 꺼짐" : "LED 켜짐");
      }
    } catch {
      message.error("LED 제어 실패");
    } finally {
      setControlLoading(false);
    }
  };

  /* ---------------------- 펌프 제어 ---------------------- */
  const handleMotorControl = async () => {
    setControlLoading(true);

    try {
      const command = motorStatus ? "motor_off" : "motor_on";
      const res = await sensorAPI.sendCommand(command);

      if (res.data.success) {
        setMotorStatus(!motorStatus);
        message.success(motorStatus ? "펌프 OFF" : "펌프 ON");
      }
    } catch {
      message.error("펌프 제어 실패");
    } finally {
      setControlLoading(false);
    }
  };

  /* ---------------------- 설정 업데이트 ---------------------- */
  const updateSettings = async () => {
    try {
      const res = await sensorAPI.updateSettings(settings);
      if (res.data.success) {
        message.success("설정이 저장되었습니다!");
      } else {
        message.error("설정 저장 실패(서버 응답 실패)");
      }
    } catch (e) {
      console.error(e);
      message.error("설정 저장 실패");
    }
  };

  /* =========================================================
      게이지 단계 색상 설정
  ========================================================= */
  const soilLevels = [
    { min: 0, max: 29, color: "#ff4d4f", label: "건조함" },
    { min: 30, max: 59, color: "#faad14", label: "적당함" },
    { min: 60, max: 100, color: "#52c41a", label: "습함" },
  ];

  const lightLevels = [
    { min: 70, max: 100, color: "#8c8c8c", label: "어두움", range: "7~10" },
    { min: 30, max: 60, color: "#faad14", label: "적당함", range: "3~6" },
    { min: 0, max: 20, color: "#52c41a", label: "밝음", range: "0~2" },
  ];

  /* =========================================================
      UI 렌더링
  ========================================================= */
  return (
    
      <div style={{ padding: 24 }}>
        <Title level={2}>🌱 실시간 센서 대시보드</Title>

        <Row gutter={[24, 24]} style={{ marginTop: 32 }}>

          {/* ⭐ 토양습도 게이지 */}
          <Col xs={24} md={12}>
            <Card loading={loading} style={{ borderRadius: 16 }} hoverable>
              <CustomGauge
                value={sensorData.soilMoisture}
                max={100}
                title="토양습도"
                icon={<DropboxOutlined style={{ fontSize: 24, color: "#52c41a" }} />}
                unit="%"
                levels={soilLevels}
              />
            </Card>
          </Col>

          {/* ⭐ 조도 게이지 */}
          <Col xs={24} md={12}>
            <Card loading={loading} style={{ borderRadius: 16 }} hoverable>
              <CustomGauge
                value={sensorData.lightLevel}
                max={10}
                title="조도"
                icon={<BulbOutlined style={{ fontSize: 24, color: "#faad14" }} />}
                unit="/ 10"
                levels={lightLevels}
              />
            </Card>
          </Col>

          {/* ⭐ 온도 */}
          <Col xs={12} md={6}>
            <Card loading={loading} style={{ borderRadius: 16 }} hoverable>
              <div style={{ textAlign: "center", padding: 20 }}>
                <ThunderboltOutlined style={{ fontSize: 32, color: "#ff4d4f" }} />
                <Title level={3}>{sensorData.temperature}°C</Title>
                <Text type="secondary">온도</Text>
              </div>
            </Card>
          </Col>

          {/* ⭐ 습도 */}
          <Col xs={12} md={6}>
            <Card loading={loading} style={{ borderRadius: 16 }} hoverable>
              <div style={{ textAlign: "center", padding: 20 }}>
                <CloudOutlined style={{ fontSize: 32, color: "#1890ff" }} />
                <Title level={3}>{sensorData.humidity}%</Title>
                <Text type="secondary">습도</Text>
              </div>
            </Card>
          </Col>

          {/* ⭐ LED 제어 */}
          <Col xs={12} md={6}>
            <Card style={{ borderRadius: 16 }} hoverable>
              <div style={{ textAlign: "center", padding: 24 }}>
                <BulbFilled style={{ fontSize: 48, color: ledStatus ? "#faad14" : "#ccc" }} />
                <Title level={4}>LED 조명</Title>

                <Tag color={ledStatus ? "gold" : "default"}>{ledStatus ? "켜짐" : "꺼짐"}</Tag>

                <Button
                  type="primary"
                  block
                  loading={controlLoading}
                  onClick={handleLedControl}
                  style={{ marginTop: 12 }}
                >
                  {ledStatus ? "LED 끄기" : "LED 켜기"}
                </Button>
              </div>
            </Card>
          </Col>

          {/* ⭐ 펌프 제어 */}
          <Col xs={12} md={6}>
            <Card style={{ borderRadius: 16 }} hoverable>
              <div style={{ textAlign: "center", padding: 24 }}>
                <ExperimentOutlined style={{ fontSize: 48, color: motorStatus ? "#1890ff" : "#ccc" }} />
                <Title level={4}>워터펌프</Title>

                <Tag color={motorStatus ? "blue" : "default"}>{motorStatus ? "작동중" : "정지"}</Tag>

                <Button
                  type="primary"
                  danger={motorStatus}
                  block
                  onClick={handleMotorControl}
                  loading={controlLoading}
                  style={{ marginTop: 12 }}
                >
                  {motorStatus ? "펌프 정지" : "펌프 작동"}
                </Button>
              </div>
            </Card>
          </Col>

          {/* ⭐ 자동 설정 패널 */}
          <Col xs={24} md={12}>
            <Card style={{ borderRadius: 16 }} hoverable>
              <Title level={4}>
                <SettingOutlined /> 자동 제어 설정
              </Title>

              <Space direction="vertical" style={{ width: "100%", marginTop: 16 }}>

                {/* ✅ 식물 프리셋 */}
                <div>
                  <Text strong>🌿 식물 선택(프리셋)</Text>
                  <Select
                    showSearch
                    placeholder="식물을 선택하세요"
                    optionFilterProp="children"
                    style={{ width: "100%", marginTop: 8 }}
                    value={selectedSpeciesId}
                    onChange={(v) => setSelectedSpeciesId(v)}
                    filterOption={(input, option) =>
                      (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {speciesList.map((plant) => (
                      <Option key={plant.id} value={plant.id}>
                        {plant.name}
                      </Option>
                    ))}
                  </Select>

                  <Space style={{ marginTop: 12, width: "100%" }} direction="vertical">
                    <Button type="dashed" block onClick={applyPlantPreset}>
                      추천 설정 자동 적용
                    </Button>

                    {selectedSpecies && (
                      <div style={{ padding: 12, background: "#fafafa", borderRadius: 12 }}>
                        <Text>
                          <b>{selectedSpecies.name}</b> · 물주기 {selectedSpecies.water_cycle_days}일 · 조명 {selectedSpecies.light_hours_per_day}시간/일
                        </Text>
                      </div>
                    )}
                  </Space>
                </div>

                <Divider style={{ margin: "8px 0" }} />

                {/* LED OFF 시간 */}
                <div>
                  <Text strong>LED 자동 꺼짐 시간 (24h)</Text>
                  <InputNumber
                    min={0}
                    max={23}
                    value={settings.ledOffHour}
                    onChange={(v) => setSettings({ ...settings, ledOffHour: v })}
                    style={{ width: "100%", marginTop: 8 }}
                  />
                </div>

                {/* ✅ LED 하루 켜는 시간 */}
                <div>
                  <Text strong>LED 하루 켜는 시간 (시간/일)</Text>
                  <InputNumber
                    min={0}
                    max={24}
                    value={settings.ledOnHoursPerDay}
                    onChange={(v) => setSettings({ ...settings, ledOnHoursPerDay: v })}
                    style={{ width: "100%", marginTop: 8 }}
                  />
                </div>

                {/* 물주기 간격 */}
                <div>
                  <Text strong>자동 물주기 간격 (시간)</Text>
                  <InputNumber
                    min={1}
                    max={24 * 60} // 최대 60일(원하면 조정)
                    value={settings.wateringIntervalHours}
                    onChange={(v) => setSettings({ ...settings, wateringIntervalHours: v })}
                    style={{ width: "100%", marginTop: 8 }}
                  />
                </div>

                {/* 자동 물주기 on/off */}
                <div>
                  <Text strong>자동 물주기 활성화</Text>
                  <br />
                  <Switch
                    checked={settings.autoWaterEnabled}
                    onChange={(v) => setSettings({ ...settings, autoWaterEnabled: v })}
                    style={{ marginTop: 8 }}
                  />
                </div>

                <Button type="primary" block style={{ marginTop: 16 }} onClick={updateSettings}>
                  설정 저장하기
                </Button>

              </Space>
            </Card>
          </Col>

          {/* ⭐ 상태 요약 */}
          <Col xs={24} md={12}>
            <Card style={{ borderRadius: 16 }}>
              <Title level={4}>상태 요약</Title>

              <div style={{ marginTop: 16 }}>
                {sensorData.soilMoisture < 30 && (
                  <Tag color="red" style={{ marginBottom: 8 }}>
                    ⚠️ 토양 건조: 물이 필요합니다!
                  </Tag>
                )}

                {sensorData.lightLevel < 3 && (
                  <Tag color="orange" style={{ marginBottom: 8 }}>
                    💡 조도가 낮음: 더 밝은 곳이 필요합니다
                  </Tag>
                )}

                {sensorData.soilMoisture >= 30 && sensorData.lightLevel >= 3 && (
                  <Tag color="green" style={{ marginBottom: 8 }}>
                    ✅ 모든 상태 정상!
                  </Tag>
                )}

                <div style={{ marginTop: 16 }}>
                  <Tag color={ledStatus ? "gold" : "default"}>
                    LED: {ledStatus ? "ON" : "OFF"}
                  </Tag>
                  <Tag color={motorStatus ? "blue" : "default"}>
                    펌프: {motorStatus ? "ON" : "OFF"}
                  </Tag>
                </div>

                <div style={{ marginTop: 12 }}>
                  <Tag color="blue">
                    설정: 물주기 {settings.wateringIntervalHours}시간마다 / LED {settings.ledOnHoursPerDay}시간/일 / LED OFF {settings.ledOffHour}시
                  </Tag>
                </div>
              </div>
            </Card>
          </Col>

        </Row>
      </div>
    
  );
}

export default DashBoard;