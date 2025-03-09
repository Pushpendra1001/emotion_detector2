const { PythonShell } = require('python-shell');
const path = require('path');

class EmotionDetector {
    constructor() {
        this.pythonPath = path.join(__dirname, '../emotion_detector/model_service.py');
    }

    async detectEmotion(imageBase64) {
        return new Promise((resolve, reject) => {
            let options = {
                mode: 'json',
                pythonPath: 'python',
                pythonOptions: ['-u'],
                scriptPath: path.dirname(this.pythonPath),
                args: [imageBase64]
            };

            PythonShell.run(this.pythonPath, options, function (err, results) {
                if (err) reject(err);
                resolve(results[0]); // Get first result
            });
        });
    }
}

module.exports = new EmotionDetector();