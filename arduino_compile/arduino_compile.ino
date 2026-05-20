#include <WiFi.h>
#include <HTTPClient.h>
#include <Adafruit_NeoPixel.h>

// ------------------------------
// 📌 Pin Definitions
// ------------------------------
#define SOIL_PIN A1
#define LIGHT_PIN A7
#define LED_PIN 6
#define LED_COUNT 12
#define MOTOR_IN1 4
#define MOTOR_PWM 5

// ------------------------------
// 🌐 JetZ 핫스팟 (일반 WPA2-PSK)
// ------------------------------
const char* ssid = "iptime";
const char* password = "kdu1716!";

// ⭐ 핫스팟 사용 시 서버 주소 꼭 수정!
// ipconfig 로 PC의 IPv4 주소 확인
const char* serverName = "http://192.168.0.8:5000/sensor";
const char* commandURL = "http://192.168.0.8:5000/command";

// ------------------------------
// 💡 Neopixel Setup
// ------------------------------
Adafruit_NeoPixel pixels(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);

bool ledEnabled = false;
uint8_t ledR = 0, ledG = 255, ledB = 0;

const int SOIL_DRY_THRESHOLD = 30;
const unsigned long WATER_DURATION_MS = 5000;
const unsigned long WATER_COOLDOWN_MS = 60000;

bool autoWaterEnabled = true;
bool wateringNow = false;
bool manualMotor = false;

unsigned long waterStartTime = 0;
unsigned long lastWaterTime = 0;

// ------------------------------
// 🧠 펌프 제어
// ------------------------------
void startPump() {
  Serial.println("🚿 Pump ON");
  digitalWrite(MOTOR_IN1, HIGH);
  analogWrite(MOTOR_PWM, 220);
}

void stopPump() {
  Serial.println("🛑 Pump OFF");
  digitalWrite(MOTOR_IN1, LOW);
  analogWrite(MOTOR_PWM, 0);
}

// ------------------------------
// 🧠 네오픽셀 색
// ------------------------------
void setRingColor(uint8_t r, uint8_t g, uint8_t b) {
  for (int i = 0; i < LED_COUNT; i++) {
    pixels.setPixelColor(i, pixels.Color(r, g, b));
  }
  pixels.show();
}

// ------------------------------
// 🧠 Setup
// ------------------------------
void setup() {
  Serial.begin(115200);

  pinMode(SOIL_PIN, INPUT);
  pinMode(LIGHT_PIN, INPUT);
  pinMode(MOTOR_IN1, OUTPUT);
  pinMode(MOTOR_PWM, OUTPUT);
  stopPump();

  pixels.begin();
  pixels.clear();
  pixels.setBrightness(100);
  pixels.show();

  // ------------------------------
  // 📶 JetZ 핫스팟 연결
  // ------------------------------
  Serial.println("📶 Connecting to JetZ hotspot...");

  WiFi.disconnect(true);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int retry = 0;
  while (WiFi.status() != WL_CONNECTED && retry < 40) {
    Serial.print(".");
    retry++;
    delay(500);
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Connected!");
    Serial.print("📡 IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ WiFi Connection Failed!");
  }
}

// ------------------------------
// 🔁 Loop
// ------------------------------
void loop() {
  unsigned long now = millis();

  int soilRaw = analogRead(SOIL_PIN);
  int lightRaw = analogRead(LIGHT_PIN);

  int soilPercent = map(soilRaw, 0, 4095, 100, 0);
  int lightPercent = map(lightRaw, 0, 4095, 0, 100);

  Serial.println("------ SENSOR VALUES ------");
  Serial.print("🌱 Soil: "); Serial.println(soilPercent);
  Serial.print("💡 Light: "); Serial.println(lightPercent);

  uint8_t brightness = map(lightPercent, 0, 100, 255, 50);
  pixels.setBrightness(brightness);

  if (ledEnabled) setRingColor(ledR, ledG, ledB);
  else setRingColor(0, 0, 0);

  // 자동급수
  if (autoWaterEnabled && !manualMotor) {
    if (wateringNow) {
      if (now - waterStartTime >= WATER_DURATION_MS) {
        stopPump();
        wateringNow = false;
        lastWaterTime = now;
      }
    } else if (soilPercent < SOIL_DRY_THRESHOLD && (now - lastWaterTime >= WATER_COOLDOWN_MS)) {
      Serial.println("⚠ Soil dry → auto watering");
      startPump();
      wateringNow = true;
      waterStartTime = now;
    }
  }

  // 서버로 데이터 전송
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverName);
    http.addHeader("Content-Type", "application/json");

    String json = "{\"soil\":" + String(soilPercent) +
                  ",\"light\":" + String(lightPercent) + "}";

    Serial.println("📦 Sending JSON: " + json);
    int code = http.POST(json);
    Serial.print("HTTP Response: "); Serial.println(code);
    http.end();
  }

  // 서버 명령 처리
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient cmd;
    cmd.begin(commandURL);
    int code = cmd.GET();

    if (code == 200) {
      String res = cmd.getString();
      Serial.println("📥 Command: " + res);

      if (res.indexOf("led_on") != -1) ledEnabled = true;
      if (res.indexOf("led_off") != -1) ledEnabled = false;
      if (res.indexOf("motor_on") != -1) { manualMotor = true; startPump(); }
      if (res.indexOf("motor_off") != -1) { manualMotor = false; if (!wateringNow) stopPump(); }
    }
    cmd.end();
  }

  delay(3000);
}
