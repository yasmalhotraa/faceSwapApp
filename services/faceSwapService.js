// services/faceSwapService.js

const axios = require("axios");
const fs = require("fs");

async function uploadToLightX(filePath) {
  console.log(`📤 Starting upload for: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`File does not exist: ${filePath}`);
  }

  const stats = fs.statSync(filePath);
  const size = stats.size;
  console.log(`📊 File size: ${size} bytes`);

  console.log("🔗 Requesting upload URL from LightX...");
  const { data } = await axios.post(
    "https://api.lightxeditor.com/external/api/v2/uploadImageUrl",
    {
      uploadType: "imageUrl",
      size,
      contentType: "image/jpeg",
    },
    {
      headers: {
        "x-api-key": process.env.LIGHTX_API_KEY,
        "Content-Type": "application/json",
      },
    }
  );

  console.log("✅ Upload URL response:", data);

  if (!data.body || !data.body.uploadImage || !data.body.imageUrl) {
    throw new Error("Invalid upload URL response from LightX");
  }

  const uploadImageUrl = data.body.uploadImage;
  const hostedImageUrl = data.body.imageUrl;

  console.log("📤 Uploading file to S3...");
  const imageBuffer = fs.readFileSync(filePath);
  const uploadResponse = await axios.put(uploadImageUrl, imageBuffer, {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Length": imageBuffer.length,
    },
  });
  console.log(`✅ S3 Upload status: ${uploadResponse.status}`);

  console.log(`🌐 Hosted image URL: ${hostedImageUrl}`);
  return hostedImageUrl;
}

// Performing Face Swap

async function faceSwapAPI(originalFilePath, styleImageUrl) {
  try {
    console.log("🔄 Starting face swap process...");
    console.log(`📸 Original image: ${originalFilePath}`);
    console.log(`🎭 Style image: ${styleImageUrl}`);
    console.log(
      `🔑 API Key: ${process.env.LIGHTX_API_KEY ? "Present" : "Missing"}`
    );

    // 1️⃣ Upload original image to LightX
    console.log("Step 1: Uploading original image...");
    const uploadedOriginalUrl = await uploadToLightX(originalFilePath);

    // 2️⃣ Create Face Swap order
    console.log("Step 2: Calling Face Swap API...");
    const swapPayload = {
      imageUrl: uploadedOriginalUrl,
      styleImageUrl: styleImageUrl,
    };
    console.log("🚀 Face swap payload:", swapPayload);

    const swapResponse = await axios.post(
      "https://api.lightxeditor.com/external/api/v1/face-swap",
      swapPayload,
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.LIGHTX_API_KEY,
        },
      }
    );

    console.log("✅ Face swap response:", swapResponse.data);
    const orderId = swapResponse.data.body?.orderId;
    if (!orderId) {
      throw new Error("No orderId returned from LightX");
    }

    console.log(`⏳ Order ID: ${orderId}, starting polling...`);

    // 3️⃣ Poll until swap is completed
    let swappedUrl = null;
    const maxAttempts = 5; // 5 * 3s = 15s max wait time
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`🔄 Polling attempt ${attempt}/${maxAttempts}...`);
      await new Promise((resolve) => setTimeout(resolve, 3000));

      try {
        const statusRes = await axios.post(
          "https://api.lightxeditor.com/external/api/v1/order-status",
          { orderId },
          {
            headers: {
              "x-api-key": process.env.LIGHTX_API_KEY,
              "Content-Type": "application/json",
            },
            timeout: 10000,
          }
        );

        const body = statusRes.data.body;
        console.log("📩 Status response:", body);

        if (body.status === "active") {
          swappedUrl =
            body.output ||
            body.outputUrl ||
            body.resultUrl ||
            body.imageUrl ||
            body.output_url;
          console.log(`🎉 Face swap completed! Output: ${swappedUrl}`);
          break;
        } else if (body.status === "failed") {
          throw new Error(
            `Face swap failed: ${body.message || "Unknown error"}`
          );
        } else {
          console.log(`⏳ Status: ${body.status}, waiting...`);
        }
      } catch (pollErr) {
        console.error(`❌ Polling error: ${pollErr.message}`);
        if (pollErr.response?.data) {
          console.error("   Details:", pollErr.response.data);
        }
      }
    }

    if (!swappedUrl) {
      throw new Error(
        `Face swap did not complete within ${maxAttempts} attempts`
      );
    }

    return { outputUrl: swappedUrl };
  } catch (err) {
    console.error("💥 Face Swap API error:", err.message);

    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Response data:", err.response.data);
    }

    if (err.request && !err.response) {
      console.error("Request made but no response received.");
    }

    throw new Error(`Face swap failed: ${err.message}`);
  }
}

module.exports = { faceSwapAPI };
