import { CheckoutContainer } from "@/components/checkout/CheckoutContainer"
import { TooltipProvider } from "./components/ui/tooltip"

export function App() {
  return (
    <TooltipProvider>
      <CheckoutContainer />
    </TooltipProvider>
  )
}

export default App
