# Tuya TS130F `_TZE20C_xbexmf8h` — Zigbee2MQTT External Converter

External converter for zigbee2mqtt adding support for the Tuya TS130F blind/curtain motor controller with manufacturer name `_TZE20C_xbexmf8h`.

---

## Features

**Controls**
- Open / Stop / Close
- Set position by percentage
- Real-time state and position feedback (reports via `commandActiveStatusReport` and `commandActiveStatusReportAlt`)
- Moving direction indicator (UP / STOP / DOWN)

**Configuration**
- `backlight_mode` — controls the physical switch LED backlight (DP 14)
- `motor_reversal` — reverses the motor direction (DP 8)
- `calibration` — starts/ends the calibration process (DP 3)

**Diagnostics**
- `calibration_time` — travel time measured by the motor during the last calibration, in seconds (DP 10)

---

## Discovered Data Points

| DP | Feature | Type | Values |
|----|---------|------|--------|
| 1 | state / moving | enum | 0=OPEN/UP, 1=STOP, 2=CLOSE/DOWN |
| 2 | position | value | 0–100 |
| 3 | calibration | enum | 0=ON, 1=OFF |
| 8 | motor_reversal | enum | 0=OFF, 1=ON |
| 10 | calibration_time | value | tenths of a second |
| 14 | backlight_mode | enum | 0=ON, 1=OFF |

---

## Installation

### 1. Locate your zigbee2mqtt configuration directory

Depending on your installation:
- **Home Assistant add-on:** `/config/zigbee2mqtt/`
- **Docker:** the directory mounted as `/app/data/`
- **Manual install:** the directory containing `configuration.yaml`

### 2. Create the `external_converters` directory (if it doesn't exist)

```bash
mkdir -p /config/zigbee2mqtt/external_converters
```

### 3. Copy the converter file

Place `xbexmf8h.js` inside the `external_converters` directory:

```
/config/zigbee2mqtt/
├── configuration.yaml
└── external_converters/
    └── xbexmf8h.js
```

### 4. Add the reference in `configuration.yaml`

```yaml
external_converters:
  - xbexmf8h.js
```

### 5. Restart zigbee2mqtt

In Home Assistant: **Settings → Add-ons → Zigbee2MQTT → Restart**

On startup you should see a log line confirming the converter was loaded successfully.

---

## Calibration procedure

1. Move the blind to the fully open position (top)
2. Set `calibration` to `ON`
3. Send `state: CLOSE` and wait for the blind to reach the fully closed position (bottom)
4. Once stopped, set `calibration` to `OFF`
5. The `calibration_time` diagnostic will show the measured travel time in seconds

---

## Notes

- The device does **not** support indicator mode — the blue LED is a simple on/off backlight
- State and position are reported by the device only at the start and end of movement, not continuously during travel
- Tested on zigbee2mqtt 2.x (add-on for Home Assistant)
