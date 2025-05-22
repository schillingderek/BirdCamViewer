#!/bin/bash

# Start the backend
cd backend
source venv/bin/activate
python app.py &

# Start the frontend
cd ../frontend
npm run dev 