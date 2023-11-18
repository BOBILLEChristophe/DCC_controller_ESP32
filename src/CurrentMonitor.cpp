/**********************************************************************

CurrentMonitor.cpp
COPYRIGHT (c) 2013-2016 Gregg E. Berman

Part of DCC++ BASE STATION for the Arduino

**********************************************************************/

#include "CurrentMonitor.h"
#include "Config.h"

///////////////////////////////////////////////////////////////////////////////

CurrentMonitor::CurrentMonitor(int pin, char *msg) : m_pin(pin),
                                                     m_current(0)
{
  m_msg = msg;
} // CurrentMonitor::CurrentMonitor

void CurrentMonitor::setup()
{
  pinMode(m_pin, INPUT);
  // if (client != nullptr)
  // {
  //   Serial.printf("<p0>");
  //   client->printf("<p0>!");
  // }
}

float CurrentMonitor::current()
{
  return (m_current);
}

// void CurrentMonitor::over(AsyncWebSocketClient *client)
// {
//   if (m_current > CURRENT_SAMPLE_MAX)
//     client->printf(m_msg);
// }

void CurrentMonitor::check()
{
  m_current = analogRead(m_pin) * CURRENT_SAMPLE_SMOOTHING + m_current * (1.0 - CURRENT_SAMPLE_SMOOTHING); // compute new exponentially-smoothed current
  if (m_current > CURRENT_SAMPLE_MAX)
    // current overload and Prog Signal is on (or could have checked Main Signal, since both are always on or off together)
    digitalWrite(PIN_PWM, LOW);
} // CurrentMonitor::check