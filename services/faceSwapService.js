// services/faceSwapService.js
const axios = require("axios");

// Since we're now receiving Cloudinary URLs, we don't need the uploadToLightX function
// The original image is already hosted on Cloudinary and accessible via URL

// Performing Face Swap
async function faceSwapAPI(originalImageUrl, styleImageUrl) {
  try {
    console.log("🔄 Starting face swap process...");
    console.log(`📸 Original image URL: ${originalImageUrl}`);
    console.log(`🎭 Style image URL: ${styleImageUrl}`);
    console.log(
      `🔑 API Key: ${process.env.LIGHTX_API_KEY ? "Present" : "Missing"}`
    );

    // The original image is already hosted on Cloudinary, so we can use it directly
    console.log("Step 1: Using Cloudinary-hosted original image...");

    // Create Face Swap order
    console.log("Step 2: Calling Face Swap API...");
    const swapPayload = {
      imageUrl: originalImageUrl, // This is now the Cloudinary URL
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

    // Poll until swap is completed
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
