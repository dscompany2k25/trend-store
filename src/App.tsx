import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/hooks/useCart";
import { TikTokPixelProvider } from "@/hooks/useTikTokPixel";
import { usePageView } from "@/hooks/usePageView";
import Index from "./pages/Index.tsx";
import ProductPage from "./pages/ProductPage.tsx";
import CartPage from "./pages/CartPage.tsx";
import ThankYouPage from "./pages/ThankYouPage.tsx";
import AdminPage from "./pages/AdminPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import BlogPage from "./pages/BlogPage.tsx";
import BlogPostPage from "./pages/BlogPostPage.tsx";

const queryClient = new QueryClient();

function PageViewTracker() {
  usePageView();
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <TikTokPixelProvider>
          <Toaster />
          <BrowserRouter>
            <PageViewTracker />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/producto/:id" element={<ProductPage />} />
              <Route path="/carrito" element={<CartPage />} />
              <Route path="/gracias/:orderId" element={<ThankYouPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TikTokPixelProvider>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
