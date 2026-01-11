"use client";

import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FeedbackModal } from "./feedback-modal";
import { cn } from "@/lib/utils";

interface FeedbackButtonProps {
  className?: string;
}

export function FeedbackButton({ className }: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="default"
            size="icon"
            className={cn(
              "fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg",
              "bg-primary hover:bg-primary/90",
              "transition-all duration-200 hover:scale-105",
              isOpen && "scale-0 opacity-0",
              className
            )}
            onClick={() => setIsOpen(true)}
          >
            <MessageSquarePlus className="h-5 w-5" />
            <span className="sr-only">Enviar Feedback</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Enviar Feedback</p>
        </TooltipContent>
      </Tooltip>

      <FeedbackModal open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
