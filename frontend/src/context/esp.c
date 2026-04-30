#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>

// ---------- WiFi ----------

const char* ssid = "Airtel_Rishabh";
const char* password = "Rishabh@2007";

const char* serverName = "https://smart-room-ai-system.onrender.com/api/data";
const char* aiServer = "https://smart-room-ai-system.onrender.com/api/latest-advice";
const char* aiTriggerServer = "https://smart-room-ai-system.onrender.com/api/ai-advice";

// ---------- DHT ----------

#define DHTPIN 4
#define DHTTYPE DHT11

// ---------- MQ135 ----------

#define MQ135_PIN 34

// ---------- MQ135 Calibration ----------

#define RO_CLEAN_AIR 3.6   // RS/Ro ratio in clean air (from datasheet)
float Ro = 10.0;            // Will be auto-calibrated on startup

DHT dht(DHTPIN, DHTTYPE);

// ---------- LCD ----------

LiquidCrystal_I2C lcd(0x27, 16, 2);

// ---------- Pins ----------

#define GREEN_LED 2
#define RED_LED 15
#define BUZZER 5

#define INC_BUTTON 18
#define DEC_BUTTON 19
#define MUTE_BUTTON 23

// ---------- Variables ----------

bool wifiConnected = false;
bool firstConnect = true;

unsigned long lastSendTime = 0;
unsigned long lastAICall = 0;
unsigned long lastSerialSend = 0;
unsigned long displayTimer = 0;
unsigned long lastButtonPress = 0;
unsigned long lastWiFiCheck = 0;

unsigned long aiInterval = 1800000;  // 30 min

bool showAI = false;
bool buzzerMuted = false;

String lastAdvice = "Waiting for AI...";

int limitTemp = 32;

// ⭐ Non-block scroll vars

int scrollIndex = 0;
unsigned long lastScrollTime = 0;

// ---------- Forward Declarations ----------

void checkWiFi();
void sendData(float temp, float hum, int airQuality);
void triggerAIAdvice(float temp, float hum);
void fetchAIAdvice();
void scrollText(String text);

// ---------- MQ135 Helper Functions ----------

// Temperature & humidity correction factor (Aliez et al.)
float getCorrectionFactor(float t, float h) {
  return 0.00035 * t * t - 0.02718 * t + 0.0614 * h - 0.00950 * t * h + 1.39538;
}

// Get sensor resistance from raw ADC (ESP32: 12-bit, 3.3V)
float getRS(int rawADC) {
  float voltage = rawADC * (3.3 / 4095.0);
  if (voltage < 0.01) voltage = 0.01;  // Avoid division by zero
  return (3.3 - voltage) / voltage;
}

// Convert RS to PPM (CO2 equivalent using datasheet curve)
float getPPM(float rs, float temp, float hum) {
  float correctedRs = rs / getCorrectionFactor(temp, hum);
  float ratio = correctedRs / Ro;
  return 116.6020682 * pow(ratio, -2.769034857);
}

// Map PPM to relative AQI (0–300 scale)
int getAQI(float ppm) {
  if (ppm < 400)  return map((int)ppm, 0,    400,  0,   50);
  if (ppm < 1000) return map((int)ppm, 400,  1000, 51,  100);
  if (ppm < 2000) return map((int)ppm, 1000, 2000, 101, 150);
  if (ppm < 5000) return map((int)ppm, 2000, 5000, 151, 200);
  return 300;
}



// ---------- checkWiFi ----------

void checkWiFi() {

  if (millis() - lastWiFiCheck < 360000)
    return;

  lastWiFiCheck = millis();

  if (WiFi.status() == WL_CONNECTED) {

    if (!wifiConnected || firstConnect) {

      wifiConnected = true;
      firstConnect = false;

      lcd.clear();
      lcd.print("WiFi Reconnected");

      delay(1000);

      float temp = dht.readTemperature();
      float hum = dht.readHumidity();

      int rawAQ = analogRead(MQ135_PIN);
      float rs = getRS(rawAQ);
      float ppm = getPPM(rs, temp, hum);
      int airQuality = getAQI(ppm);

      sendData(temp, hum, airQuality);
      triggerAIAdvice(temp, hum);

      delay(2000);

      fetchAIAdvice();

      lastAICall = millis();
    }

  } else {

    if (wifiConnected) {

      wifiConnected = false;

      lcd.clear();
      lcd.print("Local Mode");

      delay(1000);
    }

    WiFi.disconnect();
    WiFi.begin(ssid, password);
  }
}

