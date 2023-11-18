#include <ArduinoOTA.h>
#include <ArduinoJson.h>
#include <FS.h>
#include <SPIFFS.h>
#include <ESPmDNS.h>
#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <SPIFFSEditor.h>

#include "DCC.h"
#include "Config.h"
#include "CurrentMonitor.h"

#ifdef CAN_INTERFACE
#include <ACAN_ESP32.h>
#endif

const char *ssid = WIFI_SSID;
const char *password = WIFI_PSW;
const char *hostName = "controller";
const char *http_username = "admin";
const char *http_password = "admin";

// Mesure de courant
CurrentMonitor mainMonitor(CURRENT_MONITOR_PIN_MAIN, (char *)"<p2>"); // create monitor for current on Main Track

void Task0(void *pvParameters);
void Task1(void *pvParameters);
void Task2(void *pvParameters);

DCC dcc;

AsyncWebServer server(80);
AsyncWebSocket ws("/ws");
AsyncEventSource events("/events");
AsyncWebSocketClient *clientCurrent;

void onWsEvent(AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data, size_t len)
{
  if (type == WS_EVT_CONNECT)
  {
    Serial.printf("ws[%s][%u] connect\n", server->url(), client->id());
    client->ping();
    clientCurrent = client;
  }
  else if (type == WS_EVT_DISCONNECT)
  {
    Serial.printf("ws[%s][%u] disconnect\n", server->url(), client->id());
  }
  else if (type == WS_EVT_ERROR)
  {
    Serial.printf("ws[%s][%u] error(%u): %s\n", server->url(), client->id(), *((uint16_t *)arg), (char *)data);
  }
  else if (type == WS_EVT_PONG)
  {
    Serial.printf("ws[%s][%u] pong[%u]: %s\n", server->url(), client->id(), len, (len) ? (char *)data : "");
  }
  else if (type == WS_EVT_DATA)
  {
    Message DCClog;
    char commandTxt[16];
    size_t commandLen = 0;
    for (uint8_t i = 0; i < len; i++)
    {
      switch (data[i])
      {
      case '<':
        commandLen = 0;
        break;
      case '>':
        commandTxt[commandLen] = '\0';
        dcc.parse(commandTxt, &DCClog);
        break;
      default:
        commandTxt[commandLen++] = data[i];
      }
    }

    // Réponse au client
    StaticJsonDocument<128> doc;
    doc["type"] = DCClog.type;
    doc["value"] = DCClog.value;
    String jsonString;
    serializeJson(doc, jsonString);
    client->text(jsonString);
  }
}

void setup()
{
  Serial.begin(115200);
  while (!Serial)
    ;
  Serial.printf("\n\nProject :      %s\n", PROJECT);
  Serial.printf("\nVersion   :      %s\n", VERSION);
  Serial.printf("\nFichier   :      %s\n", __FILE__);
  Serial.printf("\nCompiled  :      %s - %s \n\n", __DATE__, __TIME__);

  Serial.setDebugOutput(true);

  IPAddress local_IP(LOCAL_IP);
  IPAddress gateway(LOCAL_GATEWAY);
  IPAddress subnet(SUBNET);

  WiFi.mode(WIFI_STA);
  // WiFi.softAP(hostName);
  if (!WiFi.config(local_IP, gateway, subnet)) // adresse IP fixe
    Serial.println("STA Failed to configure");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }

  Serial.printf("\nWiFi connected.");
  Serial.printf("\nIP address: ");
  Serial.println(WiFi.localIP());
  Serial.print("Subnet Mask: ");
  Serial.println(WiFi.subnetMask());
  Serial.print("ESP Mac Address: ");
  Serial.println(WiFi.macAddress());
  Serial.print("RRSI: ");
  Serial.println(WiFi.RSSI());

  // Send OTA events to the browser
  ArduinoOTA.onStart([]()
                     { events.send("Update Start", "ota"); });
  ArduinoOTA.onEnd([]()
                   { events.send("Update End", "ota"); });
  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total)
                        {
    char p[32];
    sprintf(p, "Progress: %u%%\n", (progress/(total/100)));
    events.send(p, "ota"); });
  ArduinoOTA.onError([](ota_error_t error)
                     {
    if(error == OTA_AUTH_ERROR) events.send("Auth Failed", "ota");
    else if(error == OTA_BEGIN_ERROR) events.send("Begin Failed", "ota");
    else if(error == OTA_CONNECT_ERROR) events.send("Connect Failed", "ota");
    else if(error == OTA_RECEIVE_ERROR) events.send("Recieve Failed", "ota");
    else if(error == OTA_END_ERROR) events.send("End Failed", "ota"); });
  ArduinoOTA.setHostname(hostName);
  ArduinoOTA.begin();

  MDNS.addService("http", "tcp", 80);

  SPIFFS.begin();

  ws.onEvent(onWsEvent);
  server.addHandler(&ws);

#ifdef CAN_INTERFACE
  //--- Configure ESP32 CAN
  Serial.println("Configure ESP32 CAN");
  ACAN_ESP32_Settings settings(CAN_BITRATE);
  settings.mRxPin = CAN_RX;
  settings.mTxPin = CAN_TX;
  const ACAN_ESP32_Filter filter = ACAN_ESP32_Filter::singleExtendedFilter(ACAN_ESP32_Filter::data, 0x7E800, 0x1FF807FF);
  const uint32_t errorCode = ACAN_ESP32::can.begin(settings, filter);
  if (errorCode == 0)
    Serial.println("Can configuration OK !\n");
  else
  {
    Serial.printf("Can configuration error 0x%x\n", errorCode);
    delay(1000);
    return;
  }
