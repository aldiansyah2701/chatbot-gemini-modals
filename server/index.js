import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv"
import express from "express";
import multer from "multer";
import fs from 'fs/promises';
import cors from "cors";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const models = process.env.MODELS;

const ai = new GoogleGenAI({ apiKey });

// const interaction = await ai.interactions.create({
//   model: models,
//   input: "jelaskan apakah nadim itu bersalah terkait kasus yang menimpanya",
// });
// console.log(interaction.output_text);



const app = express();
const upload = multer();
const port = 3000;

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello aldia!f");
});

app.post('/generate-text', async (req, res) => {
  const { prompt } = req.body;  
  try {
    const interaction = await ai.interactions.create({
      model: models,  
      input: prompt,
    });
    res.json({ output: interaction.output_text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while generating text.' });
  } 
});

app.post('/generate-image', upload.single('image'), async (req, res) => {
  const { prompt } = req.body;
  const base64Image = req.file.buffer.toString('base64');
  // console.log('base64Image:', base64Image); // Log base64 image data for debugging
  try {
    const interaction = await ai.models.generateContent({
      model: models,
      contents: [
        prompt, // Teks dari req.body
        {
          inlineData: {
            data: base64Image,
            mimeType: req.file.mimetype
          }
        }
      ],
    });
    console.log('interaction:', interaction.text); // Log the interaction object for debugging
    res.json({ output: interaction.text });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while generating image.' });
    }          
  });

  app.post('/generate-document', upload.single('document'), async (req, res) => {
  const { prompt } = req.body;
  const base64Document = req.file.buffer.toString('base64');
  // console.log('base64Document:', base64Document); // Log base64 document data for debugging
  try {
    const interaction = await ai.models.generateContent({
      model: models,
      contents: [
        prompt, // Teks dari req.body
        {
          inlineData: {
            data: base64Document,
            mimeType: req.file.mimetype
          }
        }
      ],
    });
    console.log('interaction:', interaction.text); // Log the interaction object for debugging
    res.json({ output: interaction.text });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while generating image.' });
    }          
  });

app.post('/api/chat', async (req, res) => {
  const { prompt } = req.body;  
  try {

    if (!Array.isArray(prompt)) throw new Error('Prompt must be an array of messages.');

    const contents = prompt.map(({role, text}) => ({
      role,
      parts: [{ type: 'text', text }]
    }));

    const response = await ai.models.generateContent({
      model: models,
      contents,
      config: {
        temperature: 0.9,
        systemInstruction: "jawab menggunakan bahasa Indonesia dan scope nya hanya tentang pertumbuhan anak selain itu jawab pertanyaan tidak sesuai.",
      },
    });
    // const interaction = await ai.interactions.create({
    //   model: models,  
    //   input: prompt,
    // });
    res.json({ output: response.text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while generating text.' });
  } 
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
