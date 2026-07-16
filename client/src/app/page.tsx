import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, ArrowRight, Star, TrendingUp, ShieldCheck, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b bg-white/80 dark:bg-black/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter">
            <ShoppingBag className="w-6 h-6 text-primary" />
            YOX
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition-colors">Shop</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Categories</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Trending</Link>
            <Link href="#" className="hover:text-foreground transition-colors">About Us</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="font-semibold">Sign In</Button>
            </Link>
            <Button className="font-semibold rounded-full px-6 shadow-md hover:shadow-lg transition-all">
              Cart (0)
            </Button>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-32 lg:pt-36 lg:pb-40">
          {/* Background decorative blobs */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-primary/20 via-primary/5 to-transparent rounded-[100%] blur-[120px] -z-10 pointer-events-none" />
          
          <div className="container mx-auto px-4 text-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Star className="w-4 h-4 fill-primary" /> Summer Collection 2026 is here
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1] mb-8">
              Elevate your style with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">premium</span> aesthetics.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Discover a curated collection of modern fashion, tech, and lifestyle essentials. Designed for those who appreciate the finer details.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-xl hover:scale-105 transition-transform">
                Shop Collection
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full group">
                Explore Categories 
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-y bg-white dark:bg-zinc-950/50 py-16">
          <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x">
            <div className="flex flex-col items-center space-y-3 p-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg">Free Global Shipping</h3>
              <p className="text-sm text-muted-foreground">On all orders over $150.</p>
            </div>
            <div className="flex flex-col items-center space-y-3 p-6">
              <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-950 flex items-center justify-center text-green-600 dark:text-green-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg">Secure Payments</h3>
              <p className="text-sm text-muted-foreground">Encrypted transactions & fraud protection.</p>
            </div>
            <div className="flex flex-col items-center space-y-3 p-6">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg">Premium Quality</h3>
              <p className="text-sm text-muted-foreground">Hand-picked materials and craftsmanship.</p>
            </div>
          </div>
        </section>

        {/* Trending Products Mockup */}
        <section className="py-24 container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Trending Now</h2>
              <p className="text-muted-foreground">Handpicked favorites by our community.</p>
            </div>
            <Link href="#" className="hidden sm:flex items-center text-primary font-medium hover:underline">
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Mock Product 1 */}
            <div className="group cursor-pointer">
              <div className="relative aspect-[4/5] bg-zinc-100 dark:bg-zinc-900 rounded-2xl overflow-hidden mb-4">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                  <Button className="rounded-full shadow-lg">Quick Add</Button>
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">Minimalist Leather Tote</h3>
                <p className="text-muted-foreground text-sm">Accessories</p>
                <p className="font-bold text-lg">$129.00</p>
              </div>
            </div>

            {/* Mock Product 2 */}
            <div className="group cursor-pointer">
              <div className="relative aspect-[4/5] bg-zinc-100 dark:bg-zinc-900 rounded-2xl overflow-hidden mb-4">
                <div className="absolute top-3 left-3 bg-white text-black text-xs font-bold px-2 py-1 rounded-full shadow-sm z-10">NEW</div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                  <Button className="rounded-full shadow-lg">Quick Add</Button>
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">Oversized Cotton Hoodie</h3>
                <p className="text-muted-foreground text-sm">Apparel</p>
                <p className="font-bold text-lg">$85.00</p>
              </div>
            </div>

            {/* Mock Product 3 */}
            <div className="group cursor-pointer">
              <div className="relative aspect-[4/5] bg-zinc-100 dark:bg-zinc-900 rounded-2xl overflow-hidden mb-4">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                  <Button className="rounded-full shadow-lg">Quick Add</Button>
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">Ceramic Coffee Set</h3>
                <p className="text-muted-foreground text-sm">Home</p>
                <p className="font-bold text-lg">$45.00</p>
              </div>
            </div>

            {/* Mock Product 4 */}
            <div className="group cursor-pointer">
              <div className="relative aspect-[4/5] bg-zinc-100 dark:bg-zinc-900 rounded-2xl overflow-hidden mb-4">
                <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm z-10">SALE</div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                  <Button className="rounded-full shadow-lg">Quick Add</Button>
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">Everyday Sneakers</h3>
                <p className="text-muted-foreground text-sm">Footwear</p>
                <div className="flex gap-2 items-center">
                  <p className="font-bold text-lg text-red-500">$89.00</p>
                  <p className="text-sm text-muted-foreground line-through">$120.00</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-zinc-950 text-zinc-400 py-12 text-sm">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-bold text-xl text-white">
              <ShoppingBag className="w-5 h-5" />
              YOX
            </div>
            <p className="max-w-xs">Building the future of e-commerce with premium design and bleeding-edge technology.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Shop</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="hover:text-white transition-colors">All Products</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Sale</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">New Arrivals</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Shipping</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Returns</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-12 pt-8 border-t border-zinc-800 text-center">
          <p>© {new Date().getFullYear()} YOX E-Commerce. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
