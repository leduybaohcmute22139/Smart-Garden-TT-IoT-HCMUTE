#include <Adafruit_Sensor.h>
#include <AdafruitIO.h>
#include <AdafruitIO_WiFi.h> 
#include <Arduino.h>
#include <DHT.h>

// #define IO_USERNAME  "!!!!"
// #define IO_KEY       "!!!!"

#define WIFI_SSID "Wokwi-GUEST"
#define WIFI_PASSWORD "" 

AdafruitIO_WiFi io(IO_USERNAME, IO_KEY, WIFI_SSID, WIFI_PASSWORD);  // Gọi hàm kết nối đến server.

#define DHTPIN 27
#define DHTTYPE DHT22

DHT dht(DHTPIN, DHTTYPE);   
AdafruitIO_Feed *TEMPERATURE = io.feed("temperature"); // khai báo con trỏ digital để chứ dữ liệu lấy từ feed của server.
AdafruitIO_Feed *LED = io.feed("LED");

const int LEDPin = 26;

// Khai báo hàm handleLEDMessage trước khi sử dụng
void handleLEDMessage(AdafruitIO_Data *data);

void setup() {
  Serial.begin(115200);
  Serial.println("Hello, ESP32!");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("WiFi connected!");
  // wait for serial monitor to open
  while(! Serial);
 
  // connect to io.adafruit.com
  Serial.print("Connecting to Adafruit IO"); // tiến hành kết nối đến server.
  io.connect(); // Gọi hàm kết nối
 
 
  // wait for a connection
  while(io.status() < AIO_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  // we are connected
  Serial.println();
  Serial.println(io.statusText()); // Nếu đã kết nối thành công tiến hành xuất ra màn hình trạng thái.


  // Đăng ký hàm xử lý khi feed "LED" thay đổi
  LED->get();
  LED->onMessage(handleLEDMessage);
  // begin DHT
  dht.begin();
  pinMode(LEDPin, OUTPUT);
}

void loop() {
  io.run();  // Tiếp tục xử lý các feed
  
  delay(10000);
  float t = dht.readTemperature();
  float f = dht.readTemperature(true);
  float h = dht.readHumidity();
  if (isnan(t) || isnan(h)) {
    Serial.println("Failed to read from DHT sensor!");
  } else {
    // Gửi dữ liệu nhiệt độ lên Adafruit IO
    TEMPERATURE->save(t);  // Gửi nhiệt độ lên feed "temperature"
    Serial.print("Temperature: ");
    Serial.print(t);
    Serial.print(" C, Humidity: ");
    Serial.print(h);
    Serial.println(" %");
  }

}


void handleLEDMessage(AdafruitIO_Data *data) {
  // xuất ra màn hình trạng thái của nút nhấn trên feed vừa đọc được.
  Serial.print("received <- ");
 
  if(data->toPinLevel() == HIGH)
    Serial.println("HIGH");
  else
    Serial.println("LOW");

 // cài đặt trạng thái bật tắt led on board tương ứng với nút nhấn.
  // write the current state to the led
  digitalWrite(LEDPin, data->toPinLevel());
}
