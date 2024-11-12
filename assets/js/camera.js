import { CameraError } from './errors.js';
import i18n from './i18n.js';
import { showBotFeedback } from './ui.js';

export class Camera {
    constructor(videoElement, videoOverlayElement, canvasElement) {
        this.video = videoElement;
        this.videoOverlay = videoOverlayElement;
        this.canvas = canvasElement;
    }

    async captureImageWithCountdown() {
        let stream = await this.#startCamera();

        video.style.display = 'block';
        canvas.style.display = 'none';

        const imageData = await new Promise((resolve) => {
            this.#startCountdown(() => {
                this.#takePictureWithAnimation(stream).then((imageData) => {
                    resolve(imageData);
                });
            });
        });
        return imageData;
    }

    async #startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            this.videoOverlay.style.opacity = '0';
            this.video.srcObject = stream;
            return stream;
        } catch (error) {
            this.#handleCameraError(error);
            throw new CameraError("Camera error.");
        }
    }

    #stopCamera(stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
    }

    #startCountdown(callback) {
        let countdownValue = 5;
        let countdown = setInterval(() => {
            if (countdownValue > 0) {
                countdownValue--;
                showBotFeedback(i18n.getText('countdown_message', { count: countdownValue }));
            } else {
                clearInterval(countdown);
                callback()
            }
        }, 1000);
    }

    #takePicture() {
        const context = canvas.getContext('2d');

        if (video.videoWidth === 0 || video.videoHeight === 0) {
            console.error("Video element is not ready.");
            return null;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg');
    }

    #takePictureWithAnimation(stream) {
        return new Promise((resolve) => {
            let captureAnimation = document.createElement('div');
            captureAnimation.id = 'captureAnimation';
            document.body.appendChild(captureAnimation);
            captureAnimation.style.display = 'block';

            setTimeout(async () => {
                const imageData = this.#takePicture();
                captureAnimation.style.display = 'none';
                showBotFeedback(i18n.getText('imageTaken'));

                video.style.display = 'none';
                canvas.style.display = 'block';

                this.#drawImageOnCanvas(imageData);

                this.#stopCamera(stream);

                resolve(imageData);

            }, 300);
        });
    }

    #drawImageOnCanvas(imageData) {
        const context = canvas.getContext('2d');
      
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      
        const img = new Image();
        img.onload = function () {
          context.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = imageData;
      }

    #handleCameraError(error) {
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
            console.error("Camera access denied by the user.");
            showBotFeedback(i18n.getText('camera_permission_denied_response'));
            retryButton.style.display = 'block'
        } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
            console.error("No camera found.");
            showBotFeedback(i18n.getText('camera_not_found_response'));
        } else if (error.name === "OverconstrainedError" || error.name === "ConstraintNotSatisfiedError") {
            console.error("Constraints cannot be satisfied by any available camera.");
            showBotFeedback(i18n.getText('camera_constrained_not_satisfied_response'));
        } else {
            console.error("An unknown error occurred while accessing the camera:", error);
            showBotFeedback(i18n.getText('error'));
        }
    }
}