// ---------- Setup ----------

void setup() {

  Serial.begin(115200);

  pinMode(GREEN_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  pinMode(BUZZER, OUTPUT);

  pinMode(INC_BUTTON, INPUT_PULLUP);
  pinMode(DEC_BUTTON, INPUT_PULLUP);
  pinMode(MUTE_BUTTON, INPUT_PULLUP);

  lcd.init();
  lcd.backlight();

  lcd.print("System Starting");

  dht.begin();

  WiFi.begin(ssid, password);

  lcd.clear();
  lcd.print("Connecting WiFi");

  unsigned long startAttempt = millis();

  while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < 10000) {
    delay(500);
  }

  if (WiFi.status() == WL_CONNECTED) {

    wifiConnected = true;
    firstConnect = false;

    lcd.clear();
    lcd.print("WiFi Connected");

    delay(2000);

  } else {

    lcd.clear();
    lcd.print("Local Mode");

    delay(2000);
  }

  // ---------- Calibrate MQ135 Ro ----------
  // Run for ~5 seconds in fresh air to get baseline resistance

  lcd.clear();
  lcd.print("Calibrating...");
  lcd.setCursor(0, 1);
  lcd.print("Keep air fresh!");

  float rsSum = 0;
  for (int i = 0; i < 50; i++) {
    rsSum += getRS(analogRead(MQ135_PIN));
    delay(100);
  }
  float rsMean = rsSum / 50.0;
  Ro = rsMean / RO_CLEAN_AIR;

  Serial.print("Calibrated Ro: ");
  Serial.println(Ro);

  lcd.clear();
  lcd.print("Ro:");
  lcd.print(Ro, 2);
  lcd.setCursor(0, 1);
  lcd.print("Calibration OK!");
  delay(2000);

  // ---------- Initial sensor read ----------

  float temp = dht.readTemperature();
  float hum = dht.readHumidity();

  int rawAQ = analogRead(MQ135_PIN);
  float rs = getRS(rawAQ);
  float ppm = getPPM(rs, temp, hum);
  int airQuality = getAQI(ppm);

  if (wifiConnected) {

    sendData(temp, hum, airQuality);
    triggerAIAdvice(temp, hum);

    delay(2000);

    fetchAIAdvice();

    lastAICall = millis();
  }

  displayTimer = millis();
}

// ---------- LOOP ----------

