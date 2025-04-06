import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";
import { insertCardSchema } from "@shared/schema";
import { bankOptions, cardTypes } from "@/lib/data";
import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { addCard } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, CreditCardIcon, Wallet, CircleDollarSign } from "lucide-react";

type AddCardDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Extend the insert schema to add validation
const formSchema = insertCardSchema.extend({
  name: z.string().min(2, "Card name must be at least 2 characters"),
  bank: z.string().min(1, "Please select a bank"),
  type: z.string().min(1, "Please select a card type"),
});

type FormValues = z.infer<typeof formSchema>;

export default function AddCardDialog({ open, onOpenChange }: AddCardDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      bank: "",
      type: "credit",
    },
  });
  
  const { mutate, isPending } = useMutation({
    mutationFn: addCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cards'] });
      form.reset();
      onOpenChange(false);
      toast({
        title: "Card added",
        description: "Your card has been added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add card. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: FormValues) => {
    mutate(data);
  };
  
  // Card type info for display
  const getCardTypeInfo = (type: string) => {
    switch (type) {
      case 'credit':
        return {
          icon: <CreditCardIcon className="h-4 w-4 mr-2" />,
          description: "Use for credit card offers and cashback rewards"
        };
      case 'debit':
        return {
          icon: <Wallet className="h-4 w-4 mr-2" />,
          description: "Use for debit card discount offers from your bank"
        };
      case 'prepaid':
        return {
          icon: <CircleDollarSign className="h-4 w-4 mr-2" />,
          description: "Use for prepaid card special promotions"
        };
      case 'forex':
        return {
          icon: <CreditCard className="h-4 w-4 mr-2" />,
          description: "Use for foreign exchange cards with travel benefits"
        };
      default:
        return {
          icon: <CreditCard className="h-4 w-4 mr-2" />,
          description: ""
        };
    }
  };

  // Get the current selected card type info
  const currentType = form.watch('type');
  const cardTypeInfo = getCardTypeInfo(currentType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Card</DialogTitle>
          <DialogDescription>
            Add your card details to find the best discount offers across platforms
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Card Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., IDFC First Millennial" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter the specific name of your card (e.g., HDFC Regalia, SBI SimplySAVE)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Card Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select card type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cardTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center">
                            {getCardTypeInfo(type.id).icon}
                            {type.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {cardTypeInfo.description}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="bank"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Name</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select bank" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-60">
                      {bankOptions.map((bank) => (
                        <SelectItem key={bank.id} value={bank.name}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the bank that issued your card
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Adding..." : "Add Card"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
