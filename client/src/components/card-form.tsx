import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const cardFormSchema = z.object({
  cardName: z.string().min(2, "Card name must be at least 2 characters"),
  cardType: z.string().min(1, "Please select a card type"),
  bankName: z.string().min(1, "Please select a bank name"),
});

export type CardFormValues = z.infer<typeof cardFormSchema>;

interface CardFormProps {
  onFormChange: (values: CardFormValues) => void;
  initialValues?: CardFormValues;
}

export function CardForm({ onFormChange, initialValues }: CardFormProps) {
  // Setup form with default values or initialValues if provided
  const defaultValues = {
    cardName: initialValues?.cardName || "",
    cardType: initialValues?.cardType || "",
    bankName: initialValues?.bankName || "",
  };

  const form = useForm<CardFormValues>({
    resolver: zodResolver(cardFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const [formValues, setFormValues] = useState<CardFormValues>(defaultValues);

  // Reset form when initialValues change
  useEffect(() => {
    if (initialValues) {
      form.reset({
        cardName: initialValues.cardName,
        cardType: initialValues.cardType,
        bankName: initialValues.bankName,
      });
      setFormValues(initialValues);
    }
  }, [initialValues, form]);

  // Watch for form changes and notify parent component
  const handleFormChange = (field: keyof CardFormValues, value: string) => {
    const newValues = { ...formValues, [field]: value };
    setFormValues(newValues);
    onFormChange(newValues);
  };

  const predefinedCards = {
    HDFC: [
      "HDFC Diners Club Black",
      "HDFC Diners Club Black Credit Card",
      "HDFC EasyShop Platinum Debit Card",
      "HDFC EasyShop Titanium Royale Debit Card",
      "HDFC FoodPlus Card",
      "HDFC GiftPlus Card",
      "HDFC Millennia",
      "HDFC Millennia Credit Card",
      "HDFC Multicurrency Platinum ForexPlus Card",
      "HDFC Regalia",
      "HDFC Regalia Credit Card",
      "HDFC Regalia ForexPlus Card",
    ],
    SBI: [
      "SBI Elite Credit Card",
      "SBI Foreign Travel Card",
      "SBI Gift Card",
      "SBI Global International Debit Card",
      "SBI IRCTC Credit Card",
      "SBI Multi-Currency Foreign Travel Card",
      "SBI Platinum Debit Card",
      "SBI Prime Credit Card",
      "SBI SimplyCLICK Credit Card",
      "SBI Smart Payout Card",
      "SimplySAVE SBI Card",
    ],
    ICICI: [
      "ICICI Coral Credit Card",
      "ICICI Coral Debit Card",
      "ICICI Coral Forex Prepaid Card",
      "ICICI Expressions Debit Card",
      "ICICI Gift Card",
      "ICICI PayDirect Card",
      "ICICI Platinum Chip Credit Card",
      "ICICI Rubyx Credit Card",
      "ICICI Sapphiro Credit Card",
      "ICICI Travel Card (Multi-Currency)",
    ],
    AXIS: [
      "Axis Bank ACE Credit Card",
      "Axis Bank Diners Forex Card",
      "Axis Bank Flipkart Credit Card",
      "Axis Bank Gift Card",
      "Axis Bank Magnus Credit Card",
      "Axis Bank Meal Card",
      "Axis Bank Millennia",
      "Axis Bank Multi-Currency Forex Card",
      "Axis Bank Priority Debit Card",
      "Axis Bank Privilege Credit Card",
      "Axis Bank Vistara Credit Card",
      "Axis Burgundy Debit Card",
      "Axis My Zone Credit Card",
    ],
    kotak: [
      "Kotak 811 Credit Card",
      "Kotak Essentia Platinum Card",
      "Kotak Forex Card",
      "Kotak Gift Card",
      "Kotak Indigo Ka-Ching Credit Card",
      "Kotak League Platinum Credit Card",
      "Kotak Multi-Currency World Travel Card",
      "Kotak NetC@rd (Virtual)",
      "Kotak Platinum Debit Card",
      "Kotak Royale Signature Credit Card",
      "Kotak Silk Debit Card",
    ],
    citi: [
      "Citi Cashback Credit Card",
      "Citi PremierMiles Credit Card",
      "Citi Prepaid Gift Card (corporate use)",
      "Citi Rewards Credit Card",
      "Citibank Platinum Debit Card",
      "Citibank World Money Card (discontinued now)",
    ],
    hsbc: [
      "HSBC Advance Visa Platinum Debit Card",
      "HSBC Platinum Credit Card",
      "HSBC Premier Platinum Debit Card",
      "HSBC Smart Value Credit Card",
    ],
    idfc: [
      "IDFC FIRST Classic Credit Card",
      "IDFC FIRST Select Credit Card",
      "IDFC FIRST Titanium Debit Card",
      "IDFC FIRST Visa Signature Debit Card",
      "IDFC FIRST Wealth Credit Card",
    ],
    RBL: [
      "RBL Gift Card",
      "RBL Multi-Currency Card",
      "RBL PayDirect Card",
      "RBL Platinum Debit Card",
      "RBL Platinum Maxima Credit Card",
      "RBL Popcorn Credit Card",
      "RBL Prime Debit Card",
      "RBL ShopRite Credit Card",
    ],
    YES: [
      "YES Bank Gift Card",
      "YES Bank Multi-Currency Travel Card",
      "YES First Exclusive Credit Card",
      "YES First World Debit Card",
      "YES Pay Card",
      "YES Prosperity Edge Credit Card",
      "YES Prosperity Titanium Debit Card",
    ],
  };

  const filteredCards = formValues.bankName
    ? predefinedCards[formValues.bankName.toLowerCase()] ||
      predefinedCards[formValues.bankName.toUpperCase()] ||
      []
    : [];

  return (
    <section className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h3 className="text-lg font-semibold mb-4">Your Card Details</h3>

      <Form {...form}>
        <form className="space-y-4">
          <FormField
            control={form.control}
            name="bankName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Bank Name
                </FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleFormChange("bankName", value);
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary">
                      <SelectValue placeholder="Select your bank" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="AXIS">Axis Bank</SelectItem>
                    <SelectItem value="CITI">Citi Bank</SelectItem>
                    <SelectItem value="HDFC">HDFC Bank</SelectItem>
                    <SelectItem value="HSBC">HSBC Bank</SelectItem>
                    <SelectItem value="ICICI">ICICI Bank</SelectItem>
                    <SelectItem value="IDFC">IDFC Bank</SelectItem>
                    <SelectItem value="KOTAK">Kotak Mahindra Bank</SelectItem>
                    <SelectItem value="RBL">RBL Bank</SelectItem>
                    <SelectItem value="SBI">State Bank of India</SelectItem>
                    <SelectItem value="YES">Yes Bank</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cardType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Card Type
                </FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleFormChange("cardType", value);
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary">
                      <SelectValue placeholder="Select your card type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="credit">Credit Card</SelectItem>
                    <SelectItem value="debit">Debit Card</SelectItem>
                    <SelectItem value="forex">Forex Card</SelectItem>
                    <SelectItem value="prepaid">Prepaid Card</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cardName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Card Name
                </FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleFormChange("cardName", value);
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary">
                      <SelectValue placeholder="Select or enter your card name" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {formValues.bankName ? (
                      <SelectGroup>
                        <SelectLabel className="capitalize">
                          {formValues.bankName.toUpperCase()} Bank Cards
                        </SelectLabel>
                        {filteredCards.map((card) => (
                          <SelectItem key={card} value={card}>
                            {card}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ) : (
                      <SelectItem value="select-bank" disabled>
                        Select a bank first
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Or type your card name manually"
                  className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                  value={field.value}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    handleFormChange("cardName", e.target.value);
                  }}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </section>
  );
}
