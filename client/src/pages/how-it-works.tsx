import { Heading } from "@/components/ui/heading";
import { ServiceIcon } from "@/lib/icons";

export default function HowItWorks() {
  const steps = [
    {
      title: "Enter Your Card Details",
      description: "Simply provide your card name, type, and bank. No sensitive information like card numbers or CVV required.",
      icon: "price-tag-3"
    },
    {
      title: "Select Your Service",
      description: "Choose the service you want to use, such as flight booking, movie tickets, shopping, or bill payments.",
      icon: "shopping-bag"
    },
    {
      title: "View Best Offers",
      description: "Our system analyzes available offers across multiple platforms to find the maximum discount for your card.",
      icon: "information"
    },
    {
      title: "Use the Promo Code",
      description: "Copy the promo code and use it on the corresponding platform to avail your maximum discount.",
      icon: "file-copy"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <section className="mb-12 text-center">
        <Heading 
          title="How DiscountFinder Works"
          description="Get the most out of your cards with our simple process"
          className="mb-6"
        />
      </section>

      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <div className="space-y-12">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <ServiceIcon name={step.icon} className="text-3xl text-primary" />
                </div>
              </div>
              <div>
                <div className="flex items-center mb-3">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-lg font-medium mr-3">
                    {index + 1}
                  </span>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                </div>
                <p className="text-gray-600 ml-11">{step.description}</p>
                
                {index < steps.length - 1 && (
                  <div className="hidden md:block ml-4 mt-6 h-12 border-l-2 border-dashed border-gray-300"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-md p-8 text-white">
        <h3 className="text-2xl font-semibold mb-4">Why Use DiscountFinder?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3 mt-1">
              <ServiceIcon name="information" className="text-yellow-300" />
            </div>
            <div>
              <h4 className="font-medium mb-1">Save Time</h4>
              <p className="text-indigo-100">No more searching across different platforms for the best deal.</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3 mt-1">
              <ServiceIcon name="information" className="text-yellow-300" />
            </div>
            <div>
              <h4 className="font-medium mb-1">Save Money</h4>
              <p className="text-indigo-100">Find the maximum possible discount every time.</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3 mt-1">
              <ServiceIcon name="information" className="text-yellow-300" />
            </div>
            <div>
              <h4 className="font-medium mb-1">Easy to Use</h4>
              <p className="text-indigo-100">Simple interface that anyone can navigate without hassle.</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3 mt-1">
              <ServiceIcon name="information" className="text-yellow-300" />
            </div>
            <div>
              <h4 className="font-medium mb-1">Privacy Focused</h4>
              <p className="text-indigo-100">No sensitive card information required or stored.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}