void loop() {

  // ---------- WIFI CHECK ----------

  checkWiFi();

  // ---------- BUTTONS ----------

  if (millis() - lastButtonPress > 250) {

    if (digitalRead(INC_BUTTON) == LOW) {
      limitTemp++;
      lastButtonPress = millis();
    }

    if (digitalRead(DEC_BUTTON) == LOW) {
      limitTemp--;
      lastButtonPress = millis();
    }

    if (digitalRead(MUTE_BUTTON) == LOW) {
      buzzerMuted = true;
      digitalWrite(BUZZER, LOW);
      lastButtonPress = millis();
    }
  }

  float temp = dht.readTemperature();
  float hum = dht.readHumidity();

  if (isnan(temp) || isnan(hum))
    return;

  // ---------- MQ135 → AQI ----------

  int rawAQ = analogRead(MQ135_PIN);
  float rs = getRS(rawAQ);
  float ppm = getPPM(rs, temp, hum);
  int airQuality = getAQI(ppm);

  // ---------- SERIAL OUTPUT EVERY 10 SEC ----------

  if (millis() - lastSerialSend > 10000) {

    Serial.print("TEMP:");
    Serial.print(temp);

    Serial.print(",HUM:");
    Serial.print(hum);

    Serial.print(",AQI:");
    Serial.print(airQuality);

    Serial.print(",PPM:");
    Serial.print(ppm, 1);

    Serial.print(",LIMIT:");
    Serial.print(limitTemp);

    Serial.print(",AI:");
    Serial.println(lastAdvice);

    lastSerialSend = millis();
  }

  // ---------- LED + BUZZER ----------

  if (temp > limitTemp) {

    digitalWrite(RED_LED, HIGH);
    digitalWrite(GREEN_LED, LOW);

    if (!buzzerMuted)
      digitalWrite(BUZZER, HIGH);

  } else {

    digitalWrite(RED_LED, LOW);
    digitalWrite(GREEN_LED, HIGH);

    digitalWrite(BUZZER, LOW);

    buzzerMuted = false;
  }

  // ---------- SEND DATA ----------

  if (wifiConnected && millis() - lastSendTime > 10000) {

    sendData(temp, hum, airQuality);

    lastSendTime = millis();
  }

  // ---------- AI GENERATE ----------

  if (wifiConnected && millis() - lastAICall > aiInterval) {

    triggerAIAdvice(temp, hum);

    delay(2000);

    fetchAIAdvice();

    lastAICall = millis();
  }

  // ---------- DISPLAY SWITCH ----------

  if (millis() - displayTimer > 15000) {

    showAI = !showAI;

    lcd.clear();

    scrollIndex = 0;

    displayTimer = millis();

    if (showAI && wifiConnected)
      fetchAIAdvice();
  }

  // ---------- SENSOR DISPLAY ----------

  if (!showAI) {

    lcd.setCursor(0, 0);
    lcd.print("T:");
    lcd.print((int)temp);
    lcd.print(" H:");
    lcd.print((int)hum);
    lcd.print("    ");  // Clear trailing chars

    lcd.setCursor(0, 1);
    lcd.print("AQI:");
    lcd.print(airQuality);
    lcd.print(" L:");
    lcd.print(limitTemp);
    lcd.print("    ");  // Clear trailing chars
  }

  // ---------- AI DISPLAY ----------

  else {

    lcd.setCursor(0, 0);
    lcd.print("AI Advice:");

    scrollText(lastAdvice);
  }
}

// ---------- NON-BLOCK SCROLL ----------

void scrollText(String text) {

  if (millis() - lastScrollTime > 350) {

    lcd.setCursor(0, 1);

    lcd.print(text.substring(scrollIndex, scrollIndex + 16));

    scrollIndex++;

    if (scrollIndex > text.length())
      scrollIndex = 0;

    lastScrollTime = millis();
  }
}

// ---------- SEND DATA ----------

void sendData(float temp, float hum, int airQuality) {

  if (!wifiConnected)
    return;

  HTTPClient http;

  http.begin(serverName);
  http.addHeader("Content-Type", "application/json");

  String jsonData = "{";
  jsonData += "\"temperature\":";
  jsonData += temp;
  jsonData += ",";
  jsonData += "\"humidity\":";
  jsonData += hum;
  jsonData += ",";
  jsonData += "\"limit\":";
  jsonData += limitTemp;
  jsonData += ",";
  jsonData += "\"airQuality\":";
  jsonData += airQuality;
  jsonData += "}";

  http.POST(jsonData);
  http.end();
}

// ---------- TRIGGER AI ----------

void triggerAIAdvice(float temp, float hum) {

  if (!wifiConnected)
    return;

  HTTPClient http;

  http.begin(aiTriggerServer);
  http.addHeader("Content-Type", "application/json");

  String jsonData = "{";
  jsonData += "\"temperature\":";
  jsonData += temp;
  jsonData += ",";
  jsonData += "\"humidity\":";
  jsonData += hum;
  jsonData += "}";

  http.POST(jsonData);
  http.end();
}

// ---------- FETCH AI ----------

void fetchAIAdvice() {

  if (!wifiConnected)
    return;

  HTTPClient http;

  http.begin(aiServer);

  int httpCode = http.GET();

  if (httpCode == 200) {

    String payload = http.getString();

    int start = payload.indexOf(":\"") + 2;
    int end = payload.lastIndexOf("\"");

    lastAdvice = payload.substring(start, end);
  }

  http.end();
}