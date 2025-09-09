# GlowyApp ✨

GlowyApp is a full-stack project built with **ASP.NET Core (backend)** and **React Native with Expo Router (frontend)**.  
The backend provides APIs for authentication, shopping cart, and product management, while the frontend is a mobile app consuming these APIs.

---

## Tech Stack

- **Backend**: ASP.NET Core Web API  
- **Frontend**: React Native + Expo Router  
- **Database**: SQLite  
- **Tunneling/Local Network**: ngrok (optional), or direct IP for local development

---

## Backend Setup

1. **Navigate to the backend folder:**
   ```bash
   cd backend/GlowyAPI
   ```

2. **Restore dependencies and run:**
   ```bash
   dotnet restore
   dotnet run
   ```

3. **Default backend address:**
   ```
   http://localhost:5000
   ```

4. **Expose backend to your local network (for mobile devices):**
   - Edit `Properties/launchSettings.json`:
     ```json
     "applicationUrl": "http://0.0.0.0:5000"
     ```
   - Or run with:
     ```bash
     dotnet run --urls "http://0.0.0.0:5000"
     ```
   - Find your computer’s local IP (e.g., `192.168.1.200`) and access backend at:
     ```
     http://192.168.1.130:5000
     ```

5. **CORS Configuration (important for mobile access):**
   In `Program.cs`, add:
   ```csharp
   builder.Services.AddCors();
   app.UseCors(builder =>
       builder.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader());
   ```

6. **Firewall:**
   - Ensure Windows Firewall allows inbound connections on port `5000`.

---

## Frontend Setup

1. **Navigate to the frontend folder:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the app:**
   ```bash
   npx expo start
   ```

4. **Open on your device:**
   - Scan the QR code with Expo Go (Android/iOS).
   - Make sure your device is on the same WiFi network as your backend server.

---

## Connecting Backend & Frontend

### Option 1: Using ngrok (for remote access or if you can't use local IP)

1. **Start ngrok:**
   ```bash
   ngrok http 5000
   ```

2. **Copy the HTTPS URL from ngrok (e.g., `https://thenumber.ngrok-free.app`).**

3. **Update your API URL in `.env` (recommended) or `api.ts`:**
   ```env
   API_URL='https://thenumber.ngrok-free.app'
   ```

4. **Restart the frontend app after changing `.env`.**

### Option 2: Using Local IP (recommended for local development)

1. **Find your computer’s local IP address:**
   - On Windows: `ipconfig`
   - On Mac/Linux: `ifconfig` or `ip a`
   - Example: `192.168.1.200`

2. **Update your API URL in `.env`:**
   ```env
   API_URL='http://192.168.1.200:5000'
   ```

3. **Restart the frontend app after changing `.env`.**

4. **Test backend accessibility:**
   - On your phone, open a browser and go to `http://192.168.1.200:5000/swagger`.
   - If you see Swagger UI, your backend is accessible.

---

## Environment Variables

- **Frontend:**  
  Use `.env` to store API URLs and other secrets.
  ```env
  API_URL='http://192.168.1.200:5000'
  API_IMAGE_BASE_URL='http://192.168.1.200:5000/api'
  ```
- **Backend:**  
  Store secrets and connection strings in `appsettings.json` or environment variables.

---

## Troubleshooting

- **Expo Go app shows "Network Error" (Axios):**
  - Make sure backend is listening on `0.0.0.0` or your local IP.
  - Ensure CORS is enabled in backend.
  - Check firewall settings.
  - Confirm both devices are on the same WiFi network.
  - Restart Expo/Metro with `npx expo start -c` after changing `.env`.

- **Cannot access backend from phone:**
  - Test with phone browser: `http://<your-ip>:5000/swagger`
  - Check backend listening address and firewall.

- **CORS errors:**
  - Ensure CORS middleware is configured in backend as shown above.

- **ngrok tunnel changes:**
  - Update `.env` or `api.ts` with the new ngrok URL each time you restart ngrok.

---

## Production Deployment

- For production, deploy your backend to a cloud provider (Azure, AWS, Railway, etc.).
- Use HTTPS and secure environment variables.
- Update frontend API URLs to point to your production backend.

---

## Development Notes

- When switching tunnels or IPs, always update your frontend `.env` and restart Expo.
- Use environment variables to avoid hardcoding URLs.
- Test on both iOS and Android devices for compatibility.
- For advanced navigation and modals, use Expo Router or React Navigation features.

---

## Useful Commands

- **Start backend:**  
  `dotnet run`
- **Start frontend:**  
  `npx expo start`
- **Clear Expo cache:**  
  `npx expo start -c`
- **Start ngrok:**  
  `ngrok http 5000`

---

## Resources

- [ASP.NET Core Docs](https://learn.microsoft.com/en-us/aspnet/core/)
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Docs](https://docs.expo.dev/)
- [ngrok Docs](https://ngrok.com/docs)

---

**Happy coding!**