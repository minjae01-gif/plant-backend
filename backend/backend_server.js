// --- (상단 import 동일)
import { 
  ThunderboltOutlined, 
  CloudOutlined,
  BulbOutlined,
  DropboxOutlined,
  BulbFilled,
  ExperimentOutlined,
  SettingOutlined   // ⭐ NEW
} from '@ant-design/icons';

// (기존 코드 동일)

function DashBoard() {
  const [sensorData, setSensorData] = useState({
    temperature: 0,
    humidity: 0,
    soilMoisture: 0,
    lightLevel: 0,
  });

  const [loading, setLoading] = useState(true);

  // ⭐ NEW: 프리셋 설정 데이터를 위한 상태
  const [settings, setSettings] = useState({
    ledOffHour: 22,
    wateringIntervalHours: 6,
    autoWaterEnabled: true,
  });

  const [settingLoading, setSettingLoading] = useState(false);

  // ⭐ NEW: 프리셋 입력값 상태
  const [newSettings, setNewSettings] = useState({
    ledOffHour: 22,
    wateringIntervalHours: 6,
    autoWaterEnabled: true,
  });

  // ⭐ 기존 제어 상태
  const [ledStatus, setLedStatus] = useState(false);
  const [motorStatus, setMotorStatus] = useState(false);
  const [controlLoading, setControlLoading] = useState(false);

  // ========================================
  //    📡 기본 센서 데이터 fetch
  // ========================================
  useEffect(() => {
    fetchSensorData();
    fetchSettings();    // ⭐ NEW: 설정 로딩
    const interval = setInterval(fetchSensorData, 30000);
    return () => clearInterval(interval);
  }, []);

  // ⭐ NEW: 설정 데이터 불러오기
  const fetchSettings = async () => {
    try {
      const res = await sensorAPI.getSettings();
      if (res.data.success) {
        setSettings(res.data.settings);
        setNewSettings(res.data.settings);
      }
    } catch (e) {
      console.error("설정 불러오기 실패", e);
    }
  };

  // ⭐ NEW: 설정 업데이트 함수
  const updateSettings = async () => {
    setSettingLoading(true);
    try {
      const res = await sensorAPI.updateSettings(newSettings);
      if (res.data.success) {
        setSettings(res.data.settings);
        message.success("프리셋 설정이 업데이트되었습니다!");
      }
    } catch (e) {
      message.error("설정 업데이트 실패");
    } finally {
      setSettingLoading(false);
    }
  };

  // ⭐ 기존 코드 하단 유지 (센서, LED, 모터 제어 등 그대로)

  return (
    <Layout>
      <div style={styles.container}>
        <Title level={2}>🌱 실시간 센서 대시보드</Title>
        <Text type="secondary">IoT 센서 데이터 모니터링 & 제어</Text>

        <Row gutter={[24, 24]} style={{ marginTop: '32px' }}>

          {/* ----- 기존 센서 카드들 (그대로 유지) ----- */}

          {/* ⭐ 기존 LED 카드 그대로 유지 */}
          {/* ⭐ 기존 펌프 카드 그대로 유지 */}

          {/* ========================================================= */}
          {/* ⭐ NEW: 프리셋 설정 카드 추가 (기존 기능 유지 + 추가만 됨) */}
          {/* ========================================================= */}
          <Col xs={24} md={12} lg={12}>
            <Card style={styles.presetCard} hoverable>
              <div style={{ textAlign: "center" }}>
                <SettingOutlined style={{ fontSize: "42px", color: "#722ed1" }} />
                <Title level={4} style={{ marginTop: "12px" }}>
                  자동 제어 프리셋 설정
                </Title>
              </div>

              <div style={{ marginTop: "20px" }}>
                <Text strong>💡 LED 자동 꺼짐 시간 (0~23)</Text>
                <input
                  type="number"
                  value={newSettings.ledOffHour}
                  min={0}
                  max={23}
                  onChange={(e) =>
                    setNewSettings({
                      ...newSettings,
                      ledOffHour: Number(e.target.value),
                    })
                  }
                  style={styles.input}
                />

                <Text strong>🚿 물주기 주기 (시간)</Text>
                <input
                  type="number"
                  value={newSettings.wateringIntervalHours}
                  min={1}
                  max={48}
                  onChange={(e) =>
                    setNewSettings({
                      ...newSettings,
                      wateringIntervalHours: Number(e.target.value),
                    })
                  }
                  style={styles.input}
                />

                <Text strong>⚙️ 자동 물주기 활성화</Text>
                <div>
                  <Button
                    type={newSettings.autoWaterEnabled ? "primary" : "default"}
                    onClick={() =>
                      setNewSettings({
                        ...newSettings,
                        autoWaterEnabled: !newSettings.autoWaterEnabled,
                      })
                    }
                    style={{ marginTop: "6px" }}
                  >
                    {newSettings.autoWaterEnabled ? "ON" : "OFF"}
                  </Button>
                </div>

                <Button
                  type="primary"
                  size="large"
                  block
                  loading={settingLoading}
                  onClick={updateSettings}
                  style={{ marginTop: "20px" }}
                >
                  적용하기
                </Button>
              </div>
            </Card>
          </Col>

          {/* ----- 기존 상태 요약 카드 유지 ----- */}

        </Row>
      </div>
    </Layout>
  );
}
