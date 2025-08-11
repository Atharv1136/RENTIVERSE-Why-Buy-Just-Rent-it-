import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface TermsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
  onDecline: () => void;
}

export function TermsDialog({ isOpen, onOpenChange, onAccept, onDecline }: TermsDialogProps) {
  const [isChecked, setIsChecked] = useState(false);

  const termsAndConditions = [
    {
      title: "Rental Agreement Terms",
      content: [
        "You agree to use the rented items responsibly and return them in the same condition as received.",
        "Any damage to the rented items during the rental period will be charged to you at replacement cost.",
        "You must return the items on or before the agreed return date. Late returns may incur additional charges.",
        "You are responsible for the safety and security of the rented items during the rental period."
      ]
    },
    {
      title: "Payment Terms", 
      content: [
        "Payment must be made in full before the items are delivered or picked up.",
        "All payments are processed securely through Razorpay payment gateway.",
        "Cancellations must be made at least 24 hours before the rental start date for a full refund.",
        "Partial refunds may apply for cancellations made within 24 hours of rental start date."
      ]
    },
    {
      title: "Liability and Insurance",
      content: [
        "You acknowledge that you are renting items at your own risk.",
        "Rentiverse and the product owner are not liable for any injuries or damages that may occur during the rental period.",
        "You may be required to provide proof of insurance for high-value items.",
        "You agree to indemnify and hold harmless Rentiverse and the product owner from any claims arising from your use of the rented items."
      ]
    },
    {
      title: "General Terms",
      content: [
        "This agreement is governed by the laws of India.",
        "Any disputes will be resolved in the courts of Mumbai, Maharashtra.",
        "Rentiverse reserves the right to modify these terms at any time.",
        "By proceeding with the rental, you acknowledge that you have read, understood, and agree to be bound by these terms."
      ]
    }
  ];

  const handleAccept = () => {
    if (isChecked) {
      onAccept();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-renti-navy">
            Terms and Conditions
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Please read and accept the terms and conditions to proceed with your rental.
          </p>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            {termsAndConditions.map((section, index) => (
              <div key={index}>
                <h3 className="font-semibold text-renti-navy mb-3">
                  {section.title}
                </h3>
                <ul className="space-y-2">
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-sm text-gray-700 leading-relaxed">
                      • {item}
                    </li>
                  ))}
                </ul>
                {index < termsAndConditions.length - 1 && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="space-y-4">
          <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
            <Checkbox 
              id="terms" 
              checked={isChecked} 
              onCheckedChange={(checked) => setIsChecked(checked as boolean)}
            />
            <label 
              htmlFor="terms" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I have read and agree to the terms and conditions above
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <Button 
              variant="outline" 
              onClick={() => {
                onDecline();
                onOpenChange(false);
              }}
            >
              Decline
            </Button>
            <Button 
              className="bg-renti-teal hover:bg-renti-teal/90" 
              onClick={handleAccept}
              disabled={!isChecked}
            >
              Accept & Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}