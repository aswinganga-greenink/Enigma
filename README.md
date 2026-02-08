# 🚻 Find My Toilet
### Making the essential easy to find

**Find My Toilet** is a location-based civic web application that helps people quickly discover nearby toilets — whether
in restaurants, fuel stations, malls, or vendor-added locations — with clear visibility into availability, pricing, and
accessibility.

The platform combines **open map data**, **vendor contributions**, and **community feedback** to solve a simple but
critical problem:

> *Finding a usable toilet when you need one.*

---

## 🌍 Problem Statement

Public toilet information is often:
- Hard to find
- Outdated
- Fragmented across platforms
- Lacking details like free/paid access or accessibility

This becomes especially challenging for:
- Travelers
- Elderly users
- Differently-abled individuals
- People in unfamiliar areas

---

## 💡 Solution

**Find My Toilet** provides:
- A **map-based interface** to discover toilet locations
- **Vendor participation** to add and manage locations
- **Anonymous community feedback** for real-world updates
- A lightweight, fast system designed for practical use

The focus is **usability over complexity**.

---

## ✨ Key Features

### 🔍 Discover Toilets on a Map
- View toilet locations from:
- Restaurants
- Fuel stations
- Public places
- Vendor-added points
- Interactive map with clear visual markers

### 💰 Free vs Paid Visibility
- Toilets are clearly marked as **free** or **paid**
- Color-coded markers for quick recognition

### ♿ Accessibility Information
- Vendors can specify whether facilities support differently-abled users

### 🏪 Vendor Contributions
- Vendors can:
- Sign up and log in
- Add their toilet location directly by clicking on the map
- Provide accurate facility details
- Vendor actions are **authenticated and protected**

### 💬 Anonymous Community Comments
- Anyone can leave comments without creating an account
- Helps keep information fresh and honest
- Comments are tied to each location

---

## 🧱 Architecture Overview

### Backend
- **FastAPI** — REST API
- **SQLite** — lightweight persistent database
- **SQLAlchemy** — ORM
- **JWT authentication** — vendor login
- **Argon2 password hashing**
- **Dockerized** for easy deployment

### Frontend
- **HTML + JavaScript**
- **Leaflet.js** for interactive maps
- No framework lock-in (easy to replace or extend)

### Data Sources
- OpenStreetMap / Overpass (for initial map data)
- Vendor-submitted locations
- Community-generated comments

---

## 🔐 Authentication Model

- **Vendors**
- Must sign up & log in
- Can add locations
- **General Users**
- No login required
- Can view locations
- Can leave anonymous comments

This keeps the barrier low while maintaining data integrity.

---