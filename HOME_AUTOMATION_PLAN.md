# Nora Home Automation Plan

Goal: "Hey Nora, turn off the lights in the garage." / "Hey Nora, show the Ring camera."

## How it fits together
```
You ──voice──▶ Nora (PC) ──"turn off garage light"──▶ Home Assistant (Raspberry Pi) ──▶ smart plug / bulb
                                                              └──▶ Ring doorbell (camera feed)
```
- **Home Assistant (HA):** free software that runs your smart home. It lives on the Pi, 24/7.
- **Nora** gets a new "home control" tool that sends commands to Home Assistant over your home Wi-Fi.

## Shopping list (buy when ready)
| Item | Why | Notes |
|---|---|---|
| Raspberry Pi 5 (4 GB or 8 GB) | Runs Home Assistant | 8 GB gives room for later (Nora on the server) |
| Official Pi 5 power supply (27 W) | Cheap supplies cause random crashes | Don't skip this |
| SSD + adapter/HAT (or a good microSD to start) | Servers wear out microSD cards | An SSD is much more reliable |
| Case with a fan | Keeps it cool | |
| Ethernet cable | More reliable than Wi-Fi for a server | |
| 1–2 smart plugs or bulbs that **work locally** and are **supported by Home Assistant** | First test: the garage light | Check Home Assistant's integrations list before buying |

## Steps (we'll do these together)
1. Flash **Home Assistant OS** onto the SSD/card with Raspberry Pi Imager, plug in, then open `http://homeassistant.local:8123`.
2. Add your smart plug/bulb in Home Assistant and name it clearly ("Garage Light").
3. Add the **Ring** integration in Home Assistant (for camera/doorbell).
4. Make a **long-lived access token** in Home Assistant (your profile page). That's Nora's key.
5. I add the **home control** tool to Nora, using that token.
6. Test: "Hey Nora, turn off the garage light."

## Security rules (your cyber practice)
- Never expose Home Assistant directly to the internet (no port forwarding). For outside access later, use a VPN like **Tailscale** or **WireGuard**.
- Treat the access token like a password; it goes in Nora's secret storage, not in code.
- Turn on 2-factor login for Home Assistant.

## Ring on your PC today (no Pi needed)
Tell Nora once: *"Remember: when I say 'open the Ring display', open account.ring.com in the browser."*
