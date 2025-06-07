import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

export const diagnoseSound = async (req, res) => {
  try {
    const filePath = req.file.path;

    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    const response = await axios.post('http://localhost:8001/analyze-audio/', form, {
      headers: form.getHeaders(),
    });

    res.json({ transcription: response.data.transcription });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