#endif

  events.onConnect([](AsyncEventSourceClient *client)
                   { client->send("hello!", NULL, millis(), 1000); });
  server.addHandler(&events);

  server.addHandler(new SPIFFSEditor(SPIFFS, http_username, http_password));

  server.on("/heap", HTTP_GET, [](AsyncWebServerRequest *request)
            { request->send(200, "text/plain", String(ESP.getFreeHeap())); });

  server.serveStatic("/", SPIFFS, "/").setDefaultFile("index.htm");

  server.onNotFound([](AsyncWebServerRequest *request)
                    {
    Serial.printf("NOT_FOUND: ");
    if(request->method() == HTTP_GET)
      Serial.printf("GET");
    else if(request->method() == HTTP_POST)
      Serial.printf("POST");
    else if(request->method() == HTTP_DELETE)
      Serial.printf("DELETE");
    else if(request->method() == HTTP_PUT)
      Serial.printf("PUT");
    else if(request->method() == HTTP_PATCH)
      Serial.printf("PATCH");
    else if(request->method() == HTTP_HEAD)
      Serial.printf("HEAD");
    else if(request->method() == HTTP_OPTIONS)
      Serial.printf("OPTIONS");
    else
      Serial.printf("UNKNOWN");
    Serial.printf(" http://%s%s\n", request->host().c_str(), request->url().c_str());

    if(request->contentLength()){
      Serial.printf("_CONTENT_TYPE: %s\n", request->contentType().c_str());
      Serial.printf("_CONTENT_LENGTH: %u\n", request->contentLength());
    }

    int headers = request->headers();
    int i;
    for(i=0;i<headers;i++){
      AsyncWebHeader* h = request->getHeader(i);
      Serial.printf("_HEADER[%s]: %s\n", h->name().c_str(), h->value().c_str());
    }

    int params = request->params();
    for(i=0;i<params;i++){
      AsyncWebParameter* p = request->getParam(i);
      if(p->isFile()){
        Serial.printf("_FILE[%s]: %s, size: %u\n", p->name().c_str(), p->value().c_str(), p->size());
      } else if(p->isPost()){
        Serial.printf("_POST[%s]: %s\n", p->name().c_str(), p->value().c_str());
      } else {
        Serial.printf("_GET[%s]: %s\n", p->name().c_str(), p->value().c_str());
      }
    }

    request->send(404); });

  server.onFileUpload([](AsyncWebServerRequest *request, const String &filename, size_t index, uint8_t *data, size_t len, bool final)
                      {
    if(!index)
      Serial.printf("UploadStart: %s\n", filename.c_str());
    Serial.printf("%s", (const char*)data);
    if(final)
      Serial.printf("UploadEnd: %s (%u)\n", filename.c_str(), index+len); });

  server.onRequestBody([](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total)
                       {
    if(!index)
      Serial.printf("BodyStart: %u\n", total);
    Serial.printf("%s", (const char*)data);
    if(index + len == total)
      Serial.printf("BodyEnd: %u\n", total); });
  server.begin();

  dcc.setup();
  dcc.clear();
  mainMonitor.setup();

  xTaskCreatePinnedToCore(
      Task0,    /* Task function. */
      "Task0",  /* String with name of task. */
      3 * 1024, /* Stack size. */
      NULL,     /* Parameter passed as input of the task */
      2,        /* Priority of the task. */
      NULL,     /* Task handle. */
      0);       /* Core. */

  xTaskCreatePinnedToCore(
      Task1,
      "Task1",
      2 * 1024,
      NULL,
      2,
      NULL,
      1); /* Core. */

  xTaskCreatePinnedToCore(
      Task2,
      "Task2",
      2 * 1024,
      NULL,
      1,
      NULL,
      1); /* Core. */

  Serial.printf("End setup\n\n");
}

void Task0(void *p)
{

  TickType_t xLastWakeTime = xTaskGetTickCount();

  for (;;)
  {
    mainMonitor.check();
    vTaskDelayUntil(&xLastWakeTime, pdMS_TO_TICKS(1));
  }
}

void Task1(void *p)
{

  TickType_t xLastWakeTime = xTaskGetTickCount();

  for (;;)
  {
    ArduinoOTA.handle();
    ws.cleanupClients();

#ifdef CAN_INTERFACE
    CANMessage frame;
    if (ACAN_ESP32::can.receive(frame))
    {
      const byte fonction = (frame.id & 0x7F8) >> 3;
      // Serial.print("0x");
      // Serial.println(fonction, HEX);
      if (fonction == 0xF0)
      {
        // uint16_t locoAddr = frame.data[0] << 8 + frame.data[1];
        // uint8_t locoSpeed = frame.data[2];
        // uint8_t locoDir = frame.data[3];
        // Serial.print("adresse");
        // Serial.println(locoAddr);
        // Serial.print("speed");
        // Serial.println(locoSpeed);
        // Serial.print("direction");
        // Serial.println(locoDir);
        dcc.setThrottle((frame.data[0] << 8) + frame.data[1], frame.data[2], frame.data[3]);
      }
    }
#endif
    vTaskDelayUntil(&xLastWakeTime, pdMS_TO_TICKS(1));
  }
}

void Task2(void *p)
{
  StaticJsonDocument<32> doc;
  doc["type"] = 1;

  TickType_t xLastWakeTime = xTaskGetTickCount();

  for (;;)
  {
    if (clientCurrent != nullptr)
    {
      doc["value"] = (int)mainMonitor.current();
      String jsonString;
      serializeJson(doc, jsonString);
      clientCurrent->text(jsonString);
    }
    vTaskDelayUntil(&xLastWakeTime, pdMS_TO_TICKS(1000));
  }
}

void loop() {}
