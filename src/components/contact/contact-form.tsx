"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { sendContactMessageAction } from "@/lib/actions/contact";

const schema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Please enter a valid email"),
  subject: z.string().min(3, "Subject is too short"),
  message: z.string().min(10, "Message should be at least 10 characters"),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  defaultName?: string;
  defaultEmail?: string;
  defaultSubject?: string;
};

export function ContactForm({ defaultName = "", defaultEmail = "", defaultSubject = "" }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: defaultName, email: defaultEmail, subject: defaultSubject, message: "" },
  });

  async function onSubmit(data: FormValues, event?: React.BaseSyntheticEvent) {
    // Honeypot value read straight from the form (not part of the visible fields)
    const form = event?.target as HTMLFormElement | undefined;
    const website = (form?.elements.namedItem("website") as HTMLInputElement | null)?.value;

    const result = await sendContactMessageAction({ ...data, website });
    if (!result.success) {
      toast.error("Message not sent", { description: result.error });
      return;
    }
    toast.success("Message received", {
      description: "We'll get back to you within 24 hours. A copy is on its way to your inbox.",
    });
    reset({ name: data.name, email: data.email, subject: "", message: "" });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Honeypot: invisible to people, tempting to bots */}
      <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="name" className="text-sm">Name</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="Your name"
            className="mt-1.5"
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <p className="mt-1.5 text-xs text-clay-600">{errors.name.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="email" className="text-sm">Email</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="you@example.com"
            className="mt-1.5"
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-clay-600">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="subject" className="text-sm">Subject</Label>
        <Input
          id="subject"
          {...register("subject")}
          placeholder="What can we help with?"
          className="mt-1.5"
          aria-invalid={!!errors.subject}
        />
        {errors.subject && (
          <p className="mt-1.5 text-xs text-clay-600">{errors.subject.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="message" className="text-sm">Message</Label>
        <Textarea
          id="message"
          {...register("message")}
          rows={6}
          placeholder="Tell us about your trip — dates, group size, questions..."
          className="mt-1.5"
          aria-invalid={!!errors.message}
        />
        {errors.message && (
          <p className="mt-1.5 text-xs text-clay-600">{errors.message.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          buttonVariants({ size: "lg" }),
          "rounded-full bg-forest-900 px-8 text-paper hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        {isSubmitting ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}