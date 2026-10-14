import multer from "multer";
import path from "path";


// =========================================
// STORAGE CONFIGURATION
// =========================================

const storage = multer.diskStorage({

  // -----------------------------------------
  // WHERE TO SAVE IMAGE
  // -----------------------------------------

  destination: (req, file, cb) => {

    cb(
      null,
      path.join(
        process.cwd(),
        "uploads",
        "food-items"
      )
    );

  },


  // -----------------------------------------
  // FILE NAME
  // -----------------------------------------

  filename: (req, file, cb) => {

    const extension =
      path.extname(file.originalname);

    const fileName =
      `food-${Date.now()}-${Math.round(
        Math.random() * 100000
      )}${extension}`;

    cb(null, fileName);

  },

});


// =========================================
// FILE FILTER
// =========================================

const fileFilter = (req, file, cb) => {

  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];


  if (
    allowedTypes.includes(
      file.mimetype
    )
  ) {

    cb(null, true);

  } else {

    cb(
      new Error(
        "Only JPG, JPEG, PNG and WEBP images are allowed"
      ),
      false
    );

  }

};


// =========================================
// MULTER CONFIGURATION
// =========================================

const uploadFoodImage = multer({

  storage,

  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

});


// =========================================
// EXPORT
// =========================================

export default uploadFoodImage;