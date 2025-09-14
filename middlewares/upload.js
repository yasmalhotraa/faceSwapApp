const multer = require("multer");
const cloudinary = require("../config/cloud");
const streamifier = require("streamifier");

function fileFilter(req, file, cb) {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(file.originalname.toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) return cb(null, true);
  cb(new Error("Only JPEG, JPG, and PNG images are allowed"));
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

const uploadToCloudinary = (buffer, originalname) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "face-swap/original",
        allowed_formats: ["jpg", "jpeg", "png"],
        transformation: [{ width: 1000, height: 1000, crop: "limit" }],
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          secure_url: result.secure_url, // critical!
          public_id: result.public_id,
          size: result.bytes,
          originalname,
        });
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

const uploadWithCloudinary = (fieldName) => [
  upload.single(fieldName),
  async (req, res, next) => {
    if (!req.file) return next();
    try {
      const cloudResult = await uploadToCloudinary(
        req.file.buffer,
        req.file.originalname
      );
      req.file = { ...req.file, ...cloudResult };
      next();
    } catch (error) {
      console.error("❌ Cloudinary upload failed:", error);
      next(error);
    }
  },
];

module.exports = { upload, uploadWithCloudinary, uploadToCloudinary };
