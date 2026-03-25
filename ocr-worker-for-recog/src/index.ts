/**
 * ocr-worker-for-recog/src/index.ts
 * Cloudflare Worker that provides AI-powered image analysis.
 * It uses the @cf/llava-hf/llava-1.5-7b-hf model for image captioning
 * and the @cf/facebook/detr-resnet-50 model for object detection.
 */

export default {
  async fetch(request: Request, env: any, ctx: any) {

    if (request.method !== "POST") {
      return new Response("Use POST with form-data containing 'image'", {
        status: 400,
      });
    }

    const form = await request.formData();
    const file = form.get("image") as File;
    if (!file) {
      return new Response("No image found in form-data", { status: 400 });
    }

    const imageBuffer = await file.arrayBuffer();
    const imageArray = [...new Uint8Array(imageBuffer)];

    // STEP 1 — IMAGE CAPTIONING
    const captionResponse = await env.AI.run(
      "@cf/llava-hf/llava-1.5-7b-hf",
      {
        image: imageArray,
        prompt: "Describe the main object clearly.",
        max_tokens: 150
      }
    );

    const caption =
      captionResponse.text ||
      captionResponse.output ||
      captionResponse.description ||
      "";

    // STEP 2 — OBJECT DETECTION
    const detectionResponse = await env.AI.run(
      "@cf/facebook/detr-resnet-50",
      {
        image: imageArray
      }
    );

    return new Response(
      JSON.stringify(
        {
          caption,
          detections: detectionResponse
        },
        null,
        2
      ),
      { headers: { "Content-Type": "application/json" } }
    );
  }
};