export interface ImageEditParams {
  image: string; // base64-encoded image
  prompt: string;
  mask?: string; // base64-encoded mask (optional)
  model?: string;
  n?: number;
  size?: string;
  response_format?: string;
}

export interface AnimateImageParams {
  image: string; // base64-encoded image
  model?: string;
  prompt?: string;
  duration?: number;
  fps?: number;
  motion_bucket_id?: number;
  cond_aug?: number;
}

export interface AudioTranscriptionParams {
  file: string; // base64-encoded audio
  model: string;
  language?: string;
  prompt?: string;
  response_format?: string;
  temperature?: number;
  filename?: string;
}

export function buildImageEditForm(params: ImageEditParams): FormData {
  const form = new FormData();

  const imageBuffer = Buffer.from(params.image, "base64");
  const imageBlob = new Blob([imageBuffer], { type: "image/png" });
  form.append("image", imageBlob, "image.png");

  form.append("prompt", params.prompt);

  if (params.mask) {
    const maskBuffer = Buffer.from(params.mask, "base64");
    const maskBlob = new Blob([maskBuffer], { type: "image/png" });
    form.append("mask", maskBlob, "mask.png");
  }

  if (params.model !== undefined) form.append("model", params.model);
  if (params.n !== undefined) form.append("n", String(params.n));
  if (params.size !== undefined) form.append("size", params.size);
  if (params.response_format !== undefined) form.append("response_format", params.response_format);

  return form;
}

export function buildAnimateImageForm(params: AnimateImageParams): FormData {
  const form = new FormData();

  const imageBuffer = Buffer.from(params.image, "base64");
  const imageBlob = new Blob([imageBuffer], { type: "image/png" });
  form.append("image", imageBlob, "image.png");

  if (params.model !== undefined) form.append("model", params.model);
  if (params.prompt !== undefined) form.append("prompt", params.prompt);
  if (params.duration !== undefined) form.append("duration", String(params.duration));
  if (params.fps !== undefined) form.append("fps", String(params.fps));
  if (params.motion_bucket_id !== undefined) form.append("motion_bucket_id", String(params.motion_bucket_id));
  if (params.cond_aug !== undefined) form.append("cond_aug", String(params.cond_aug));

  return form;
}

export function buildAudioTranscriptionForm(params: AudioTranscriptionParams): FormData {
  const form = new FormData();

  const audioBuffer = Buffer.from(params.file, "base64");
  const filename = params.filename ?? "audio.mp3";
  const audioBlob = new Blob([audioBuffer], { type: "audio/mpeg" });
  form.append("file", audioBlob, filename);

  form.append("model", params.model);

  if (params.language !== undefined) form.append("language", params.language);
  if (params.prompt !== undefined) form.append("prompt", params.prompt);
  if (params.response_format !== undefined) form.append("response_format", params.response_format);
  if (params.temperature !== undefined) form.append("temperature", String(params.temperature));

  return form;
}
