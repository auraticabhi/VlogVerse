export const plansMap = [
  {
    id: "basic",
    name: "Free",
    description: "Get started with VlogVerse!",
    price: "0",
    items: ["3 Blog Posts", "3 Transcription"],
    paymentLink: "na",
    priceId:
      process.env.NODE_ENV === "development"
        ? "na"
        : "na",
  },
  {
    id: "pro",
    name: "Pro",
    description: "All Blog Posts, let’s go!",
    price: "19.99",
    items: ["Unlimited Blog Posts", "Unlimited Transcriptions"],
    paymentLink: "na",
    priceId:
      process.env.NODE_ENV === "development"
        ? "na"
        : "na",
  },
];

export const ORIGIN_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://vlogverse.vercel.app";
