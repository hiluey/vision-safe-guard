How to Edit This Code

There are several ways to edit your application.

1. Use Your Preferred IDE

If you want to work locally using your own IDE, clone this repo and push changes. Pushed changes will also be reflected in Lovable.

Requirements: Node.js & npm installed. You can install Node.js with nvm
.

# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Step 3: Install dependencies
npm install

# Step 4: Start the development server
npm run dev

2. Run the Back-end Server

This project requires a back-end proxy to function. Open a separate terminal, navigate to your back-end folder, and run:

# Navigate to the back-end folder
cd ppe-detector-proxy

# Start the server
node server.js


Your back-end will be running at: http://localhost:3001

3. Edit Files Directly on GitHub

Navigate to the desired file(s).

Click the "Edit" button (pencil icon) at the top right of the file view.

Make your changes and commit them.

4. Use GitHub Codespaces

Navigate to the main page of your repository.

Click on the "Code" button (green button) near the top right.

Select the "Codespaces" tab.

Click "New codespace" to launch a new environment.

Edit files directly within Codespace and commit/push your changes.

5. Technologies Used

Front-end: Vite, TypeScript, React, shadcn-ui, Tailwind CSS

Back-end: Node.js (proxy server)