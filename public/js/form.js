document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("submitForm");
  const nameField = document.getElementById("name");
  const emailField = document.getElementById("email");
  const phoneField = document.getElementById("phone");
  const termsField = document.getElementById("terms");
  const imageFile = document.getElementById("imageFile");
  const submitBtn = document.getElementById("submitBtn");

  // Camera elements
  const frontCameraBtn = document.getElementById("frontCameraBtn");
  const backCameraBtn = document.getElementById("backCameraBtn");
  const cameraModal = document.getElementById("cameraModal");
  const cameraVideo = document.getElementById("cameraVideo");
  const cameraCanvas = document.getElementById("cameraCanvas");
  const captureBtn = document.getElementById("captureBtn");
  const switchCameraBtn = document.getElementById("switchCameraBtn");
  const closeCameraBtn = document.getElementById("closeCameraBtn");
  const cameraTitle = document.getElementById("cameraTitle");

  // Preview elements
  const imagePreview = document.getElementById("imagePreview");
  const previewImg = document.getElementById("previewImg");
  const removeImageBtn = document.getElementById("removeImageBtn");
  const retakeBtn = document.getElementById("retakeBtn");

  // Camera variables
  let currentStream = null;
  let currentFacingMode = "user";
  let capturedImageBlob = null;
  let currentObjectUrl = null; // Track current object URL for cleanup

  // Validation rules
  const validators = {
    name: {
      validate: (value) => {
        const trimmed = value.trim();
        if (!trimmed) return "Name is required";
        if (trimmed.length < 4 || trimmed.length > 30)
          return "Name must be 4-30 characters";
        if (!/^[A-Za-z ]+$/.test(trimmed))
          return "Name must contain letters and spaces only";
        return null;
      },
    },
    email: {
      validate: (value) => {
        const trimmed = value.trim();
        if (!trimmed) return "Email is required";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed)) return "Invalid email format";
        return null;
      },
    },
    phone: {
      validate: (value) => {
        const trimmed = value.trim();
        if (!trimmed) return "Phone is required";
        if (!/^\d{10}$/.test(trimmed)) return "Phone must be exactly 10 digits";
        return null;
      },
    },
    terms: {
      validate: (checked) => {
        if (!checked) return "Terms must be accepted";
        return null;
      },
    },
    image: {
      validate: (file) => {
        if (!file && !capturedImageBlob) return "Image is required";

        const fileToCheck = file || capturedImageBlob;

        // Check file type
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
        if (!allowedTypes.includes(fileToCheck.type)) {
          return "Only JPG, JPEG, PNG files are allowed";
        }

        // Check file size (2MB = 2 * 1024 * 1024 bytes)
        const maxSize = 2 * 1024 * 1024;
        if (fileToCheck.size > maxSize) {
          return "File size must be less than 2MB";
        }

        return null;
      },
    },
  };

  // Show error function
  function showError(fieldName, message) {
    const errorElement = document.getElementById(`${fieldName}-error`);
    const formGroup = document.getElementById(fieldName)
      ? document.getElementById(fieldName).closest(".form-group")
      : document.querySelector(".form-group:has(#imageFile)");

    if (errorElement) {
      errorElement.textContent = message;
    }
    if (formGroup) {
      formGroup.classList.add("error");
      formGroup.classList.remove("success");
    }
  }

  // Show success function
  function showSuccess(fieldName) {
    const errorElement = document.getElementById(`${fieldName}-error`);
    const formGroup = document.getElementById(fieldName)
      ? document.getElementById(fieldName).closest(".form-group")
      : document.querySelector(".form-group:has(#imageFile)");

    if (errorElement) {
      errorElement.textContent = "";
    }
    if (formGroup) {
      formGroup.classList.remove("error");
      formGroup.classList.add("success");
    }
  }

  // Validate field function
  function validateField(fieldName, value) {
    const validator = validators[fieldName];
    if (!validator) return true;

    const error = validator.validate(value);
    if (error) {
      showError(fieldName, error);
      return false;
    } else {
      showSuccess(fieldName);
      return true;
    }
  }

  // Debounce function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Clean up object URL function
  function cleanupObjectUrl() {
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = null;
    }
  }

  // Apply camera mirroring based on facing mode
  function applyCameraMirroring(facingMode) {
    if (cameraVideo) {
      if (facingMode === "user") {
        // mirror for front camera
        cameraVideo.style.transform = "scaleX(-1)";
      } else {
        // no mirror for back camera
        cameraVideo.style.transform = "scaleX(1)";
      }
    }
  }

  // Camera functions
  async function startCamera(facingMode) {
    try {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      currentStream = await navigator.mediaDevices.getUserMedia(constraints);
      cameraVideo.srcObject = currentStream;
      currentFacingMode = facingMode;

      // Apply mirroring based on camera type
      applyCameraMirroring(facingMode);

      // Update title
      if (cameraTitle) {
        cameraTitle.textContent =
          facingMode === "user" ? "Front Camera" : "Back Camera";
      }

      return true;
    } catch (error) {
      console.error("Error starting camera:", error);
      showError("image", "Camera access denied or not available");
      return false;
    }
  }

  function stopCamera() {
    if (currentStream) {
      currentStream.getTracks().forEach((track) => track.stop());
      currentStream = null;
    }
    if (cameraVideo) {
      cameraVideo.srcObject = null;
      // Reset transform when stopping camera
      cameraVideo.style.transform = "scaleX(1)";
    }
  }

  function capturePhoto() {
    const canvas = cameraCanvas;
    const video = cameraVideo;

    if (!canvas || !video) {
      showError("image", "Camera elements not available");
      return;
    }

    // Wait for video to be ready
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      showError("image", "Camera not ready. Please wait and try again.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");

    // Handle mirroring for front camera
    if (currentFacingMode === "user") {
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0);
    } else {
      ctx.drawImage(video, 0, 0);
    }

    canvas.toBlob(
      (blob) => {
        // Check if blob is valid
        if (!blob) {
          console.error("Failed to capture image blob");
          showError("image", "Failed to capture image. Please try again.");
          return;
        }

        try {
          capturedImageBlob = new File([blob], "camera-capture.jpg", {
            type: "image/jpeg",
          });

          // Clean up previous object URL
          cleanupObjectUrl();

          // Create object URL safely
          currentObjectUrl = URL.createObjectURL(blob);
          showImagePreview(currentObjectUrl);
          closeCameraModal();
        } catch (error) {
          console.error("Error creating object URL:", error);
          showError(
            "image",
            "Failed to process captured image. Please try again."
          );
        }
      },
      "image/jpeg",
      0.8
    );
  }

  function showImagePreview(src) {
    if (previewImg && imagePreview) {
      previewImg.src = src;
      imagePreview.style.display = "block";
      validateField("image", capturedImageBlob || imageFile.files[0]);
    }
  }

  function hideImagePreview() {
    if (imagePreview && previewImg) {
      imagePreview.style.display = "none";
      previewImg.src = "";
    }
    cleanupObjectUrl();
    capturedImageBlob = null;
    if (imageFile) {
      imageFile.value = "";
    }
  }

  function closeCameraModal() {
    if (cameraModal) {
      cameraModal.style.display = "none";
    }
    stopCamera();
  }

  // Event listeners for camera
  if (frontCameraBtn) {
    frontCameraBtn.addEventListener("click", async () => {
      if (cameraModal) {
        cameraModal.style.display = "block";
        await startCamera("user");
      }
    });
  }

  if (backCameraBtn) {
    backCameraBtn.addEventListener("click", async () => {
      if (cameraModal) {
        cameraModal.style.display = "block";
        await startCamera("environment");
      }
    });
  }

  if (switchCameraBtn) {
    switchCameraBtn.addEventListener("click", async () => {
      const newFacingMode =
        currentFacingMode === "user" ? "environment" : "user";
      await startCamera(newFacingMode);
    });
  }

  if (captureBtn) {
    captureBtn.addEventListener("click", capturePhoto);
  }

  if (closeCameraBtn) {
    closeCameraBtn.addEventListener("click", closeCameraModal);
  }

  // Close modal when clicking outside
  if (cameraModal) {
    cameraModal.addEventListener("click", (e) => {
      if (e.target === cameraModal) {
        closeCameraModal();
      }
    });
  }

  // File input change event
  if (imageFile) {
    imageFile.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        capturedImageBlob = null;
        cleanupObjectUrl();
        const reader = new FileReader();
        reader.onload = (e) => {
          showImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Preview control events
  if (removeImageBtn) {
    removeImageBtn.addEventListener("click", () => {
      hideImagePreview();
      validateField("image", null);
    });
  }

  if (retakeBtn) {
    retakeBtn.addEventListener("click", () => {
      hideImagePreview();
    });
  }

  // Form field validation events
  if (nameField) {
    nameField.addEventListener(
      "input",
      debounce(() => {
        validateField("name", nameField.value);
      }, 300)
    );

    nameField.addEventListener("blur", () => {
      validateField("name", nameField.value);
    });
  }

  if (emailField) {
    emailField.addEventListener(
      "input",
      debounce(() => {
        validateField("email", emailField.value);
      }, 300)
    );

    emailField.addEventListener("blur", () => {
      validateField("email", emailField.value);
    });
  }

  if (phoneField) {
    phoneField.addEventListener(
      "input",
      debounce(() => {
        // Only allow digits and limit to 10 characters
        let value = phoneField.value.replace(/\D/g, "");
        if (value.length > 10) {
          value = value.slice(0, 10);
        }
        phoneField.value = value;
        validateField("phone", phoneField.value);
      }, 300)
    );

    phoneField.addEventListener("blur", () => {
      validateField("phone", phoneField.value);
    });
  }

  if (termsField) {
    termsField.addEventListener("change", () => {
      validateField("terms", termsField.checked);
    });
  }

  // Form submission with improved error handling
  if (form) {
    form.addEventListener("submit", function (e) {
      let isValid = true;

      // Validate all fields
      if (nameField)
        isValid = validateField("name", nameField.value) && isValid;
      if (emailField)
        isValid = validateField("email", emailField.value) && isValid;
      if (phoneField)
        isValid = validateField("phone", phoneField.value) && isValid;
      if (termsField)
        isValid = validateField("terms", termsField.checked) && isValid;
      if (imageFile)
        isValid = validateField("image", imageFile.files[0]) && isValid;

      if (!isValid) {
        e.preventDefault();

        // Focus on first error field
        const firstError = form.querySelector(
          '.form-group.error input, .form-group.error input[type="checkbox"]'
        );
        if (firstError) {
          firstError.focus();
        }
        return;
      }

      // If we have a captured image, we need to add it to the form
      if (capturedImageBlob && (!imageFile || !imageFile.files[0])) {
        e.preventDefault();

        // Create a new FormData and append the captured image
        const formData = new FormData(form);
        formData.delete("image"); // Remove the empty file input
        formData.append("image", capturedImageBlob, "camera-capture.jpg");

        // Show loading state
        if (submitBtn) {
          submitBtn.textContent = "Submitting...";
          submitBtn.disabled = true;
        }

        // Submit via fetch with improved error handling
        fetch(form.action || window.location.pathname, {
          method: "POST",
          body: formData,
        })
          .then(async (response) => {
            if (response.ok) {
              // Simple relative redirect - works for both dev and production
              window.location.href = "/submissions";
            } else {
              // Handle error response
              const contentType = response.headers.get("content-type");
              if (contentType && contentType.includes("text/html")) {
                const html = await response.text();
                document.open();
                document.write(html);
                document.close();
              } else {
                throw new Error(
                  `HTTP ${response.status}: ${response.statusText}`
                );
              }
            }
          })
          .catch((error) => {
            console.error("Error:", error);

            // Reset button state
            if (submitBtn) {
              submitBtn.textContent = "Submit";
              submitBtn.disabled = false;
            }

            // Show user-friendly error message
            if (error.name === "TypeError" && error.message.includes("fetch")) {
              showError(
                "image",
                "Network error. Please check your connection and try again."
              );
            } else if (
              error.message.includes("SSL") ||
              error.message.includes("HTTPS")
            ) {
              showError("image", "Connection error. Please try again.");
            } else {
              showError("image", "Error submitting form. Please try again.");
            }
          });
      } else {
        // Regular form submission
        if (submitBtn) {
          submitBtn.textContent = "Submitting...";
          submitBtn.disabled = true;
        }
      }
    });
  }

  // Hide server errors when user starts typing
  const serverErrors = document.querySelector(".server-errors");
  if (serverErrors) {
    [nameField, emailField, phoneField].forEach((field) => {
      if (field) {
        field.addEventListener(
          "input",
          () => {
            serverErrors.style.display = "none";
          },
          { once: true }
        );
      }
    });
  }

  // Cleanup on page unload
  window.addEventListener("beforeunload", () => {
    stopCamera();
    cleanupObjectUrl();
  });

  // Additional cleanup for page visibility change
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      stopCamera();
    }
  });
});
