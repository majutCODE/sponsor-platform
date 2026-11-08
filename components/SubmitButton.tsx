"use client";
import { useFormStatus } from "react-dom";
import Button, { type ButtonProps } from "@/components/arc/button/button";

export default function SubmitButton(props: Omit<ButtonProps, "type">) {
  const { pending } = useFormStatus();
  return <Button type="submit" size="lg" loading={pending} {...props} />;
}
