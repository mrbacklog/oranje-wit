export interface AiProvider {
  sleutel: string;
  label: string;
  placeholder: string;
  helpUrl: string;
}

export const AI_PROVIDERS: AiProvider[] = [
  {
    sleutel: "GOOGLE_GENERATIVE_AI_API_KEY",
    label: "Google Gemini",
    placeholder: "AIzaSy...",
    helpUrl: "https://aistudio.google.com/apikey",
  },
];
