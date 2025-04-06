import { Heading } from "@/components/ui/heading";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "wouter";

export default function FAQs() {
  const faqItems = [
    {
      question: "What is DiscountFinder?",
      answer: "DiscountFinder is a web application that helps you find the best discounts across various booking services based on your card information. It analyzes available offers to recommend the maximum possible discount for your specific card and service selection."
    },
    {
      question: "Do I need to provide my card number or other sensitive information?",
      answer: "No. We only ask for your card name (like 'HDFC Millennia Credit Card'), card type, and bank name. We never ask for or store sensitive information such as card numbers, expiry dates, or CVV codes."
    },
    {
      question: "How does DiscountFinder find the best discount?",
      answer: "Our system analyzes offers from multiple platforms based on factors like discount percentage, maximum discount amount, minimum transaction requirements, and card-specific offers. We then present the offer that will give you the maximum discount based on your specific card and service selection."
    },
    {
      question: "Which services are currently supported?",
      answer: "We currently support discounts for bus bookings, flight bookings, movie tickets, bill payments, hotel bookings, food ordering, shopping, and cab bookings. We're regularly expanding our coverage to include more services."
    },
    {
      question: "How frequently is the discount information updated?",
      answer: "We update our database regularly to ensure you get the most current offers. However, please note that offers may change or expire at the discretion of the service providers. Always verify the offer details before making a transaction."
    },
    {
      question: "Why do I need to select a card type and bank?",
      answer: "Different cards offer different discounts based on factors like card type (credit, debit, etc.) and the issuing bank. Providing this information helps us find offers that are specifically applicable to your card."
    },
    {
      question: "Are the promo codes guaranteed to work?",
      answer: "We do our best to provide accurate and current promo codes. However, offers may be subject to additional terms and conditions set by the service providers. Always check the platform's offer details before completing your transaction."
    },
    {
      question: "Is there a fee for using DiscountFinder?",
      answer: "No, DiscountFinder is completely free to use. We help you save money without charging you anything."
    },
    {
      question: "Can I save my card information for future searches?",
      answer: "Currently, we don't offer the option to save your card information. You'll need to enter your details each time you use the service. This also helps ensure your information remains private and secure."
    },
    {
      question: "I found an offer that's not listed on DiscountFinder. How can I report it?",
      answer: "We appreciate your help in making our platform more comprehensive! Please contact us through our Contact page with details about the offer, and we'll review and add it to our database."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <section className="mb-12 text-center">
        <Heading 
          title="Frequently Asked Questions"
          description="Find answers to common questions about DiscountFinder"
          className="mb-6"
        />
      </section>

      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <Accordion type="single" collapsible className="w-full">
          {faqItems.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-lg font-medium text-left hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                <p>{item.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-md p-8 text-white text-center">
        <h3 className="text-xl font-semibold mb-4">Still have questions?</h3>
        <p className="mb-6">Our support team is here to help you with any other questions you might have.</p>
        <Link href="/contact" className="inline-block px-6 py-3 bg-white text-primary font-medium rounded-md hover:bg-gray-100 transition-colors">
          Contact Us
        </Link>
      </div>
    </div>
  );
}