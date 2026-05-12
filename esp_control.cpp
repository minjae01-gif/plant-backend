#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>

#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);
#define LDR_PIN 34
#define LED_PIN 2

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverName = "http://YOUR_SERVER_IP:5000/sensor";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  pinMode(LED_PIN, OUTPUT);
  dht.begin();

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverName);
    http.addHeader("Content-Type", "application/json");

    float h = dht.readHumidity();
    float t = dht.readTemperature();
    int ldr = analogRead(LDR_PIN);

    String json = "{\"temperature\":" + String(t) + ",\"humidity\":" + String(h) + ",\"light\":" + String(ldr) + "}";
    int httpResponseCode = http.POST(json);
    http.end();
  }
  delay(3000);
}
