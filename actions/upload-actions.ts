"use server";
import getDbConnection from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AssemblyAI } from 'assemblyai'
//import OpenAI from "openai";
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY||"na"
})

export async function transcribeUploadedFile(
  resp: {
    serverData: { userId: string; file: any };
  }[]
) {
  if (!resp) {
    return {
      success: false,
      message: "File upload failed",
      data: null,
    };
  }

  const {
    serverData: {
      userId,
      file: { url: fileUrl, name: fileName },
    },
  } = resp[0];

  if (!fileUrl || !fileName) {
    return {
      success: false,
      message: "File upload failed",
      data: null,
    };
  }

  const config = {
    audio_url: fileUrl,
  }

  try {
    // const transcriptions = await openai.audio.transcriptions.create({
    //   model: "whisper-1",
    //   file: response,
    // });
    // console.log({ transcriptions });
    
      const transcriptionss = await client.transcripts.transcribe(config)
      const transcriptions = {text: transcriptionss.text}
      //console.log(transcriptionss.text);

    return {
      success: true,
      message: "File uploaded successfully!",
      data: { transcriptions, userId },
    };
  } catch (error) {
    console.error("Error processing file", error);

    // if (error instanceof OpenAI.APIError && error.status === 413) {
    //   return {
    //     success: false,
    //     message: "File size exceeds the max limit of 20MB",
    //     data: null,
    //   };
    // }

    return {
      success: false,
      message: error instanceof Error ? error.message : "Error processing file",
      data: null,
    };
  }
}

async function saveBlogPost(userId: string, title: string, content: string) {
  try {
    const sql = await getDbConnection();
    const [insertedPost] = await sql`
    INSERT INTO posts (user_id, title, content)
    VALUES (${userId}, ${title}, ${content})
    RETURNING id
    `;
    return insertedPost.id;
  } catch (error) {
    console.error("Error saving blog post", error);
    throw error;
  }
}

async function getUserBlogPosts(userId: string) {
  try {
    const sql = await getDbConnection();
    const posts = await sql`
    SELECT content FROM posts 
    WHERE user_id = ${userId} 
    ORDER BY created_at DESC 
    LIMIT 3
  `;
    return posts.map((post) => post.content).join("\n\n");
  } catch (error) {
    console.error("Error getting user blog posts", error);
    throw error;
  }
}

async function generateBlogPost({
  transcriptions,
  userPosts,
}: {
  transcriptions: string | null | undefined;
  userPosts: string;
}) {

  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
  };
  
  const chatSession = model.startChat({
      generationConfig,
   // safetySettings: Adjust safety settings
   // See https://ai.google.dev/gemini-api/docs/safety-settings
      history: [
      ],
    });
    //use previous posts as history if needed.

    const systemRole = `You are a skilled content writer that converts audio transcriptions into well-structured, engaging blog posts in Markdown format. Create a comprehensive blog post with a catchy title, introduction, main body with multiple sections, and a conclusion. Analyze the user's writing style and emulate their tone and style in the post. Keep the tone casual and professional.`;

    const userInstruction = `Please convert the transcription into a well-structured blog post using Markdown formatting. Follow this structure:

1. Start with a SEO friendly catchy title on the first line.
2. Add two newlines after the title.
3. Write an engaging introduction paragraph.
4. Create multiple sections for the main content, using appropriate headings (##, ###).
5. Include relevant subheadings within sections if needed.
6. Use bullet points or numbered lists where appropriate.
7. Add a conclusion paragraph at the end.
8. Ensure the content is informative, well-organized, and easy to read.
`;

    const FinalAIPrompt=`'${systemRole}' | '${userInstruction}' | 'Here's the transcription to convert: ${transcriptions}'`;

    const result = await chatSession.sendMessage(FinalAIPrompt);
    const output=result?.response.text();

//   const completion = await openai.chat.completions.create({
//     messages: [
//       {
//         role: "system",
//         content:
//           "You are a skilled content writer that converts audio transcriptions into well-structured, engaging blog posts in Markdown format. Create a comprehensive blog post with a catchy title, introduction, main body with multiple sections, and a conclusion. Analyze the user's writing style from their previous posts and emulate their tone and style in the new post. Keep the tone casual and professional.",
//       },
//       {
//         role: "user",
//         content: `Here are some of my previous blog posts for reference:

// ${userPosts}

// Please convert the following transcription into a well-structured blog post using Markdown formatting. Follow this structure:

// 1. Start with a SEO friendly catchy title on the first line.
// 2. Add two newlines after the title.
// 3. Write an engaging introduction paragraph.
// 4. Create multiple sections for the main content, using appropriate headings (##, ###).
// 5. Include relevant subheadings within sections if needed.
// 6. Use bullet points or numbered lists where appropriate.
// 7. Add a conclusion paragraph at the end.
// 8. Ensure the content is informative, well-organized, and easy to read.
// 9. Emulate my writing style, tone, and any recurring patterns you notice from my previous posts.

// Here's the transcription to convert: ${transcriptions}`,
//       },
//     ],
//     model: "gpt-4o-mini",
//     temperature: 0.7,
//     max_tokens: 1000,
//   });
  return output;
}

export async function generateBlogPostAction({
  transcriptions,
  userId,
}: {
  transcriptions: { text: string | null | undefined};
  userId: string;
}) {
  const userPosts = await getUserBlogPosts(userId);

  let postId = null;

  if (transcriptions) {
    const blogPost = await generateBlogPost({
      transcriptions: transcriptions.text,
      userPosts,
    });

    if (!blogPost) {
      return {
        success: false,
        message: "Blog post generation failed, please try again...",
      };
    }

    const [title, ...contentParts] = blogPost?.split("\n\n") || [];

    //database connection

    if (blogPost) {
      postId = await saveBlogPost(userId, title, blogPost);
    }
  }

  //navigate
  revalidatePath(`/posts/${postId}`);
  redirect(`/posts/${postId}`);
}
