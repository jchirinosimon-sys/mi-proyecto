const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function uploadFileBuffer(file, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      },
    );

    stream.end(file.buffer);
  });
}

function getCloudinaryPublicId(url) {
  if (typeof url !== "string" || !url.includes("res.cloudinary.com")) {
    return null;
  }

  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i);
  return match ? decodeURIComponent(match[1]) : null;
}

async function deleteCloudinaryAsset(url) {
  const publicId = getCloudinaryPublicId(url);
  if (!publicId) {
    return;
  }

  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
}

module.exports = {
  uploadFileBuffer,
  deleteCloudinaryAsset,
};
