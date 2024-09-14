"use client";

import { z } from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useToast } from "@/hooks/use-toast";
import { useUploadThing } from "@/utils/uploadthing";
import {
  generateBlogPostAction,
  transcribeUploadedFile,
} from "@/actions/upload-actions";
import getDbConnection from "@/lib/db";
import { createOrUpdateUser, updateUserSubscription } from "@/lib/payment-helpers";
import { updateUser } from "@/lib/user-helpers";
import { useUser } from "@clerk/nextjs";

const schema = z.object({
  file: z
    .instanceof(File, { message: "Invalid file" })
    .refine(
      (file) => file.size <= 20 * 1024 * 1024,
      "File size must not exceed 20MB"
    )
    .refine(
      (file) =>
        file.type.startsWith("audio/") || file.type.startsWith("video/"),
      "File must be an audio or a video file"
    ),
});

export default function UploadForm() {
  const { toast } = useToast();
  const {user, isLoaded} = useUser();

  const { startUpload } = useUploadThing("videoOrAudioUploader", {
    onClientUploadComplete: () => {
      toast({ title: "uploaded successfully!" });
    },
    onUploadError: (err) => {
      console.error("Error occurred", err);
    },
    onUploadBegin: () => {
      toast({ title: "Upload has begun 🚀!" });
    },
  });

  const handleTranscribe = async (formData: FormData) => {

    if(!user){
      toast({
        title:"Something went Wrong ❌, Try Again"
      })
      return;
    }
    toast({ title: "Let's Go 💭" });
    const sql = await getDbConnection();
    const query = await sql`SELECT * FROM users where email = ${user?.primaryEmailAddress?.emailAddress}`;
    if (query && query.length > 0) {
    //console.log("user Exist: ", query);
    const planDetails = query[0].subscription_id;
    if(planDetails=="na"){
      toast({
        title:"Getting your Details... 🚀",
      })
      const posts = await sql`SELECT * from posts where user_id = ${user.id}`;
      if(posts.length>=2){
        await sql`UPDATE users SET status = 'cancelled' where email = ${user?.primaryEmailAddress?.emailAddress}`;
      }
    }
    }
    else{
      toast({
        title:"Setting up your Account 🚀",
        description: "We are exited for your 1st blog post...",
      })
      await createOrUpdateUser(sql, user);
      if(user?.primaryEmailAddress?.emailAddress){
      await updateUserSubscription(sql, "na", user?.primaryEmailAddress?.emailAddress);
      await updateUser(sql, user.id, user?.primaryEmailAddress?.emailAddress);
      }
    }

    const file = formData.get("file") as File;

    const validatedFields = schema.safeParse({ file });

    if (!validatedFields.success) {
      console.log(
        "validatedFields",
        validatedFields.error.flatten().fieldErrors
      );
      toast({
        title: "❌ Something went wrong",
        variant: "destructive",
        description:
          validatedFields.error.flatten().fieldErrors.file?.[0] ??
          "Invalid file",
      });
    }

    if (file) {
      const resp: any = await startUpload([file]);
      //console.log({ resp });

      if (!resp) {
        toast({
          title: "Something went wrong",
          description: "Please use a different file",
          variant: "destructive",
        });
      }
      toast({
        title: "🎙️ Transcription is in progress...",
        description:
          "Hang tight! Our digital wizards are sprinkling magic dust on your file! ✨",
      });

      const result = await transcribeUploadedFile(resp);
      const { data = null, message = null } = result || {};

      if (!result || (!data && !message)) {
        toast({
          title: "An unexpected error occurred",
          description:
            "An error occurred during transcription. Please try again.",
        });
      }

      if (data) {
        toast({
          title: "🤖 Generating AI blog post...",
          description: "Please wait while we generate your blog post.",
        });

        await generateBlogPostAction({
          transcriptions: data.transcriptions,
          userId: data.userId,
        });

        toast({
          title: "🎉 Woohoo! Your AI blog is created! 🎊",
          description:
            "Time to put on your editor hat, Click the post and edit it!",
        });
      }
    }
  };
  return (
    <form className="flex flex-col gap-6" action={handleTranscribe}>
      <div className="flex justify-end items-center gap-1.5">
        <Input
          id="file"
          name="file"
          type="file"
          accept="audio/*,video/*"
          required
        />
        <Button className="bg-purple-600">Transcribe</Button>
      </div>
    </form>
  );
}
