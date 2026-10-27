# 🌍 KhojKr — Tourist Place Finder

**Discover nearby tourist attractions, explore them on an interactive map, and get directions to your next destination.**

KhojKr is a web-based tourist discovery application that helps users find attractions near their current location. Users can select a search radius, explore nearby places on an interactive map, view place information, and navigate to destinations using Google Maps.

🔗 **Live Demo:** [Explore KhojKr](https://theanirudh18.github.io/Anirudh-tourist-/)

📂 **GitHub Repository:** [Anirudh-tourist-](https://github.com/theanirudh18/Anirudh-tourist-)

---

## ✨ Features

- 📍 **Location Detection** — Find tourist attractions near your current location.
- 🔎 **Custom Search Radius** — Search for places within a selected distance.
- 🗺️ **Interactive Map** — Explore attractions using Leaflet.js and OpenStreetMap.
- 📋 **Nearby Places List** — Browse discovered attractions and their distances.
- 🧭 **Google Maps Directions** — Get directions to selected destinations.
- 🖼️ **Place Images** — Explore available images of tourist attractions.
- 🎯 **Category Filtering** — Discover cultural, historical, natural, and other attractions.
- 📱 **Responsive Interface** — Use the application on supported desktop and mobile browsers.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| HTML5 | Page structure |
| CSS3 | Styling and responsive interface |
| JavaScript | Application logic and API integration |
| Leaflet.js | Interactive maps |
| OpenStreetMap | Map tiles and geographic visualization |
| OpenTripMap API | Tourist attraction data |
| Git & GitHub | Version control and source code hosting |
| GitHub Actions | Automated validation and CI |
| Docker | Containerized deployment |
| Nginx | Web server inside the Docker container |

## ⚙️ How It Works

1. The user opens KhojKr and selects a search radius.
2. The browser requests access to the user's location.
3. The application uses the location and selected radius to search for nearby attractions through the configured tourist places API.
4. The results are displayed as map markers and a list of places.
5. The user can explore attractions and open directions in Google Maps.

> **Note:** Location-based search requires browser location permission and a supported browser context, generally HTTPS or localhost.

## 🚀 Getting Started

### Prerequisites

- Git
- A modern web browser
- Visual Studio Code (recommended)
- Live Server extension (optional)

### 1. Clone the repository

```bash
git clone https://github.com/theanirudh18/Anirudh-tourist-.git
```

### 2. Open the project

```bash
cd Anirudh-tourist-
```

### 3. Run locally

Open `index.html` using the VS Code Live Server extension, or serve the project directory using a local HTTP server.

For example, if Python is installed:

```bash
python3 -m http.server 8000
```

Then open:

`http://localhost:8000`

The application entry point for GitHub Pages is `index.html`.

## 🔑 API Configuration

KhojKr uses the OpenTripMap API for tourist attraction data, as configured in the application.

1. Obtain an API key from the API provider if required.
2. Configure the key according to the API integration in `project.js`.
3. Do not commit private credentials, tokens, or secrets to a public repository.

**Security note:** API keys embedded in frontend JavaScript can be viewed by visitors. If the provider's key must remain secret, use a backend service to make API requests and protect the credentials.

## 🐳 Run with Docker

If Docker is installed and running, build the application image:

```bash
docker build -t khojkr .
```

Start a container:

```bash
docker run -d --name khojkr-web -p 8080:80 khojkr
```

Open:

`http://localhost:8080`

If port `8080` is already in use, choose another available host port, such as `8083`:

```bash
docker run -d --name khojkr-web -p 8083:80 khojkr
```

Then open `http://localhost:8083`.

## 🔄 Continuous Integration

KhojKr includes a GitHub Actions workflow that runs automated checks when code is pushed or a pull request is opened.

The configured pipeline includes:

- HTML validation
- JavaScript linting
- Docker image build verification

These checks help identify common errors and verify that the application can be packaged into a container.

## 📁 Project Structure

```text
Anirudh-tourist-/
├── .github/
│   └── workflows/
│       └── ci.yml
├── index.html
├── project.html
├── project.css
├── project.js
├── login.html
├── Dockerfile
├── package.json
├── package-lock.json
├── eslint.config.mjs
├── .gitignore
└── README.md
```

## 🛣️ Future Improvements

- ⭐ Save and bookmark favourite attractions.
- 🔐 Add secure user authentication.
- 🧭 Display routes directly on the interactive map.
- ⭐ Add user reviews and ratings.
- 🗃️ Store favourite places and user preferences in a database.
- 🔍 Improve search filters and tourist destination discovery.
- 🚀 Improve search engine optimization (SEO) and accessibility.

## 👨‍💻 Author

**Anirudh Singh**

Computer Science & Design Student | Web Development & Software Engineering

- GitHub: [@theanirudh18](https://github.com/theanirudh18)
- Live Project: [KhojKr — Tourist Place Finder](https://theanirudh18.github.io/Anirudh-tourist-/)

---

If you find this project useful, consider giving the repository a ⭐ on GitHub.

*Built to make discovering nearby tourist attractions easier.*
