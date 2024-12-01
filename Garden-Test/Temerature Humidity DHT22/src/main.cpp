#include <Adafruit_Sensor.h>
#include <Arduino.h>
#include <WiFi.h>
#include <FirebaseESP32.h>
#include <DHT.h>

#define FIREBASE_HOST "https://smart-garden-af39d-default-rtdb.firebaseio.com/"
#define FIREBASE_API_KEY "AIzaSyA_N4KfuLSLI6l8T4vYhngHZdsyDfzobhE"
#define FIREBASE_AUTH "r7AyexmANELUpWaXTLDlSfTnXT7oSH96BvSi2cML"

#define WIFI_SSID "Wokwi-GUEST"
#define WIFI_PASSWORD "" 
#define DHTPIN 25
#define DHTTYPE DHT22

DHT dht(DHTPIN, DHTTYPE);
FirebaseData FBase_Data;
FirebaseConfig FBase_Config; 
FirebaseAuth FBase_Auth;     

void setup() {
  Serial.begin(115200);
  Serial.println("Hello, ESP32!");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }

  Serial.println ("");
  Serial.println ("WiFi connected!");

  // Khởi tạo cấu hình Firebase
  FBase_Config.database_url = FIREBASE_HOST;
  FBase_Config.api_key = FIREBASE_API_KEY;
  /* Sign up */
  if (Firebase.signUp(&FBase_Config, &FBase_Auth, "", "")){
    Serial.println("Firebase connected!");
    //signupOK = true;
  }
  else{
    Serial.printf("%s\n", FBase_Config.signer.signupError.message.c_str());
  }

  // Connect to Firebase
  Firebase.begin(&FBase_Config, &FBase_Auth);
  Firebase.reconnectWiFi(true);
  
  // begin DHT
  dht.begin();
}

void loop() {
  delay(10000);
  float t = dht.readTemperature();
  float f = dht.readTemperature(true);
  float h = dht.readHumidity();

  Serial.print("Temperature: ");
  Serial.print(t);
  Serial.print("°C,  Humidity: ");
  Serial.print(h);
  Serial.println("%");

  if (Firebase.setFloat(FBase_Data, "Temperature", t)) {
    Serial.println("Temperature data sent successfully!");
  } else {
    Serial.println("Failed to send temperature data");
    Serial.println(FBase_Data.errorReason());
  }

  if (Firebase.setFloat(FBase_Data, "Humidity", h)) {
    Serial.println("Humidity data sent successfully!");
  } else {
    Serial.println("Failed to send humidity data");
    Serial.println(FBase_Data.errorReason());
  }
}
