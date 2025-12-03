import { GoogleGenAI } from "@google/genai";
import { ProcessedImage } from "../types";

// Initialize Gemini Client
// IMPORTANT: process.env.API_KEY is automatically injected.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export type StyleStrength = 'balanced' | 'strong';

/**
 * Helper to resize and compress image before sending to API.
 * Large payloads often cause XHR/RPC errors in browser environments.
 */
const optimizeImage = async (base64: string, mimeType: string): Promise<{ data: string; mimeType: string }> => {
  return new Promise((resolve) => {
    // Safety check for SSR or non-browser environments
    if (typeof window === 'undefined' || typeof Image === 'undefined') {
      resolve({ data: base64, mimeType });
      return;
    }

    const img = new Image();
    img.src = `data:${mimeType};base64,${base64}`;
    
    img.onload = () => {
      const MAX_DIMENSION = 1024;
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions if image is too large
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      } else {
        // If image is small enough, use original to avoid unnecessary processing
        resolve({ data: base64, mimeType });
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ data: base64, mimeType });
        return;
      }

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to JPEG with 0.85 quality for good balance of size/quality
      const newDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      resolve({
        data: newDataUrl.split(',')[1],
        mimeType: 'image/jpeg'
      });
    };

    img.onerror = () => {
      console.warn("Image optimization failed, sending original.");
      resolve({ data: base64, mimeType });
    };
  });
};

/**
 * Generates a Rick and Morty style version of the uploaded image using Gemini.
 * @param inputImage The source image
 * @param strength Controls how aggressively the style overrides the original likeness
 */
export const generateRickAndMortyStyle = async (
  inputImage: ProcessedImage,
  strength: StyleStrength = 'balanced'
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash-image';

    // Optimize image payload size
    const optimizedImage = await optimizeImage(inputImage.base64, inputImage.mimeType);

    const prompt = `
      [STYLE TRANSFER TASK]
      Target: Redraw the source image entirely in the art style of the animated series "Rick and Morty" (Justin Roiland style).
      
      **CRITICAL VISUAL FEATURES (MUST FOLLOW):**
      1.  **EYES:** Characters MUST have perfectly round white eyes with **uneven, scribbly black pupils** (looking like little asterisks or scribbles). This is the specific "Rick and Morty" signature.
      2.  **OUTLINES:** Use thin, consistent black vector lines. No sketchy lines, just clean ink.
      3.  **COLORING:** Use flat, solid colors. **ABSOLUTELY NO** gradients, soft shading, or realistic lighting. Use the show's pale/greyish skin tone palette unless the subject is dark-skinned.
      4.  **MOUTHS:** Use the show's signature "droopy" lips or simple line mouths.
      
      **INTENSITY LEVEL: ${strength === 'strong' ? 'MAXIMUM SCHWIFTINESS (High Stylization)' : 'STANDARD (Balanced)'}**
      
      ${strength === 'strong' 
        ? `**INSTRUCTION - MAXIMUM STYLE:** 
           - **Heavily caricature** the subjects. 
           - Distort realistic proportions to fit the cartoon's "bean-head" and "noodly limb" anatomy. 
           - It is acceptable to sacrifice some facial likeness to achieve the perfect "Adult Swim" cartoon look. 
           - Make the background look like a wobbly alien dimension or a clean vector sci-fi room.
           - The result should look like a screenshot from Season 4.` 
        : `**INSTRUCTION - BALANCED:**
           - Preserve the distinct likeness, pose, and expression of the subjects.
           - Apply the line-art and coloring style of the show, but keep the facial proportions recognizable.
           - Simplify clothing details into the cartoon style.`
      }

      **Output:** Return ONLY the generated image.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              data: optimizedImage.data,
              mimeType: optimizedImage.mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        // Increase creativity slightly for stronger style transfer
        temperature: strength === 'strong' ? 0.75 : 0.65,
      },
    });

    // Extract the image from the response
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No image generated by the model. It might have returned text instead.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};