# 🌍 KhojKr – Tourist Place Finder

KhojKr is a web application that helps users discover **tourist places near their current location** within a selected radius.
Users can enter a distance, choose a category, and instantly explore nearby attractions on an interactive map.

The project uses **OpenStreetMap + Leaflet.js** for maps and the **OpenTripMap API** to fetch nearby tourist locations.

---

## ✨ Features

* 📍 Detects user's **current location**
* 🔎 Search tourist places within a **custom radius (km)**
* 🗺️ Interactive **Leaflet map** with markers
* 📋 List of nearby places with **distance**
* 🧭 **Get Directions** button (opens Google Maps route)
* 🖼️ View **images of the place**
* 🎯 Filter places by **categories** (cultural, natural, historic, etc.)
* 📱 Responsive modern UI

---

## 🧑‍💻 Technologies Used

**Frontend**

* HTML5
* CSS3
* JavaScript

**Libraries**

* Leaflet.js (Interactive Maps)
* OpenStreetMap Tiles

**API**

* OpenTripMap API (Tourist Places Data)

---

## 🗺️ How It Works

1. User enters a **search radius**.
2. The browser retrieves the **user's current location** using the Geolocation API.
3. The application calls the **OpenTripMap API** with the location and radius.
4. Nearby places are returned and:

   * Displayed as **markers on the map**
   * Listed in the **places panel**
5. Users can:

   * Zoom to a place
   * Get **Google Maps directions**
   * View images of the place.

---

## 📂 Project Structure

```
KhojKr
│
├── project.html      # Main webpage
├── project.css       # Styling
├── project.js        # Application logic
└── README.md
```

---

## 🚀 How to Run the Project

1. Clone the repository

```
git clone https://github.com/your-username/khojkr.git
```

2. Open the project folder

3. Run using **Live Server** or open the HTML file in a browser

```
project.html
```

4. Enter a radius and click **Find Places**

---

## 🔑 API Setup

This project uses the **OpenTripMap API via RapidAPI**.

1. Create an account on RapidAPI
2. Subscribe to the **OpenTripMap API**
3. Replace the API key inside `project.js`

Example:

```javascript
const apiKey = "YOUR_API_KEY";
```

---

## 🎯 Future Improvements

* User authentication
* Bookmark favorite places
* Store hidden tourist spots in a database (MySQL)
* Display **routes directly on the map**
* Reviews and ratings for places

---

## 📸 Demo

Example functionality:

* Enter radius (e.g., **5 km**)
* Click **Find Places**
* See **nearby tourist places on map**
* Click **Get Directions** to open Google Maps

---

## 👨‍💻 Author

Anirudh Singh

Engineering Student | Cybersecurity Enthusiast

---

⭐ If you like this project, consider giving it a **star** on GitHub!
