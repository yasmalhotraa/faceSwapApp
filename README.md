# faceSwapApp

A simple server-rendered form app built with **Node.js**, **Express**, **EJS**, and the **MongoDB native driver**.  
Users can submit their details and a photo, which is sent to the **LightXEditor Face Swap API**.  
The swapped image and user record are stored in MongoDB and displayed on a submissions page.

## Live Demo
[https://faceswapapp.onrender.com/](https://faceswapapp.onrender.com/)

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/yasmalhotraa/faceSwapApp.git
   cd faceSwapApp
   
2. **Install dependencies**

```bash
npm install
```

3.Environment variables

#### Create a .env file in the project root with:
PORT=3000
DB_NAME=faceSwapApp
MONGO_URI=mongodb+srv://faceSwapUser:Qazplm_q1w2e3r4@faceswapcluster.c4nshrh.mongodb.net/faceSwapApp?retryWrites=true&w=majority
LIGHTX_API_KEY=ceb88cbf2eda408199d7f92e3052a94f_7693d4e4c4eb415d83424c222bf73777_andoraitools
STYLE_IMAGE_URL=https://d3aa3s3yhl0emm.cloudfront.net/apikey/abac7f6c22574a00adeffdf6302fd7ba.jpeg
CLOUD_NAME=drftrqonq
CLOUD_API_KEY=969575441753812
CLOUD_API_SECRET=5gguJSzJiYdjpTvMPf70qb0Nekk


4. Run the app

```bash
npm start
```
Open http://localhost:3000 in your browser.



