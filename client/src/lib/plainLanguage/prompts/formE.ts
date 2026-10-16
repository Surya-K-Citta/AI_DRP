// Plain wording for the labels used when a business is a service or a trader.
export const PROMPTS: Record<string, { ask: string; help?: string; example?: string }> = {
  "Equipment & assets (₹ Lakhs)": { ask: "What is the total cost of the equipment and assets you need?", help: "Add up equipment, furniture, a vehicle, computers and software. If you list them above, this fills in by itself.", example: "2.5" },
  "Materials & supplies (₹ Lakhs)": { ask: "How much will you spend on materials and supplies in a year?", help: "Things you use up while giving the service, such as soap, cloth, chemicals or stationery.", example: "0.8" },
  "Annual service volume (jobs or customers)": { ask: "How many jobs or customers do you expect in a year?", help: "Count each job done or each customer served.", example: "1800" },
  "How the service is delivered": { ask: "How do you carry out your service?", help: "Say the steps from a customer asking to the work being finished and paid for.", example: "Customer books by phone, we visit or they come to the shop, we do the work and take payment the same day." },
  "Cost of goods bought for resale (₹ Lakhs)": { ask: "How much will you spend buying goods to resell in a year?", help: "The cost of the stock you buy, before adding your profit.", example: "12" },
  "Annual sales volume (units)": { ask: "How many items do you expect to sell in a year?", help: "Count the units you sell, such as packets, pieces or kilos.", example: "24000" },
  "How you buy and sell": { ask: "How do you buy your goods and sell them?", help: "Say where you buy from, how you store the goods and who your customers are.", example: "Buy from the wholesale market twice a week, sell from the shop to families nearby." },
};
